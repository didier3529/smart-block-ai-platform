import { EventEmitter } from 'events';
import { PerformanceMonitor } from '../performance/monitor';
import { DataTransformationPipeline } from './data-transformation-pipeline';
import { BlockchainEventManager } from './blockchain-event-manager';

interface StreamState {
  id: string;
  status: 'initializing' | 'active' | 'paused' | 'error' | 'closed';
  createdAt: number;
  lastActive: number;
  error?: Error;
  metadata: Record<string, any>;
}

interface StreamMetrics {
  activeStreams: number;
  totalMessages: number;
  messageRate: number;
  averageLatency: number;
  errors: number;
  backpressure: number;
}

interface StreamConfig {
  maxConcurrentStreams?: number;
  streamTimeout?: number;
  recoveryAttempts?: number;
  recoveryDelay?: number;
  bufferSize?: number;
}

export class StreamManager extends EventEmitter {
  private streams: Map<string, StreamState>;
  private transformationPipeline: DataTransformationPipeline;
  private eventManager: BlockchainEventManager;
  private performanceMonitor: PerformanceMonitor;
  private metrics: StreamMetrics;
  private config: Required<StreamConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    eventManager: BlockchainEventManager,
    config: StreamConfig = {}
  ) {
    super();
    this.streams = new Map();
    this.transformationPipeline = new DataTransformationPipeline();
    this.eventManager = eventManager;
    this.performanceMonitor = PerformanceMonitor.getInstance();

    this.config = {
      maxConcurrentStreams: config.maxConcurrentStreams || 100,
      streamTimeout: config.streamTimeout || 300000, // 5 minutes
      recoveryAttempts: config.recoveryAttempts || 3,
      recoveryDelay: config.recoveryDelay || 5000,
      bufferSize: config.bufferSize || 1000
    };

    this.metrics = {
      activeStreams: 0,
      totalMessages: 0,
      messageRate: 0,
      averageLatency: 0,
      errors: 0,
      backpressure: 0
    };

    // Set up cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Run every minute

    // Initialize transformation pipeline
    this.setupTransformationPipeline();
  }

  async createStream(id: string, metadata: Record<string, any> = {}): Promise<StreamState> {
    const startTime = this.performanceMonitor.startOperation('createStream');

    try {
      // Check concurrent stream limit
      if (this.streams.size >= this.config.maxConcurrentStreams) {
        throw new Error('Maximum concurrent streams limit reached');
      }

      const stream: StreamState = {
        id,
        status: 'initializing',
        createdAt: Date.now(),
        lastActive: Date.now(),
        metadata
      };

      this.streams.set(id, stream);
      this.metrics.activeStreams = this.streams.size;

      // Subscribe to blockchain events for this stream
      await this.eventManager.subscribe(
        'blockchain:data',
        async (data) => this.handleStreamData(id, data),
        { priority: 'high' }
      );

      stream.status = 'active';
      this.emit('stream:created', { id, metadata });

      this.performanceMonitor.endOperation('createStream', startTime);
      return stream;
    } catch (error) {
      this.performanceMonitor.endOperation('createStream', startTime, error as Error);
      throw error;
    }
  }

  async closeStream(id: string): Promise<boolean> {
    const stream = this.streams.get(id);
    if (!stream) return false;

    try {
      stream.status = 'closed';
      this.streams.delete(id);
      this.metrics.activeStreams = this.streams.size;
      this.emit('stream:closed', { id });
      return true;
    } catch (error) {
      this.handleError(id, error as Error);
      return false;
    }
  }

  async pauseStream(id: string): Promise<boolean> {
    const stream = this.streams.get(id);
    if (!stream) return false;

    try {
      stream.status = 'paused';
      stream.lastActive = Date.now();
      this.emit('stream:paused', { id });
      return true;
    } catch (error) {
      this.handleError(id, error as Error);
      return false;
    }
  }

  async resumeStream(id: string): Promise<boolean> {
    const stream = this.streams.get(id);
    if (!stream) return false;

    try {
      stream.status = 'active';
      stream.lastActive = Date.now();
      this.emit('stream:resumed', { id });
      return true;
    } catch (error) {
      this.handleError(id, error as Error);
      return false;
    }
  }

  private async handleStreamData(streamId: string, data: any): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('handleStreamData');
    const stream = this.streams.get(streamId);

    if (!stream || stream.status !== 'active') {
      return;
    }

    try {
      // Transform data through pipeline
      const transformedData = await this.transformationPipeline.process(data);

      // Update metrics
      this.metrics.totalMessages++;
      this.metrics.messageRate = this.calculateMessageRate();
      this.metrics.averageLatency = this.calculateAverageLatency(Date.now() - startTime);

      // Update stream state
      stream.lastActive = Date.now();

      // Emit transformed data
      this.emit('stream:data', { streamId, data: transformedData });

      this.performanceMonitor.endOperation('handleStreamData', startTime);
    } catch (error) {
      this.handleError(streamId, error as Error);
      this.performanceMonitor.endOperation('handleStreamData', startTime, error as Error);
    }
  }

  private handleError(streamId: string, error: Error): void {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    stream.status = 'error';
    stream.error = error;
    this.metrics.errors++;

    this.emit('stream:error', {
      streamId,
      error,
      status: stream.status
    });

    // Attempt recovery if configured
    this.attemptRecovery(streamId);
  }

  private async attemptRecovery(streamId: string, attempt: number = 1): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream || attempt > this.config.recoveryAttempts) {
      await this.closeStream(streamId);
      return;
    }

    setTimeout(async () => {
      try {
        await this.resumeStream(streamId);
      } catch (error) {
        await this.attemptRecovery(streamId, attempt + 1);
      }
    }, this.config.recoveryDelay * attempt);
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [id, stream] of this.streams.entries()) {
      // Close inactive streams
      if (now - stream.lastActive > this.config.streamTimeout) {
        this.closeStream(id);
      }
    }
  }

  private setupTransformationPipeline(): void {
    // Add common transformation steps
    this.transformationPipeline
      .addStep(DataTransformationPipeline.commonSteps.parseJSON())
      .addStep(DataTransformationPipeline.commonSteps.normalize())
      .addStep(DataTransformationPipeline.commonSteps.validate({})) // Add schema validation
      .addStep(DataTransformationPipeline.commonSteps.compress());
  }

  private calculateMessageRate(): number {
    // Simple moving average of messages per second
    const timeWindow = 60000; // 1 minute
    return this.metrics.totalMessages / (timeWindow / 1000);
  }

  private calculateAverageLatency(newLatency: number): number {
    const alpha = 0.2; // Exponential moving average factor
    return alpha * newLatency + (1 - alpha) * this.metrics.averageLatency;
  }

  getStreamState(id: string): StreamState | undefined {
    return this.streams.get(id);
  }

  getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  cleanup(): void {
    clearInterval(this.cleanupInterval);
    for (const [id] of this.streams.entries()) {
      this.closeStream(id);
    }
    this.emit('cleanup');
  }
} 