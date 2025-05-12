import { EventEmitter } from 'events';

export interface Subscription {
  id: string;
  eventType: string;
  callback: (data: any) => void;
  filters?: Record<string, any>;
  priority?: number;
  retryCount?: number;
  lastError?: Error;
  lastRetryTimestamp?: number;
}

export interface SubscriptionOptions {
  maxRetries?: number;
  retryDelay?: number;
  priority?: number;
  filters?: Record<string, any>;
  backoffMultiplier?: number;
}

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'error';

export class SubscriptionManager extends EventEmitter {
  private subscriptions: Map<string, Subscription>;
  private eventEmitter: EventEmitter;
  private maxRetries: number;
  private retryDelay: number;
  private backoffMultiplier: number;
  private connectionState: ConnectionState;
  private pendingMessages: Map<string, any[]>;
  private reconnectTimer: NodeJS.Timeout | null;
  private cleanupCallbacks: Set<() => void>;

  constructor(options: SubscriptionOptions = {}) {
    super();
    this.subscriptions = new Map();
    this.eventEmitter = new EventEmitter();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.backoffMultiplier = options.backoffMultiplier || 1.5;
    this.connectionState = 'disconnected';
    this.pendingMessages = new Map();
    this.reconnectTimer = null;
    this.cleanupCallbacks = new Set();

    // Set max listeners to prevent memory leaks
    this.eventEmitter.setMaxListeners(100);

    // Setup error handling
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.on('error', this.handleGlobalError.bind(this));
    
    // Handle process termination
    const cleanup = () => {
      this.cleanup();
      process.exit(0);
    };

    if (typeof process !== 'undefined') {
      process.on('SIGTERM', cleanup);
      process.on('SIGINT', cleanup);
      
      this.cleanupCallbacks.add(() => {
        process.off('SIGTERM', cleanup);
        process.off('SIGINT', cleanup);
      });
    }
  }

  private handleGlobalError(error: Error): void {
    console.error('SubscriptionManager global error:', error);
    
    if (this.connectionState === 'connected') {
      this.setConnectionState('error');
      this.attemptReconnection();
    }
  }

  subscribe(eventType: string, callback: (data: any) => void, options: SubscriptionOptions = {}): string {
    const id = this.generateSubscriptionId();
    const subscription: Subscription = {
      id,
      eventType,
      callback,
      filters: options.filters,
      priority: options.priority || 0,
      retryCount: 0,
      lastRetryTimestamp: 0
    };

    this.subscriptions.set(id, subscription);
    this.eventEmitter.on(eventType, this.createSubscriptionHandler(subscription));

    // Emit subscription created event
    this.emit('subscriptionCreated', { id, eventType });

    return id;
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    this.eventEmitter.removeAllListeners(subscription.eventType);
    this.subscriptions.delete(subscriptionId);
    
    // Emit subscription removed event
    this.emit('subscriptionRemoved', { id: subscriptionId, eventType: subscription.eventType });
    
    return true;
  }

  publish(eventType: string, data: any): void {
    if (this.connectionState === 'disconnected' || this.connectionState === 'error') {
      this.queueMessage(eventType, data);
      return;
    }

    try {
      this.eventEmitter.emit(eventType, data);
    } catch (error) {
      console.error(`Error publishing event ${eventType}:`, error);
      this.handleError(eventType, error);
    }
  }

  setConnectionState(state: ConnectionState): void {
    const previousState = this.connectionState;
    this.connectionState = state;
    
    // Emit state change event
    this.emit('connectionStateChange', { previous: previousState, current: state });

    switch (state) {
      case 'connected':
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.processPendingMessages();
        break;
      
      case 'disconnected':
      case 'error':
        this.attemptReconnection();
        break;
    }
  }

