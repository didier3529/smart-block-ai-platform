import { EventEmitter } from 'events';
import { DataStreamManager } from './data-stream-manager';
import { PerformanceMonitor } from '../performance/monitor';

interface EventSubscription {
  id: string;
  type: string;
  filter?: Record<string, any>;
  callback: (data: any) => void;
  priority: 'high' | 'normal' | 'low';
}

interface EventMetrics {
  totalEvents: number;
  filteredEvents: number;
  processedEvents: number;
  droppedEvents: number;
  averageProcessingTime: number;
}

export class BlockchainEventManager extends EventEmitter {
  private subscriptions: Map<string, EventSubscription>;
  private streamManager: DataStreamManager;
  private performanceMonitor: PerformanceMonitor;
  private metrics: EventMetrics;
  private gcInterval: NodeJS.Timeout;

  constructor(streamManager: DataStreamManager) {
    super();
    this.subscriptions = new Map();
    this.streamManager = streamManager;
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    this.metrics = {
      totalEvents: 0,
      filteredEvents: 0,
      processedEvents: 0,
      droppedEvents: 0,
      averageProcessingTime: 0
    };

    // Set up garbage collection interval
    this.gcInterval = setInterval(() => this.garbageCollect(), 300000); // Run every 5 minutes
  }

  async subscribe(type: string, callback: (data: any) => void, options: {
    filter?: Record<string, any>;
    priority?: 'high' | 'normal' | 'low';
  } = {}): Promise<string> {
    const subscriptionId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      type,
      filter: options.filter,
      callback,
      priority: options.priority || 'normal'
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Set up stream for this event type if not exists
    await this.streamManager.createStream(type, {
      batchSize: 100,
      batchTimeout: 50,
      maxQueueSize: 1000,
      priorityLevels: 3
    });

    this.emit('subscription:created', { type, id: subscriptionId });
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    this.subscriptions.delete(subscriptionId);
    this.emit('subscription:removed', { type: subscription.type, id: subscriptionId });
    return true;
  }

  async handleEvent(type: string, data: any): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('handleEvent');
    this.metrics.totalEvents++;

    try {
      const matchingSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.type === type)
        .filter(sub => this.matchesFilter(data, sub.filter));

      this.metrics.filteredEvents += matchingSubscriptions.length;

      // Group by priority for efficient processing
      const priorityGroups = {
        high: [] as EventSubscription[],
        normal: [] as EventSubscription[],
        low: [] as EventSubscription[]
      };

      matchingSubscriptions.forEach(sub => {
        priorityGroups[sub.priority].push(sub);
      });

      // Process in priority order
      await this.processSubscriptionGroup(priorityGroups.high, data);
      await this.processSubscriptionGroup(priorityGroups.normal, data);
      await this.processSubscriptionGroup(priorityGroups.low, data);

      this.performanceMonitor.endOperation('handleEvent', startTime);
    } catch (error) {
      this.metrics.droppedEvents++;
      this.performanceMonitor.endOperation('handleEvent', startTime, error as Error);
      throw error;
    }
  }

  private async processSubscriptionGroup(subscriptions: EventSubscription[], data: any): Promise<void> {
    const promises = subscriptions.map(async (subscription) => {
      try {
        await subscription.callback(data);
        this.metrics.processedEvents++;
      } catch (error) {
        this.metrics.droppedEvents++;
        this.emit('subscription:error', {
          type: subscription.type,
          id: subscription.id,
          error
        });
      }
    });

    await Promise.all(promises);
  }

  private matchesFilter(data: any, filter?: Record<string, any>): boolean {
    if (!filter) return true;

    return Object.entries(filter).every(([key, value]) => {
      const dataValue = this.getNestedValue(data, key);
      return this.compareValues(dataValue, value);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private compareValues(actual: any, expected: any): boolean {
    if (expected instanceof RegExp) {
      return expected.test(String(actual));
    }
    if (typeof expected === 'function') {
      return expected(actual);
    }
    return actual === expected;
  }

  private garbageCollect(): void {
    const startTime = this.performanceMonitor.startOperation('garbageCollect');
    let removedCount = 0;

    // Clean up subscriptions that haven't received events in a while
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (this.shouldRemoveSubscription(subscription)) {
        this.subscriptions.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.emit('gc:complete', { removedCount });
    }

    this.performanceMonitor.endOperation('garbageCollect', startTime);
  }

  private shouldRemoveSubscription(subscription: EventSubscription): boolean {
    // Add your subscription cleanup logic here
    // For example, remove subscriptions that haven't received events in 24 hours
    return false; // Placeholder implementation
  }

  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  cleanup(): void {
    clearInterval(this.gcInterval);
    this.subscriptions.clear();
    this.emit('cleanup');
  }
} 