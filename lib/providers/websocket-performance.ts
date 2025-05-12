import { Message } from './websocket-context';
import { Socket } from 'socket.io-client';

interface BatcherConfig {
  batchSize?: number;
  batchTimeout?: number;
  rateLimit?: number;
  maxQueueSize?: number;
  priorityLevels?: number;
}

interface QueueMetrics {
  queueSize: number;
  droppedMessages: number;
  processedMessages: number;
  averageLatency: number;
  backpressure: number;
}

export class MessageBatcher {
  private batchSize: number;
  private batchTimeout: number;
  private priorityQueues: Message[][];
  private timeoutIds: (NodeJS.Timeout | null)[];
  private socket: Socket | null = null;
  private rateLimiter: RateLimiter;
  private metrics: QueueMetrics;
  private maxQueueSize: number;

  constructor(options: BatcherConfig = {}) {
    this.batchSize = options.batchSize || 100;
    this.batchTimeout = options.batchTimeout || 50;
    this.maxQueueSize = options.maxQueueSize || 1000;
    const priorityLevels = options.priorityLevels || 3;

    // Initialize priority queues (0 = highest priority)
    this.priorityQueues = Array(priorityLevels).fill(null).map(() => []);
    this.timeoutIds = Array(priorityLevels).fill(null);

    this.rateLimiter = new RateLimiter(options.rateLimit || 1000);
    this.metrics = {
      queueSize: 0,
      droppedMessages: 0,
      processedMessages: 0,
      averageLatency: 0,
      backpressure: 0
    };
  }

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  add(message: Message) {
    if (!this.rateLimiter.canProcess()) {
      console.warn(`Rate limit exceeded for message: ${message.event}`);
      this.metrics.droppedMessages++;
      return;
    }

    const priority = this.getPriorityLevel(message);
    const queue = this.priorityQueues[priority];

    // Check queue size and apply backpressure if needed
    if (queue.length >= this.maxQueueSize) {
      this.handleBackpressure(message, priority);
      return;
    }

    queue.push(message);
    this.metrics.queueSize++;

    if (queue.length >= this.batchSize) {
      this.flush(priority);
    } else if (!this.timeoutIds[priority]) {
      this.timeoutIds[priority] = setTimeout(() => this.flush(priority), this.batchTimeout);
    }

    // Update backpressure metric
    this.updateBackpressureMetric();
  }

  private getPriorityLevel(message: Message): number {
    switch (message.priority) {
      case 'high':
        return 0;
      case 'normal':
        return 1;
      case 'low':
        return 2;
      default:
        return 1; // Default to normal priority
    }
  }

  private handleBackpressure(message: Message, priority: number) {
    // For high priority messages, try to make room by dropping low priority messages
    if (priority === 0) {
      const lowPriorityQueue = this.priorityQueues[2];
      if (lowPriorityQueue.length > 0) {
        lowPriorityQueue.pop(); // Drop oldest low priority message
        this.metrics.droppedMessages++;
        this.metrics.queueSize--;
        this.priorityQueues[priority].push(message);
        this.metrics.queueSize++;
      } else {
        this.metrics.droppedMessages++;
      }
    } else {
      // For normal and low priority, just drop the message
      this.metrics.droppedMessages++;
    }
  }

  private updateBackpressureMetric() {
    const totalCapacity = this.maxQueueSize * this.priorityQueues.length;
    const totalSize = this.priorityQueues.reduce((sum, queue) => sum + queue.length, 0);
    this.metrics.backpressure = totalSize / totalCapacity;
  }

