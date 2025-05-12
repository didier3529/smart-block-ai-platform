import { Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { ConnectionOptimizer } from '../providers/websocket-performance';
import { ConnectionPool } from '../providers/websocket-connection-pool';
import { WebSocketStateManager } from '../providers/websocket-state-manager';

export interface BlockchainEvent {
  type: string;
  chainId: number;
  data: any;
  timestamp: number;
}

export interface BlockchainSubscription {
  chainId: number;
  eventType: string;
  callback: (event: BlockchainEvent) => void;
}

export class BlockchainWebSocketAdapter extends EventEmitter {
  private connectionPool: ConnectionPool;
  private optimizer: ConnectionOptimizer;
  private stateManager: WebSocketStateManager;
  private subscriptions: Map<string, Set<BlockchainSubscription>>;
  private reconnectAttempts: Map<number, number>;
  private readonly maxReconnectAttempts = 5;

  constructor() {
    super();
    this.connectionPool = new ConnectionPool({
      maxConnections: 5,
      idleTimeout: 30000,
      acquireTimeout: 5000
    });
    this.optimizer = new ConnectionOptimizer({
      heartbeatInterval: 30000,
      reconnectionAttempts: 3,
      backoffMultiplier: 1.5
    });
    this.stateManager = new WebSocketStateManager();
    this.subscriptions = new Map();
    this.reconnectAttempts = new Map();

    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.on('error', async (error: Error, chainId: number) => {
      console.error(`Blockchain WebSocket error for chain ${chainId}:`, error);
      
      const attempts = this.reconnectAttempts.get(chainId) || 0;
      if (attempts < this.maxReconnectAttempts) {
        this.reconnectAttempts.set(chainId, attempts + 1);
        await this.reconnectWithBackoff(chainId, attempts);
      } else {
        this.emit('maxReconnectAttemptsReached', chainId);
      }
    });
  }

  private async reconnectWithBackoff(chainId: number, attempts: number) {
    const backoffTime = Math.min(1000 * Math.pow(2, attempts), 30000);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    try {
      await this.connect(chainId);
      this.reconnectAttempts.set(chainId, 0);
    } catch (error) {
      this.emit('error', error, chainId);
    }
  }

  async connect(chainId: number): Promise<void> {
    try {
      const socket = await this.connectionPool.acquire();
      if (socket) {
        this.optimizer.setSocket(socket);
        await this.resubscribe(chainId, socket);
        this.emit('connected', chainId);
      }
    } catch (error) {
      this.emit('error', error, chainId);
      throw error;
    }
  }

  private async resubscribe(chainId: number, socket: Socket) {
    const chainSubscriptions = Array.from(this.subscriptions.entries())
      .filter(([_, subs]) => Array.from(subs).some(sub => sub.chainId === chainId));

    for (const [eventType, subs] of chainSubscriptions) {
      const relevantSubs = Array.from(subs).filter(sub => sub.chainId === chainId);
      for (const sub of relevantSubs) {
        await this.subscribe(sub);
      }
    }
  }

  async subscribe(subscription: BlockchainSubscription): Promise<void> {
    const { chainId, eventType, callback } = subscription;
    const key = `${chainId}:${eventType}`;

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)?.add(subscription);

    // Store subscription state
    this.stateManager.setState(key, {
      active: true,
      lastUpdate: Date.now()
    }, true);

    this.emit('subscribed', subscription);
  }

  async unsubscribe(subscription: BlockchainSubscription): Promise<void> {
    const { chainId, eventType } = subscription;
    const key = `${chainId}:${eventType}`;

    const subs = this.subscriptions.get(key);
    if (subs) {
      subs.delete(subscription);
      if (subs.size === 0) {
        this.subscriptions.delete(key);
        this.stateManager.setState(key, {
          active: false,
          lastUpdate: Date.now()
        }, true);
      }
    }

    this.emit('unsubscribed', subscription);
  }

  async disconnect(chainId: number): Promise<void> {
    const socket = await this.connectionPool.acquire();
    if (socket) {
      this.connectionPool.release(socket);
      this.optimizer.cleanup();
      this.emit('disconnected', chainId);
    }
  }

  getMetrics(chainId: number) {
    return {
      ...this.connectionPool.getMetrics(),
      ...this.optimizer.getMetrics(),
      subscriptions: Array.from(this.subscriptions.entries())
        .filter(([key]) => key.startsWith(`${chainId}:`))
        .reduce((acc, [key, subs]) => {
          acc[key] = subs.size;
          return acc;
        }, {} as Record<string, number>)
    };
  }
} 