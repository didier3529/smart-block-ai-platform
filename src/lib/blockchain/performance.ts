import { ethers } from 'ethers';
import { BlockchainConfig, ChainId, TransactionData, BlockData } from './types';
import { BlockchainError } from './errors';
import { withRetry } from './utils';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  averageResponseTime: number;
  lastError?: Error;
  lastErrorTime?: number;
}

interface BatchRequest {
  method: string;
  params: any[];
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class BatchProcessor extends EventEmitter {
  private batchSize: number;
  private batchTimeout: number;
  private pendingBatches: Map<ChainId, BatchRequest[]>;
  private batchTimers: Map<ChainId, NodeJS.Timeout>;
  private metrics: Map<ChainId, { processed: number; failed: number; averageTime: number }>;

  constructor(batchSize = 100, batchTimeout = 50) {
    super();
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
    this.pendingBatches = new Map();
    this.batchTimers = new Map();
    this.metrics = new Map();
  }

  async addToBatch(
    chainId: ChainId,
    method: string,
    params: any[],
    provider: ethers.JsonRpcProvider
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.pendingBatches.has(chainId)) {
        this.pendingBatches.set(chainId, []);
        this.metrics.set(chainId, { processed: 0, failed: 0, averageTime: 0 });
      }

      const request: BatchRequest = {
        method,
        params,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      const batch = this.pendingBatches.get(chainId)!;
      batch.push(request);

      // Process batch if size threshold reached
      if (batch.length >= this.batchSize) {
        this.processBatch(chainId, provider);
      } else {
        // Set timer for processing if not already set
        if (!this.batchTimers.has(chainId)) {
          const timer = setTimeout(() => {
            this.processBatch(chainId, provider);
          }, this.batchTimeout);
          this.batchTimers.set(chainId, timer);
        }
      }
    });
  }

  private async processBatch(chainId: ChainId, provider: ethers.JsonRpcProvider): Promise<void> {
    const timer = this.batchTimers.get(chainId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(chainId);
    }

    const requests = this.pendingBatches.get(chainId) || [];
    if (requests.length === 0) return;

    this.pendingBatches.set(chainId, []);

    const startTime = Date.now();
    const metrics = this.metrics.get(chainId)!;

    try {
      const batch = requests.map((req, index) => ({
        jsonrpc: '2.0',
        id: index,
        method: req.method,
        params: req.params,
      }));

      const results = await this.withRetry(() => provider.send('eth_batch', [batch]));

      // Process results and update metrics
      results.forEach((result: any, index: number) => {
        const request = requests[index];
        const processingTime = Date.now() - request.timestamp;

        if (result.error) {
          metrics.failed++;
          request.reject(new BlockchainError(result.error.message));
        } else {
          metrics.processed++;
          metrics.averageTime =
            (metrics.averageTime * (metrics.processed - 1) + processingTime) / metrics.processed;
          request.resolve(result.result);
        }
      });

      this.emit('batchProcessed', {
        chainId,
        batchSize: requests.length,
        processingTime: Date.now() - startTime,
        metrics,
      });
    } catch (error) {
      metrics.failed += requests.length;
      requests.forEach((request) => {
        request.reject(new BlockchainError(`Batch request failed: ${error.message}`));
      });
      this.emit('batchError', { chainId, error, metrics });
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, i)));
        }
      }
    }
    throw lastError;
  }

  getMetrics(chainId: ChainId) {
    return this.metrics.get(chainId);
  }
}

export class ConnectionPool extends EventEmitter {
  private maxConnections: number;
  private idleTimeout: number;
  private providers: Map<ChainId, ethers.JsonRpcProvider[]>;
  private inUse: Map<ChainId, Set<ethers.JsonRpcProvider>>;
  private lastUsed: Map<ethers.JsonRpcProvider, number>;
  private metrics: Map<ChainId, ConnectionMetrics>;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(maxConnections = 5, idleTimeout = 60000, healthCheckInterval = 30000) {
    super();
    this.maxConnections = maxConnections;
    this.idleTimeout = idleTimeout;
    this.providers = new Map();
    this.inUse = new Map();
    this.lastUsed = new Map();
    this.metrics = new Map();

    // Start health check interval
    this.healthCheckInterval = setInterval(() => this.checkHealth(), healthCheckInterval);
  }

