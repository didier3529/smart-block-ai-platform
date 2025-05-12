import { EventEmitter } from 'events';
import { PerformanceMonitor } from '../performance/monitor';

interface OptimizationConfig {
  targetLatency?: number;
  targetThroughput?: number;
  memoryThreshold?: number;
  samplingInterval?: number;
  adaptiveWindow?: number;
  maxBatchSize?: number;
  minBatchSize?: number;
}

interface PerformanceMetrics {
  currentLatency: number;
  currentThroughput: number;
  memoryUsage: number;
  batchSize: number;
  optimizationCount: number;
  adaptiveActions: number;
  resourceUtilization: number;
}

interface ResourceMetrics {
  cpu: number;
  memory: number;
  eventLoop: number;
  network: number;
}

export class PerformanceOptimizer extends EventEmitter {
  private performanceMonitor: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private config: Required<OptimizationConfig>;
  private samplingInterval: NodeJS.Timeout;
  private adaptiveWindow: number[];
  private lastOptimization: number;
  private resourceMetrics: ResourceMetrics;

  constructor(config: OptimizationConfig = {}) {
    super();
    this.performanceMonitor = PerformanceMonitor.getInstance();

    this.config = {
      targetLatency: config.targetLatency || 100,
      targetThroughput: config.targetThroughput || 1000,
      memoryThreshold: config.memoryThreshold || 0.8,
      samplingInterval: config.samplingInterval || 1000,
      adaptiveWindow: config.adaptiveWindow || 60000,
      maxBatchSize: config.maxBatchSize || 1000,
      minBatchSize: config.minBatchSize || 10
    };

    this.metrics = {
      currentLatency: 0,
      currentThroughput: 0,
      memoryUsage: 0,
      batchSize: this.config.minBatchSize,
      optimizationCount: 0,
      adaptiveActions: 0,
      resourceUtilization: 0
    };

    this.resourceMetrics = {
      cpu: 0,
      memory: 0,
      eventLoop: 0,
      network: 0
    };

    this.adaptiveWindow = [];
    this.lastOptimization = Date.now();

    // Start performance monitoring
    this.samplingInterval = setInterval(() => this.sampleMetrics(), this.config.samplingInterval);
  }

  async optimize(): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('performanceOptimizer.optimize');

