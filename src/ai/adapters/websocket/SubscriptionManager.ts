import { WebSocketManager, WebSocketSubscription } from '@/lib/blockchain/websocket';
import { ChainId } from '@/lib/blockchain';
import { EventEmitter } from 'events';

export type SubscriptionType = 'blocks' | 'transactions' | 'logs' | 'pendingTransactions';

export interface SubscriptionConfig {
  chainId: ChainId;
  type: SubscriptionType;
  filter?: any;
}

export interface SubscriptionHandler {
  onData: (data: any) => void;
  onError: (error: Error) => void;
}

export class SubscriptionManager extends EventEmitter {
  private wsManager: WebSocketManager;
  private subscriptions: Map<string, SubscriptionConfig>;
  private handlers: Map<string, SubscriptionHandler>;
  private retryAttempts: Map<string, number>;
  private readonly maxRetries = 3;

  constructor(wsManager: WebSocketManager) {
    super();
    this.wsManager = wsManager;
    this.subscriptions = new Map();
    this.handlers = new Map();
    this.retryAttempts = new Map();
  }

  private generateSubscriptionId(config: SubscriptionConfig): string {
    return `${config.chainId}-${config.type}-${JSON.stringify(config.filter || {})}`;
  }

  async subscribe(config: SubscriptionConfig, handler: SubscriptionHandler): Promise<string> {
    const subscriptionId = this.generateSubscriptionId(config);

    if (this.subscriptions.has(subscriptionId)) {
      throw new Error(`Subscription already exists: ${subscriptionId}`);
    }

    try {
      await this.setupSubscription(subscriptionId, config, handler);
      return subscriptionId;
    } catch (error) {
      this.emit('error', { subscriptionId, error });
      throw error;
    }
  }

  private async setupSubscription(
    subscriptionId: string,
    config: SubscriptionConfig,
    handler: SubscriptionHandler
  ): Promise<void> {
    this.subscriptions.set(subscriptionId, config);
    this.handlers.set(subscriptionId, handler);

    try {
      switch (config.type) {
        case 'blocks':
          this.wsManager.subscribeToBlocks(config.chainId, (blockNumber) => {
            handler.onData({ blockNumber });
          });
          break;

        case 'transactions':
          await this.wsManager.subscribeToEvent(
            config.chainId,
            'newPendingTransactions',
            (txHash) => {
              handler.onData({ transactionHash: txHash });
            }
          );
          break;

        case 'logs':
          await this.wsManager.subscribeToEvent(
            config.chainId,
            'logs',
            (log) => {
              handler.onData(log);
            }
          );
          break;

        case 'pendingTransactions':
          await this.wsManager.subscribeToEvent(
            config.chainId,
            'newPendingTransactions',
            (txHash) => {
              handler.onData({ transactionHash: txHash });
            }
          );
          break;

        default:
          throw new Error(`Unsupported subscription type: ${config.type}`);
      }

      this.emit('subscribed', { subscriptionId, config });
    } catch (error) {
      await this.handleSubscriptionError(subscriptionId, error as Error);
    }
  }

  private async handleSubscriptionError(subscriptionId: string, error: Error): Promise<void> {
    const attempts = this.retryAttempts.get(subscriptionId) || 0;
    
    if (attempts < this.maxRetries) {
      this.retryAttempts.set(subscriptionId, attempts + 1);
      const config = this.subscriptions.get(subscriptionId);
      const handler = this.handlers.get(subscriptionId);
      
      if (config && handler) {
        try {
          await this.setupSubscription(subscriptionId, config, handler);
          this.retryAttempts.delete(subscriptionId);
        } catch (retryError) {
          handler.onError(retryError as Error);
        }
      }
    } else {
      const handler = this.handlers.get(subscriptionId);
      if (handler) {
        handler.onError(error);
      }
      this.unsubscribe(subscriptionId);
    }
  }

  unsubscribe(subscriptionId: string): void {
    const config = this.subscriptions.get(subscriptionId);
    if (config) {
      switch (config.type) {
        case 'blocks':
          this.wsManager.unsubscribeFromBlocks(config.chainId);
          break;
        default:
          this.wsManager.unsubscribeFromEvent(config.chainId, config.type);
      }

      this.subscriptions.delete(subscriptionId);
      this.handlers.delete(subscriptionId);
      this.retryAttempts.delete(subscriptionId);
      this.emit('unsubscribed', { subscriptionId });
    }
  }

  getSubscription(subscriptionId: string): SubscriptionConfig | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  getAllSubscriptions(): Map<string, SubscriptionConfig> {
    return new Map(this.subscriptions);
  }

  isSubscribed(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }
} 