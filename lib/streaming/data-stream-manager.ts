import { EventEmitter } from 'events';
import { MessageBatcher } from '../providers/websocket-performance';
import { ConnectionPool } from '../providers/websocket-connection-pool';
import { PerformanceMonitor } from '../performance/monitor';

interface StreamConfig {
  batchSize?: number;
  batchTimeout?: number;
  maxQueueSize?: number;
  priorityLevels?: number;
  rateLimit?: number;
}

interface StreamMetrics {
  throughput: number;
  latency: number;
  backpressure: number;
  droppedMessages: number;
  processedMessages: number;
  activeStreams: number;
  queueSize: number;
}

export class DataStreamManager extends EventEmitter {
  private batcher: MessageBatcher;
  private connectionPool: ConnectionPool;
  private performanceMonitor: PerformanceMonitor;
  private activeStreams: Map<string, StreamConfig>;
  private metrics: StreamMetrics;

  constructor(config: StreamConfig = {}) {
    super();
    
    // Initialize components with performance-optimized defaults
    this.batcher = new MessageBatcher({
      batchSize: config.batchSize || 100,
      batchTimeout: config.batchTimeout || 50,
      maxQueueSize: config.maxQueueSize || 1000,
      priorityLevels: config.priorityLevels || 3,
      rateLimit: config.rateLimit || 1000
    });

    this.connectionPool = new ConnectionPool({
      maxConnections: 10,
      idleTimeout: 30000,
      acquireTimeout: 5000
    });

    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.activeStreams = new Map();
    
    this.metrics = {
      throughput: 0,
      latency: 0,
      backpressure: 0,
      droppedMessages: 0,
      processedMessages: 0,
      activeStreams: 0,
      queueSize: 0
    };

    this.setupMetricsCollection();
  }

  async createStream(streamId: string, config: StreamConfig = {}): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('createStream');
    
    try {
      // Get connection from pool
      const connection = await this.connectionPool.acquire();
      
      // Store stream configuration
      this.activeStreams.set(streamId, {
        ...config,
        batchSize: config.batchSize || 100,
        batchTimeout: config.batchTimeout || 50,
        maxQueueSize: config.maxQueueSize || 1000
      });

      // Update metrics
      this.metrics.activeStreams = this.activeStreams.size;
      
      this.emit('stream:created', { streamId, config });
      
      this.performanceMonitor.endOperation('createStream', startTime);
    } catch (error) {
      this.performanceMonitor.endOperation('createStream', startTime, error as Error);
      throw error;
    }
  }

  async pushToStream(streamId: string, data: any, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('pushToStream');
    
    try {
      const streamConfig = this.activeStreams.get(streamId);
      if (!streamConfig) {
        throw new Error(`Stream ${streamId} not found`);
      }

      // Add to batch processor with priority
      this.batcher.add({
        id: streamId,
        event: 'data',
        data,
        timestamp: Date.now(),
        priority
      });

      // Update metrics
      this.updateMetrics();
      
      this.performanceMonitor.endOperation('pushToStream', startTime);
    } catch (error) {
      this.performanceMonitor.endOperation('pushToStream', startTime, error as Error);
      throw error;
    }
  }

  private setupMetricsCollection(): void {
    // Collect metrics every second
    setInterval(() => {
      const batcherMetrics = this.batcher.getMetrics();
      const poolMetrics = this.connectionPool.getMetrics();
      
      this.metrics = {
        ...this.metrics,
        throughput: batcherMetrics.processedMessages,
        latency: batcherMetrics.averageLatency,
        backpressure: batcherMetrics.backpressure,
        droppedMessages: batcherMetrics.droppedMessages,
        processedMessages: batcherMetrics.processedMessages,
        queueSize: batcherMetrics.queueSize
      };

      // Emit metrics for monitoring
      this.emit('metrics:update', this.metrics);
      
      // Log performance warnings if needed
      this.checkPerformanceThresholds();
    }, 1000);
  }

  private checkPerformanceThresholds(): void {
    // Check for high latency
    if (this.metrics.latency > 1000) {
      this.emit('performance:warning', {
        type: 'high-latency',
        value: this.metrics.latency,
        threshold: 1000
      });
    }

    // Check for high backpressure
    if (this.metrics.backpressure > 0.8) {
      this.emit('performance:warning', {
        type: 'high-backpressure',
        value: this.metrics.backpressure,
        threshold: 0.8
      });
    }

    // Check for high drop rate
    const dropRate = this.metrics.droppedMessages / 
      (this.metrics.processedMessages + this.metrics.droppedMessages);
    if (dropRate > 0.1) {
      this.emit('performance:warning', {
        type: 'high-drop-rate',
        value: dropRate,
        threshold: 0.1
      });
    }
  }

  private updateMetrics(): void {
    const batcherMetrics = this.batcher.getMetrics();
    Object.assign(this.metrics, {
      queueSize: batcherMetrics.queueSize,
      processedMessages: batcherMetrics.processedMessages,
      droppedMessages: batcherMetrics.droppedMessages
    });
  }

  getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  async closeStream(streamId: string): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('closeStream');
    
    try {
      const connection = await this.connectionPool.acquire();
      
      // Clean up stream resources
      this.activeStreams.delete(streamId);
      this.metrics.activeStreams = this.activeStreams.size;
      
      await this.connectionPool.release(connection);
      
      this.emit('stream:closed', { streamId });
      
      this.performanceMonitor.endOperation('closeStream', startTime);
    } catch (error) {
      this.performanceMonitor.endOperation('closeStream', startTime, error as Error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('cleanup');
    
    try {
      // Close all active streams
      for (const streamId of this.activeStreams.keys()) {
        await this.closeStream(streamId);
      }
      
      // Clean up resources
      this.batcher.clear();
      await this.connectionPool.cleanup();
      
      this.performanceMonitor.endOperation('cleanup', startTime);
    } catch (error) {
      this.performanceMonitor.endOperation('cleanup', startTime, error as Error);
      throw error;
    }
  }
} 