    try {
      // Check if we need to optimize
      if (!this.shouldOptimize()) {
        return;
      }

      this.metrics.optimizationCount++;
      this.lastOptimization = Date.now();

      // Collect current metrics
      await this.updateResourceMetrics();

      // Perform optimizations
      await this.optimizeLatency();
      await this.optimizeThroughput();
      await this.optimizeMemory();
      await this.optimizeBatchSize();

      // Emit optimization event
      this.emit('optimization:complete', {
        metrics: this.getMetrics(),
        resources: this.resourceMetrics
      });

      this.performanceMonitor.endOperation('performanceOptimizer.optimize', startTime);
    } catch (error) {
      this.performanceMonitor.endOperation('performanceOptimizer.optimize', startTime, error as Error);
      throw error;
    }
  }

  private shouldOptimize(): boolean {
    const now = Date.now();
    const timeSinceLastOptimization = now - this.lastOptimization;

    // Don't optimize too frequently
    if (timeSinceLastOptimization < this.config.samplingInterval) {
      return false;
    }

    // Check if performance is within acceptable ranges
    const latencyOk = this.metrics.currentLatency <= this.config.targetLatency;
    const throughputOk = this.metrics.currentThroughput >= this.config.targetThroughput;
    const memoryOk = this.metrics.memoryUsage <= this.config.memoryThreshold;

    return !(latencyOk && throughputOk && memoryOk);
  }

  private async optimizeLatency(): Promise<void> {
    if (this.metrics.currentLatency > this.config.targetLatency) {
      // Reduce batch size to improve latency
      const newBatchSize = Math.max(
        this.config.minBatchSize,
        Math.floor(this.metrics.batchSize * 0.8)
      );

      if (newBatchSize !== this.metrics.batchSize) {
        this.metrics.batchSize = newBatchSize;
        this.metrics.adaptiveActions++;
        this.emit('optimization:latency', { newBatchSize });
      }
    }
  }

  private async optimizeThroughput(): Promise<void> {
    if (this.metrics.currentThroughput < this.config.targetThroughput) {
      // Increase batch size to improve throughput if resources allow
      if (this.resourceMetrics.cpu < 0.8 && this.resourceMetrics.memory < 0.8) {
        const newBatchSize = Math.min(
          this.config.maxBatchSize,
          Math.floor(this.metrics.batchSize * 1.2)
        );

        if (newBatchSize !== this.metrics.batchSize) {
          this.metrics.batchSize = newBatchSize;
          this.metrics.adaptiveActions++;
          this.emit('optimization:throughput', { newBatchSize });
        }
      }
    }
  }

  private async optimizeMemory(): Promise<void> {
    if (this.metrics.memoryUsage > this.config.memoryThreshold) {
      // Reduce batch size to decrease memory usage
      const newBatchSize = Math.max(
        this.config.minBatchSize,
        Math.floor(this.metrics.batchSize * 0.7)
      );

      if (newBatchSize !== this.metrics.batchSize) {
        this.metrics.batchSize = newBatchSize;
        this.metrics.adaptiveActions++;
        this.emit('optimization:memory', { newBatchSize });
      }

      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  private async optimizeBatchSize(): Promise<void> {
    // Use adaptive window to determine optimal batch size
    const windowSum = this.adaptiveWindow.reduce((sum, value) => sum + value, 0);
    const windowAvg = windowSum / this.adaptiveWindow.length;

    if (windowAvg > this.config.targetLatency) {
      // Reduce batch size
      const newBatchSize = Math.max(
        this.config.minBatchSize,
        Math.floor(this.metrics.batchSize * 0.9)
      );

      if (newBatchSize !== this.metrics.batchSize) {
        this.metrics.batchSize = newBatchSize;
        this.metrics.adaptiveActions++;
        this.emit('optimization:batch_size', { newBatchSize });
      }
    } else if (windowAvg < this.config.targetLatency * 0.8) {
      // Increase batch size
      const newBatchSize = Math.min(
        this.config.maxBatchSize,
        Math.floor(this.metrics.batchSize * 1.1)
      );

      if (newBatchSize !== this.metrics.batchSize) {
        this.metrics.batchSize = newBatchSize;
        this.metrics.adaptiveActions++;
        this.emit('optimization:batch_size', { newBatchSize });
      }
    }
  }

  private async sampleMetrics(): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('performanceOptimizer.sample');

    try {
      // Update metrics
      this.metrics.currentLatency = await this.measureLatency();
      this.metrics.currentThroughput = await this.measureThroughput();
      this.metrics.memoryUsage = await this.measureMemoryUsage();

      // Update adaptive window
      this.adaptiveWindow.push(this.metrics.currentLatency);
      if (this.adaptiveWindow.length > 60) { // Keep last minute of samples
        this.adaptiveWindow.shift();
      }

      // Update resource utilization
      this.metrics.resourceUtilization = (
        this.resourceMetrics.cpu +
        this.resourceMetrics.memory +
        this.resourceMetrics.eventLoop +
        this.resourceMetrics.network
      ) / 4;

      this.emit('metrics:update', this.getMetrics());
      this.performanceMonitor.endOperation('performanceOptimizer.sample', startTime);
    } catch (error) {
      this.performanceMonitor.endOperation('performanceOptimizer.sample', startTime, error as Error);
    }
  }

  private async measureLatency(): Promise<number> {
    // Implement actual latency measurement
    return this.performanceMonitor.getAverageLatency() || 0;
  }

  private async measureThroughput(): Promise<number> {
    // Implement actual throughput measurement
    return this.performanceMonitor.getMessageRate() || 0;
  }

  private async measureMemoryUsage(): Promise<number> {
    const used = process.memoryUsage();
    return used.heapUsed / used.heapTotal;
  }

  private async updateResourceMetrics(): Promise<void> {
    // Update CPU usage
    this.resourceMetrics.cpu = process.cpuUsage().user / process.cpuUsage().system;

    // Update memory usage
    const memoryUsage = process.memoryUsage();
    this.resourceMetrics.memory = memoryUsage.heapUsed / memoryUsage.heapTotal;

    // Update event loop lag (simplified)
    const start = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    this.resourceMetrics.eventLoop = (Date.now() - start) / 10; // Normalize to 0-1

    // Update network metrics (simplified)
    this.resourceMetrics.network = this.metrics.currentThroughput / this.config.targetThroughput;
  }

  getBatchSize(): number {
    return this.metrics.batchSize;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getResourceMetrics(): ResourceMetrics {
    return { ...this.resourceMetrics };
  }

  cleanup(): void {
    clearInterval(this.samplingInterval);
    this.adaptiveWindow = [];
  }
} 