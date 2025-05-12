import { BlockchainService, BlockchainServiceConfig, TransactionData, BlockData, ChainId, Address } from '@/lib/blockchain';
import { WebSocketManager } from '@/lib/blockchain/websocket';
import { SubscriptionManager, SubscriptionConfig, SubscriptionHandler, SubscriptionType } from './websocket/SubscriptionManager';
import { EventEmitter } from 'events';
import { BaseDataSource, DataSourceConfig } from './datasources/BaseDataSource';
import { BaseCache, CacheConfig } from './cache/BaseCache';
import { DataSourceFactory } from './datasources/DataSourceFactory';
import { CacheFactory } from './cache/CacheFactory';

export interface DataAdapterConfig {
  dataSourceConfig?: DataSourceConfig;
  cacheConfig?: CacheConfig;
}

export interface DataAdapterCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  invalidate(key: string): void;
  clear(): void;
  dispose(): void;
}

// Base class for blockchain data adapters
export abstract class BlockchainDataAdapter extends EventEmitter {
  protected service: BlockchainService;
  protected cache: BaseCache<any>;
  protected subscriptionManager: SubscriptionManager;
  private activeSubscriptions: Map<string, string>; // subscriptionKey -> subscriptionId
  protected isInitialized: boolean = false;

  constructor(service: BlockchainService, wsManager: WebSocketManager, dataSourceConfig?: DataSourceConfig, cacheConfig?: CacheConfig) {
    super();
    this.service = service;
    this.dataSource = this.createDataSource(dataSourceConfig);
    this.cache = this.createCache(cacheConfig);
    this.subscriptionManager = new SubscriptionManager(wsManager);
    this.activeSubscriptions = new Map();

    // Forward subscription events
    this.subscriptionManager.on('subscribed', (data) => this.emit('subscribed', data));
    this.subscriptionManager.on('unsubscribed', (data) => this.emit('unsubscribed', data));
    this.subscriptionManager.on('error', (data) => this.emit('error', data));
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.dataSource.connect();
      this.setupEventHandlers();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize adapter: ${error.message}`);
    }
  }

  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.dataSource.disconnect();
      this.cache.dispose();
      this.removeAllListeners();
      this.isInitialized = false;
    } catch (error) {
      throw new Error(`Failed to shutdown adapter: ${error.message}`);
    }
  }

  public async isHealthy(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }
    return this.dataSource.isHealthy();
  }

  protected abstract createDataSource(dataSourceConfig?: DataSourceConfig): BaseDataSource;
  protected abstract createCache(cacheConfig?: CacheConfig): BaseCache<any>;
  protected abstract setupEventHandlers(): void;

  protected validateInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized. Call initialize() first.');
    }
  }

  // Connection management
  async connect(chainId: ChainId): Promise<boolean> {
    try {
      return await this.service.connect(chainId);
    } catch (error) {
      this.handleError(error, 'connect');
      return false;
    }
  }

  async disconnect(chainId: ChainId): Promise<void> {
    try {
      // Unsubscribe from all subscriptions for this chain
      const subscriptionsToRemove: string[] = [];
      this.activeSubscriptions.forEach((subscriptionId, key) => {
        if (key.startsWith(`${chainId}-`)) {
          subscriptionsToRemove.push(subscriptionId);
        }
      });
      
      subscriptionsToRemove.forEach(subscriptionId => {
        this.subscriptionManager.unsubscribe(subscriptionId);
      });

      await this.service.disconnect(chainId);
    } catch (error) {
      this.handleError(error, 'disconnect');
    }
  }

  // Basic data fetching (to be extended by subclasses)
  async getTransaction(chainId: ChainId, txHash: string): Promise<TransactionData | undefined> {
    try {
      // TODO: Add cache lookup logic here
      return await this.service.getTransaction(chainId, txHash);
    } catch (error) {
      this.handleError(error, 'getTransaction');
      return undefined;
    }
  }

  async getBlock(chainId: ChainId, blockNumber: number): Promise<BlockData | undefined> {
    try {
      // TODO: Add cache lookup logic here
      return await this.service.getBlock(chainId, blockNumber);
    } catch (error) {
      this.handleError(error, 'getBlock');
      return undefined;
    }
  }

  async getBalance(chainId: ChainId, address: Address): Promise<string | undefined> {
    try {
      // TODO: Add cache lookup logic here
      return await this.service.getBalance(chainId, address);
    } catch (error) {
      this.handleError(error, 'getBalance');
      return undefined;
    }
  }

  // Subscription management
  protected async subscribe(
    chainId: ChainId,
    type: SubscriptionType,
    handler: SubscriptionHandler,
    filter?: any
  ): Promise<string> {
    const config: SubscriptionConfig = { chainId, type, filter };
    const subscriptionKey = this.getSubscriptionKey(config);

    // Check if subscription already exists
    const existingId = this.activeSubscriptions.get(subscriptionKey);
    if (existingId) {
      return existingId;
    }

    try {
      const subscriptionId = await this.subscriptionManager.subscribe(config, handler);
      this.activeSubscriptions.set(subscriptionKey, subscriptionId);
      return subscriptionId;
    } catch (error) {
      this.handleError(error, 'subscribe');
      throw error;
    }
  }

  protected unsubscribe(subscriptionKey: string): void {
    const subscriptionId = this.activeSubscriptions.get(subscriptionKey);
    if (subscriptionId) {
      this.subscriptionManager.unsubscribe(subscriptionId);
      this.activeSubscriptions.delete(subscriptionKey);
    }
  }

  protected getSubscriptionKey(config: SubscriptionConfig): string {
    return `${config.chainId}-${config.type}-${JSON.stringify(config.filter || {})}`;
  }

  // Subscription helper methods
  protected async subscribeToBlocks(chainId: ChainId, onBlock: (blockNumber: number) => void): Promise<string> {
    return this.subscribe(chainId, 'blocks', {
      onData: (data) => onBlock(data.blockNumber),
      onError: (error) => this.handleError(error, 'blockSubscription')
    });
  }

  protected async subscribeToTransactions(chainId: ChainId, onTransaction: (txHash: string) => void): Promise<string> {
    return this.subscribe(chainId, 'transactions', {
      onData: (data) => onTransaction(data.transactionHash),
      onError: (error) => this.handleError(error, 'transactionSubscription')
    });
  }

  protected async subscribeToLogs(
    chainId: ChainId,
    filter: any,
    onLog: (log: any) => void
  ): Promise<string> {
    return this.subscribe(chainId, 'logs', {
      onData: onLog,
      onError: (error) => this.handleError(error, 'logSubscription')
    }, filter);
  }

  // Error handling
  protected handleError(error: Error, context: string): void {
    this.emit('error', {
      error,
      context,
      timestamp: new Date(),
      adapter: this.constructor.name
    });
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Unsubscribe from all active subscriptions
    for (const subscriptionId of this.activeSubscriptions.values()) {
      this.subscriptionManager.unsubscribe(subscriptionId);
    }
    this.activeSubscriptions.clear();
    
    // Remove all listeners
    this.removeAllListeners();
  }

  // TODO: Add subscription management, data transformation, and agent-specific methods in subclasses
}

// TODO: Implement agent-specific adapters by extending BlockchainDataAdapter
// e.g., TrendSpotterAdapter, SmartContractAdapter, NFTAdapter