  private flush(priority: number) {
    if (!this.socket || this.priorityQueues[priority].length === 0) return;

    const queue = this.priorityQueues[priority];
    const batchToSend = [...queue];
    this.priorityQueues[priority] = [];
    this.metrics.queueSize -= batchToSend.length;

    if (this.timeoutIds[priority]) {
      clearTimeout(this.timeoutIds[priority]!);
      this.timeoutIds[priority] = null;
    }

    // Group messages by event type
    const messagesByEvent = batchToSend.reduce((acc, message) => {
      const startTime = message.timestamp;
      if (!acc[message.event]) {
        acc[message.event] = [];
      }
      acc[message.event].push(message.data);
      
      // Update latency metrics
      const latency = Date.now() - startTime;
      this.updateLatencyMetrics(latency);

      return acc;
    }, {} as Record<string, any[]>);

    // Send batched messages by event type
    Object.entries(messagesByEvent).forEach(([event, data]) => {
      this.socket?.emit(event, data);
      this.metrics.processedMessages += data.length;
    });
  }

  private updateLatencyMetrics(latency: number) {
    this.metrics.averageLatency = (this.metrics.averageLatency * this.metrics.processedMessages + latency) / 
      (this.metrics.processedMessages + 1);
  }

  flushAll() {
    this.priorityQueues.forEach((_, priority) => this.flush(priority));
  }

  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  clear() {
    this.priorityQueues.forEach((queue, priority) => {
      queue.length = 0;
      if (this.timeoutIds[priority]) {
        clearTimeout(this.timeoutIds[priority]!);
        this.timeoutIds[priority] = null;
      }
    });
    this.metrics.queueSize = 0;
  }
}

class RateLimiter {
  private windowMs: number = 1000;
  private maxRequests: number;
  private requests: number[] = [];

  constructor(maxRequests: number = 1000) {
    this.maxRequests = maxRequests;
  }

  canProcess(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  reset() {
    this.requests = [];
  }
}

export class ConnectionOptimizer {
  private heartbeatInterval: number = 30000;
  private reconnectionAttempts: number = 3;
  private backoffMultiplier: number = 1.5;
  private socket: Socket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private metrics: ConnectionMetrics;

  constructor(options: {
    heartbeatInterval?: number;
    reconnectionAttempts?: number;
    backoffMultiplier?: number;
  } = {}) {
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.reconnectionAttempts = options.reconnectionAttempts || 3;
    this.backoffMultiplier = options.backoffMultiplier || 1.5;
    this.metrics = new ConnectionMetrics();
  }

  setSocket(socket: Socket) {
    this.socket = socket;
    this.initializeHeartbeat();
    this.setupMetrics();
  }

  private initializeHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
      }
    }, this.heartbeatInterval);
  }

  private setupMetrics() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.metrics.recordConnect();
    });

    this.socket.on('disconnect', () => {
      this.metrics.recordDisconnect();
    });

    this.socket.on('error', (error) => {
      this.metrics.recordError(error);
    });
  }

  getMetrics(): ConnectionMetricsData {
    return this.metrics.getMetrics();
  }

  cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

interface ConnectionMetricsData {
  totalConnections: number;
  currentConnections: number;
  disconnections: number;
  errors: number;
  averageConnectTime: number;
  lastConnectTime: number;
  uptime: number;
}

class ConnectionMetrics {
  private data: ConnectionMetricsData;
  private connectTimes: number[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.data = {
      totalConnections: 0,
      currentConnections: 0,
      disconnections: 0,
      errors: 0,
      averageConnectTime: 0,
      lastConnectTime: 0,
      uptime: 0
    };
  }

  recordConnect() {
    const connectTime = Date.now();
    this.connectTimes.push(connectTime);
    this.data.totalConnections++;
    this.data.currentConnections++;
    this.data.lastConnectTime = connectTime;
    this.updateAverageConnectTime();
  }

  recordDisconnect() {
    this.data.currentConnections--;
    this.data.disconnections++;
  }

  recordError(error: any) {
    this.data.errors++;
    console.error('Connection error:', error);
  }

  private updateAverageConnectTime() {
    if (this.connectTimes.length < 2) return;
    
    const intervals = [];
    for (let i = 1; i < this.connectTimes.length; i++) {
      intervals.push(this.connectTimes[i] - this.connectTimes[i - 1]);
    }
    
    this.data.averageConnectTime = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  getMetrics(): ConnectionMetricsData {
    return {
      ...this.data,
      uptime: Date.now() - this.startTime
    };
  }
} 