  async getProvider(chainId: ChainId, config: { rpcUrl: string }): Promise<ethers.JsonRpcProvider> {
    if (!this.providers.has(chainId)) {
      this.providers.set(chainId, []);
      this.inUse.set(chainId, new Set());
      this.metrics.set(chainId, {
        totalConnections: 0,
        activeConnections: 0,
        failedConnections: 0,
        averageResponseTime: 0,
      });
    }

    const providers = this.providers.get(chainId)!;
    const inUse = this.inUse.get(chainId)!;
    const metrics = this.metrics.get(chainId)!;

    // Try to find an available provider
    for (const provider of providers) {
      if (!inUse.has(provider)) {
        inUse.add(provider);
        this.lastUsed.set(provider, Date.now());
        metrics.activeConnections++;
        return provider;
      }
    }

    // Create new provider if possible
    if (providers.length < this.maxConnections) {
      try {
        const startTime = Date.now();
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        await provider.getNetwork(); // Test connection
        
        providers.push(provider);
        inUse.add(provider);
        this.lastUsed.set(provider, Date.now());
        
        metrics.totalConnections++;
        metrics.activeConnections++;
        metrics.averageResponseTime =
          (metrics.averageResponseTime * (metrics.totalConnections - 1) +
            (Date.now() - startTime)) /
          metrics.totalConnections;

        return provider;
      } catch (error) {
        metrics.failedConnections++;
        metrics.lastError = error as Error;
        metrics.lastErrorTime = Date.now();
        throw new BlockchainError(`Failed to create provider: ${error.message}`);
      }
    }

    // Wait for a provider to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const provider of providers) {
          if (!inUse.has(provider)) {
            clearInterval(checkInterval);
            inUse.add(provider);
            this.lastUsed.set(provider, Date.now());
            metrics.activeConnections++;
            resolve(provider);
            return;
          }
        }
      }, 100);
    });
  }

  releaseProvider(chainId: ChainId, provider: ethers.JsonRpcProvider): void {
    const inUse = this.inUse.get(chainId);
    if (inUse?.has(provider)) {
      inUse.delete(provider);
      this.lastUsed.set(provider, Date.now());
      const metrics = this.metrics.get(chainId);
      if (metrics) {
        metrics.activeConnections--;
      }
    }
  }

  private async checkHealth(): Promise<void> {
    const now = Date.now();

    for (const [chainId, providers] of this.providers) {
      const metrics = this.metrics.get(chainId)!;
      const inUse = this.inUse.get(chainId)!;

      for (const provider of providers) {
        try {
          if (!inUse.has(provider)) {
            const lastUsedTime = this.lastUsed.get(provider) || 0;
            if (now - lastUsedTime > this.idleTimeout) {
              // Remove idle connection
              const index = providers.indexOf(provider);
              if (index > -1) {
                providers.splice(index, 1);
                this.lastUsed.delete(provider);
                metrics.totalConnections--;
              }
            } else {
              // Test connection health
              await provider.getNetwork();
            }
          }
        } catch (error) {
          metrics.failedConnections++;
          metrics.lastError = error as Error;
          metrics.lastErrorTime = now;
          this.emit('connectionError', { chainId, provider, error });
        }
      }
    }
  }

  getMetrics(chainId: ChainId): ConnectionMetrics | undefined {
    return this.metrics.get(chainId);
  }

  cleanup(): void {
    clearInterval(this.healthCheckInterval);
    for (const [chainId, providers] of this.providers) {
      providers.length = 0;
      this.inUse.get(chainId)?.clear();
    }
    this.providers.clear();
    this.inUse.clear();
    this.lastUsed.clear();
    this.metrics.clear();
  }
}

export class PerformanceMetrics {
  private metrics: Map<string, {
    count: number;
    totalTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
  }>;

  constructor() {
    this.metrics = new Map();
  }

  startOperation(operation: string): number {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity,
        errors: 0
      });
    }
    return Date.now();
  }

  endOperation(operation: string, startTime: number, error?: Error): void {
    const duration = Date.now() - startTime;
    const metric = this.metrics.get(operation)!;

    metric.count++;
    metric.totalTime += duration;
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.minTime = Math.min(metric.minTime, duration);
    
    if (error) {
      metric.errors++;
    }
  }

  getMetrics(): Map<string, {
    count: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
    errorRate: number;
  }> {
    const result = new Map();
    
    for (const [operation, metric] of this.metrics) {
      result.set(operation, {
        count: metric.count,
        avgTime: metric.count > 0 ? metric.totalTime / metric.count : 0,
        maxTime: metric.maxTime,
        minTime: metric.minTime === Infinity ? 0 : metric.minTime,
        errorRate: metric.count > 0 ? metric.errors / metric.count : 0
      });
    }

    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startOperation(operation: string): number {
    const startTime = performance.now();
    if (this.isEnabled) {
      this.metrics.push({
        operation,
        startTime,
        success: false
      });
    }
    return startTime;
  }

  endOperation(operation: string, startTime: number, error?: Error): void {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (this.isEnabled) {
      const metric = this.metrics.find(
        m => m.operation === operation && m.startTime === startTime
      );

      if (metric) {
        metric.endTime = endTime;
        metric.duration = duration;
        metric.success = !error;
        if (error) metric.error = error.message;

        // Log performance data
        console.log(`Performance - ${operation}:`, {
          duration: `${duration.toFixed(2)}ms`,
          success: !error,
          ...(error && { error: error.message })
        });

        // Warn if operation is slow (>3s)
        if (duration > 3000) {
          console.warn(`Slow operation detected - ${operation}: ${duration.toFixed(2)}ms`);
        }
      }
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance(); 