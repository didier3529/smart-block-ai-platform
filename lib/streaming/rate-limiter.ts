import { PerformanceMonitor } from '../performance/monitor';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per second
}

interface RateLimiterConfig {
  defaultLimit?: number;
  defaultWindow?: number;
  bucketCapacity?: number;
  refillInterval?: number;
  overflowStrategy?: 'drop' | 'delay' | 'error';
  maxDelay?: number;
}

interface RateLimiterMetrics {
  totalRequests: number;
  limitedRequests: number;
  droppedRequests: number;
  delayedRequests: number;
  averageDelay: number;
  currentLoad: number;
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket>;
  private performanceMonitor: PerformanceMonitor;
  private metrics: RateLimiterMetrics;
  private config: Required<RateLimiterConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimiterConfig = {}) {
    this.buckets = new Map();
    this.performanceMonitor = PerformanceMonitor.getInstance();

    this.config = {
      defaultLimit: config.defaultLimit || 100,
      defaultWindow: config.defaultWindow || 1000,
      bucketCapacity: config.bucketCapacity || 1000,
      refillInterval: config.refillInterval || 100,
      overflowStrategy: config.overflowStrategy || 'delay',
      maxDelay: config.maxDelay || 5000
    };

    this.metrics = {
      totalRequests: 0,
      limitedRequests: 0,
      droppedRequests: 0,
      delayedRequests: 0,
      averageDelay: 0,
      currentLoad: 0
    };

    // Set up periodic token refill
    this.cleanupInterval = setInterval(() => this.refillTokens(), this.config.refillInterval);
  }

  async acquire(key: string, tokens: number = 1): Promise<boolean> {
    const startTime = this.performanceMonitor.startOperation('rateLimiter.acquire');

    try {
      this.metrics.totalRequests++;
      let bucket = this.buckets.get(key);

      if (!bucket) {
        bucket = this.createBucket();
        this.buckets.set(key, bucket);
      }

      const available = await this.checkAvailability(bucket, tokens);

      if (available) {
        bucket.tokens -= tokens;
        this.updateMetrics();
        this.performanceMonitor.endOperation('rateLimiter.acquire', startTime);
        return true;
      }

      this.metrics.limitedRequests++;

      switch (this.config.overflowStrategy) {
        case 'drop':
          this.metrics.droppedRequests++;
          this.performanceMonitor.endOperation('rateLimiter.acquire', startTime);
          return false;

        case 'delay':
          const delay = this.calculateDelay(bucket, tokens);
          if (delay > this.config.maxDelay) {
            this.metrics.droppedRequests++;
            this.performanceMonitor.endOperation('rateLimiter.acquire', startTime);
            return false;
          }

          this.metrics.delayedRequests++;
          this.updateAverageDelay(delay);
          await this.delay(delay);
          return this.acquire(key, tokens);

        case 'error':
          throw new Error('Rate limit exceeded');

        default:
          throw new Error('Invalid overflow strategy');
      }
    } catch (error) {
      this.performanceMonitor.endOperation('rateLimiter.acquire', startTime, error as Error);
      throw error;
    }
  }

  private createBucket(): TokenBucket {
    return {
      tokens: this.config.bucketCapacity,
      lastRefill: Date.now(),
      capacity: this.config.bucketCapacity,
      refillRate: this.config.bucketCapacity / (this.config.defaultWindow / 1000)
    };
  }

  private async checkAvailability(bucket: TokenBucket, tokens: number): Promise<boolean> {
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000;
    const refillAmount = Math.floor(timePassed * bucket.refillRate);

    if (refillAmount > 0) {
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + refillAmount);
      bucket.lastRefill = now;
    }

    return bucket.tokens >= tokens;
  }

  private calculateDelay(bucket: TokenBucket, tokens: number): number {
    const tokensNeeded = tokens - bucket.tokens;
    return Math.ceil((tokensNeeded / bucket.refillRate) * 1000);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private refillTokens(): void {
    const startTime = this.performanceMonitor.startOperation('rateLimiter.refill');

    try {
      const now = Date.now();
      for (const [key, bucket] of this.buckets.entries()) {
        const timePassed = (now - bucket.lastRefill) / 1000;
        const refillAmount = Math.floor(timePassed * bucket.refillRate);

        if (refillAmount > 0) {
          bucket.tokens = Math.min(bucket.capacity, bucket.tokens + refillAmount);
          bucket.lastRefill = now;
        }

        // Clean up empty buckets
        if (bucket.tokens === bucket.capacity) {
          this.buckets.delete(key);
        }
      }

      this.updateMetrics();
      this.performanceMonitor.endOperation('rateLimiter.refill', startTime);
    } catch (error) {
      this.performanceMonitor.endOperation('rateLimiter.refill', startTime, error as Error);
    }
  }

  private updateMetrics(): void {
    this.metrics.currentLoad = Array.from(this.buckets.values())
      .reduce((load, bucket) => load + (1 - bucket.tokens / bucket.capacity), 0) / this.buckets.size;
  }

  private updateAverageDelay(delay: number): void {
    const alpha = 0.1; // Exponential moving average factor
    this.metrics.averageDelay = alpha * delay + (1 - alpha) * this.metrics.averageDelay;
  }

  getMetrics(): RateLimiterMetrics {
    return { ...this.metrics };
  }

  cleanup(): void {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
} 