  private attemptReconnection(): void {
    if (this.reconnectTimer) return;

    const subscription = Array.from(this.subscriptions.values())
      .find(sub => sub.retryCount < this.maxRetries);

    if (subscription) {
      const backoffDelay = this.calculateBackoffDelay(subscription);
      
      this.reconnectTimer = setTimeout(() => {
        this.setConnectionState('reconnecting');
        this.emit('reconnectAttempt', { 
          subscriptionId: subscription.id,
          attempt: subscription.retryCount + 1,
          maxRetries: this.maxRetries
        });
        
        this.reconnectTimer = null;
      }, backoffDelay);
    } else {
      this.emit('maxRetriesExceeded');
    }
  }

  private calculateBackoffDelay(subscription: Subscription): number {
    const baseDelay = this.retryDelay;
    const retryCount = subscription.retryCount || 0;
    const backoffFactor = Math.pow(this.backoffMultiplier, retryCount);
    
    return Math.min(baseDelay * backoffFactor, 30000); // Cap at 30 seconds
  }

  private queueMessage(eventType: string, data: any): void {
    const pending = this.pendingMessages.get(eventType) || [];
    pending.push(data);
    this.pendingMessages.set(eventType, pending);
    
    // Emit queue update event
    this.emit('messageQueued', { eventType, queueSize: pending.length });
  }

  private processPendingMessages(): void {
    for (const [eventType, messages] of this.pendingMessages.entries()) {
      messages.forEach(data => this.publish(eventType, data));
    }
    this.pendingMessages.clear();
    
    // Emit queue processed event
    this.emit('queueProcessed');
  }

  private createSubscriptionHandler(subscription: Subscription) {
    return (data: any) => {
      try {
        if (this.shouldProcessMessage(subscription, data)) {
          subscription.callback(data);
          
          // Reset retry count on successful processing
          subscription.retryCount = 0;
          subscription.lastError = undefined;
        }
      } catch (error) {
        this.handleError(subscription.eventType, error, subscription);
      }
    };
  }

  private shouldProcessMessage(subscription: Subscription, data: any): boolean {
    if (!subscription.filters) return true;

    return Object.entries(subscription.filters).every(([key, value]) => {
      return data[key] === value;
    });
  }

  private handleError(eventType: string, error: any, subscription?: Subscription): void {
    console.error(`Error in subscription ${subscription?.id} for event ${eventType}:`, error);

    if (subscription) {
      subscription.lastError = error;
      subscription.lastRetryTimestamp = Date.now();

      if (subscription.retryCount! < this.maxRetries) {
        subscription.retryCount!++;
        
        const backoffDelay = this.calculateBackoffDelay(subscription);
        
        setTimeout(() => {
          this.emit('retryAttempt', {
            subscriptionId: subscription.id,
            attempt: subscription.retryCount,
            delay: backoffDelay
          });
          
          this.publish(eventType, { type: 'retry', originalEvent: eventType });
        }, backoffDelay);
      } else {
        this.emit('maxRetriesExceeded', {
          subscriptionId: subscription.id,
          eventType,
          error
        });
      }
    }

    // Emit error event
    this.emit('error', { eventType, error, subscription });
  }

  private generateSubscriptionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  cleanup(): void {
    // Clear all timeouts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Remove all event listeners
    this.eventEmitter.removeAllListeners();
    this.removeAllListeners();
    
    // Clear all subscriptions
    this.subscriptions.clear();
    this.pendingMessages.clear();

    // Execute cleanup callbacks
    this.cleanupCallbacks.forEach(callback => callback());
    this.cleanupCallbacks.clear();

    // Emit cleanup event
    this.emit('cleanup');
  }

  getActiveSubscriptions(): { count: number; subscriptions: Subscription[] } {
    return {
      count: this.subscriptions.size,
      subscriptions: Array.from(this.subscriptions.values())
    };
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getPendingMessageCount(): number {
    return Array.from(this.pendingMessages.values())
      .reduce((total, messages) => total + messages.length, 0);
  }
} 