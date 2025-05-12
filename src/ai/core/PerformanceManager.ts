import { EventEmitter } from 'events';
import { AgentResponse, AgentMessage } from '../types/agents';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { Cache } from '@/lib/cache';

interface BatchRequest {
  message: AgentMessage;
  resolve: (value: AgentResponse) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface PerformanceMetrics {
  batchesProcessed: number;
  totalRequests: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  errorRate: number;
  activeOperations: number;
  lastError?: Error;
  lastErrorTime?: number;
}

export class PerformanceManager extends EventEmitter {
  private static instance: PerformanceManager;
  private batchQueue: Map<string, BatchRequest[]>;
  private cache: Map<string, CacheEntry<any>>;
  private rateLimits: Map<string, { count: number; resetTime: number }>;
  private optimizer: PerformanceOptimizer;
  private batchTimer: NodeJS.Timeout | null;
  private cleanupTimer: NodeJS.Timeout | null;
  private metrics: PerformanceMetrics;
  private isShuttingDown: boolean = false;

  private constructor() {
    super();
    this.batchQueue = new Map();
    this.cache = new Map();
    this.rateLimits = new Map();
    this.batchTimer = null;
    this.cleanupTimer = null;
    this.metrics = {
      batchesProcessed: 0,
      totalRequests: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      activeOperations: 0,
    };

    try {
      this.optimizer = PerformanceOptimizer.getInstance({
        slowOperationThreshold: 2000,
        maxConcurrentOperations: 50,
        resourceMonitoringInterval: 30000,
      });
    } catch (error) {
      console.error('Failed to initialize PerformanceOptimizer:', error);
      throw new Error('Performance optimization system initialization failed');
    }

    // Start periodic cleanup and metrics collection
    this.startCleanupTimer();
  }

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  // Request Batching
  public async batchRequest(
    agentId: string,
    message: AgentMessage,
    batchWindow: number = 100
  ): Promise<AgentResponse> {
    if (this.isShuttingDown) {
      throw new Error('PerformanceManager is shutting down');
    }

    if (!agentId || !message) {
      throw new Error('Invalid batch request parameters');
    }

    this.metrics.totalRequests++;
    const operationId = this.optimizer.startOperation('batch_request');
    this.metrics.activeOperations++;

    try {
      return await new Promise((resolve, reject) => {
        const request: BatchRequest = {
          message,
          resolve,
          reject,
          timestamp: Date.now(),
        };

        if (!this.batchQueue.has(agentId)) {
          this.batchQueue.set(agentId, []);
        }

        const queue = this.batchQueue.get(agentId);
        if (!queue) {
          throw new Error('Failed to access batch queue');
        }

        queue.push(request);

        // Set up batch processing timer if not already running
        if (!this.batchTimer) {
          this.batchTimer = setTimeout(() => {
            this.processBatch().catch((err) => {
              console.error('Batch processing error:', err);
              this.emit('batch_error', err);
              this.updateErrorMetrics(err);
            });
          }, batchWindow);
        }
      });
    } catch (error) {
      this.updateErrorMetrics(error);
      this.optimizer.endOperation('batch_request', operationId);
      this.metrics.activeOperations--;
      throw error;
    }
  }

  // Cache Management
  public async getCached<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      this.updateCacheMetrics();
      return entry.data;
    }
    return undefined;
  }

  public async cache<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
    this.updateCacheMetrics();

    // Set expiration
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  // Rate Limiting
  public checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const rateLimitInfo = this.rateLimits.get(key);

    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (rateLimitInfo.count >= limit) {
      return false;
    }

    rateLimitInfo.count++;
    return true;
  }

  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const startTime = Date.now();
    let totalProcessed = 0;
    let errors = 0;

    for (const [agentId, requests] of this.batchQueue.entries()) {
      if (requests.length === 0) continue;

      try {
        const batchResponse = await this.processGroupRequest(requests[0].message);
        
        // Process all requests in the batch
        requests.forEach((request) => {
          try {
            request.resolve(batchResponse);
            totalProcessed++;
          } catch (error) {
            request.reject(error as Error);
            errors++;
            this.updateErrorMetrics(error);
          }
        });
      } catch (error) {
        requests.forEach((request) => {
          request.reject(error as Error);
        });
        errors += requests.length;
        this.updateErrorMetrics(error);
      }
    }

    // Clear processed requests
    this.batchQueue.clear();

    // Update metrics
    this.metrics.batchesProcessed++;
    const processingTime = Date.now() - startTime;
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (this.metrics.batchesProcessed - 1) +
        processingTime) /
      this.metrics.batchesProcessed;

    this.emit('batchProcessed', {
      totalProcessed,
      errors,
      processingTime,
    });
  }

  private async processGroupRequest(message: AgentMessage): Promise<AgentResponse> {
    if (!message || !message.type) {
      throw new Error('Invalid message format');
    }

    try {
      // This is a placeholder - the actual implementation would be provided by the agent
      return {
        type: message.type,
        data: message.data,
        metadata: {
          timestamp: Date.now(),
          batched: true,
        },
      };
    } catch (error) {
      console.error('Group request processing error:', error);
      throw error;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
      this.collectMetrics();
    }, 60000); // Run every minute
  }

  private cleanup(): void {
    const now = Date.now();

    // Clean up expired cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > 300000) { // 5 minutes TTL
        this.cache.delete(key);
      }
    }

    // Clean up expired rate limits
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  private updateErrorMetrics(error: any): void {
    this.metrics.errorRate =
      (this.metrics.errorRate * this.metrics.totalRequests +
        (error ? 1 : 0)) /
      (this.metrics.totalRequests + 1);
    
    if (error) {
      this.metrics.lastError = error;
      this.metrics.lastErrorTime = Date.now();
    }
  }

  private updateCacheMetrics(): void {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    this.metrics.cacheHitRate = totalEntries > 0 ? totalHits / totalEntries : 0;
  }

  private collectMetrics(): void {
    this.emit('metrics', { ...this.metrics });
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public shutdown(): void {
    this.isShuttingDown = true;
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.batchQueue.clear();
    this.cache.clear();
    this.rateLimits.clear();
  }
} 