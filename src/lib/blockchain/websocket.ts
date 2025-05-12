import { BlockchainConfig } from './types';
import { ConnectionError } from './errors';
import { withRetry } from './utils';

export interface WebSocketSubscription {
  id: string;
  type: string;
  callback: (data: any) => void;
}

export class WebSocketManager {
  private connections: Map<number, WebSocket>;
  private reconnectTimers: Map<number, NodeJS.Timeout>;
  private subscriptions: Map<number, Map<string, WebSocketSubscription>>;
  private connectionStatus: Map<number, {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    lastError?: Error;
    lastHeartbeat?: number;
  }>;
  private wsReconnectInterval: number;
  private heartbeatInterval: number;

  constructor(reconnectInterval: number = 5000, heartbeatInterval: number = 30000) {
    this.connections = new Map();
    this.reconnectTimers = new Map();
    this.subscriptions = new Map();
    this.connectionStatus = new Map();
    this.wsReconnectInterval = reconnectInterval;
    this.heartbeatInterval = heartbeatInterval;
  }

  async connect(chainConfig: BlockchainConfig): Promise<boolean> {
    const { chainId, rpcUrl } = chainConfig;
    const wsUrl = this.getWebSocketUrl(rpcUrl);

    try {
      await this.disconnect(chainId); // Clean up existing connection if any
      
      this.updateConnectionStatus(chainId, 'connecting');
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        this.updateConnectionStatus(chainId, 'connected');
        this.resubscribeAll(chainId);
        this.clearReconnectTimer(chainId);
        this.startHeartbeat(chainId);
      };

      ws.onmessage = (event) => {
        this.handleMessage(chainId, event.data);
      };

      ws.onclose = () => {
        this.handleDisconnect(chainId);
      };

      ws.onerror = (error) => {
        this.updateConnectionStatus(chainId, 'error', error as Error);
        console.error(`WebSocket error for chain ${chainId}:`, error);
        this.handleDisconnect(chainId);
      };

      this.connections.set(chainId, ws);
      return true;
    } catch (error) {
      this.updateConnectionStatus(chainId, 'error', error as Error);
      console.error(`Failed to establish WebSocket connection for chain ${chainId}:`, error);
      this.handleDisconnect(chainId);
      return false;
    }
  }

  private getWebSocketUrl(rpcUrl: string): string {
    // Convert HTTP(S) URL to WS(S) URL
    return rpcUrl.replace(/^http/, 'ws');
  }

  private async subscribe(chainId: number, type: string, params: any[] = []): Promise<string> {
    const ws = this.connections.get(chainId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new ConnectionError(chainId, 'WebSocket not connected');
    }

    const subscriptionId = Math.random().toString(36).substring(2, 15);
    const subscription = {
      jsonrpc: '2.0',
      id: subscriptionId,
      method: 'eth_subscribe',
      params: [type, ...params]
    };

    try {
      await withRetry(() => {
        ws.send(JSON.stringify(subscription));
      }, { maxRetries: 3 });
      return subscriptionId;
    } catch (error) {
      throw new ConnectionError(chainId, `Failed to subscribe to ${type}`);
    }
  }

  private updateConnectionStatus(chainId: number, status: 'connecting' | 'connected' | 'disconnected' | 'error', error?: Error): void {
    this.connectionStatus.set(chainId, {
      status,
      lastError: error,
      lastHeartbeat: status === 'connected' ? Date.now() : undefined
    });
  }

  private startHeartbeat(chainId: number): void {
    const interval = setInterval(() => {
      const ws = this.connections.get(chainId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: 'heartbeat', method: 'net_version' }));
      } else {
        clearInterval(interval);
      }
    }, this.heartbeatInterval);
  }

  private async resubscribeAll(chainId: number): Promise<void> {
    const chainSubscriptions = this.subscriptions.get(chainId);
    if (chainSubscriptions) {
      for (const [type, subscription] of chainSubscriptions) {
        try {
          const newId = await this.subscribe(chainId, type);
          subscription.id = newId;
        } catch (error) {
          console.error(`Failed to resubscribe to ${type} for chain ${chainId}:`, error);
        }
      }
    }
  }

  private handleMessage(chainId: number, data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Update heartbeat timestamp
      const status = this.connectionStatus.get(chainId);
      if (status) {
        status.lastHeartbeat = Date.now();
      }

      // Handle subscription messages
      if (message.method === 'eth_subscription' && message.params?.subscription) {
        const chainSubscriptions = this.subscriptions.get(chainId);
        if (chainSubscriptions) {
          for (const subscription of chainSubscriptions.values()) {
            if (message.params.subscription === subscription.id) {
              subscription.callback(message.params.result);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing WebSocket message for chain ${chainId}:`, error);
    }
  }

  private handleDisconnect(chainId: number): void {
    this.updateConnectionStatus(chainId, 'disconnected');
    this.connections.delete(chainId);
    this.scheduleReconnect(chainId);
  }

  private scheduleReconnect(chainId: number): void {
    if (!this.reconnectTimers.has(chainId)) {
      const timer = setTimeout(async () => {
        const config = { chainId, rpcUrl: this.getWebSocketUrl(chainId.toString()) };
        await this.connect(config);
      }, this.wsReconnectInterval);
      
      this.reconnectTimers.set(chainId, timer);
    }
  }

  private clearReconnectTimer(chainId: number): void {
    const timer = this.reconnectTimers.get(chainId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(chainId);
    }
  }

  async disconnect(chainId: number): Promise<void> {
    const ws = this.connections.get(chainId);
    if (ws) {
      ws.close();
      this.connections.delete(chainId);
    }
    this.clearReconnectTimer(chainId);
    this.updateConnectionStatus(chainId, 'disconnected');
  }

  async subscribeToEvent(chainId: number, type: string, callback: (data: any) => void): Promise<void> {
    if (!this.subscriptions.has(chainId)) {
      this.subscriptions.set(chainId, new Map());
    }

    const chainSubscriptions = this.subscriptions.get(chainId)!;
    const subscriptionId = await this.subscribe(chainId, type);
    
    chainSubscriptions.set(type, {
      id: subscriptionId,
      type,
      callback
    });
  }

  unsubscribeFromEvent(chainId: number, type: string): void {
    const chainSubscriptions = this.subscriptions.get(chainId);
    if (chainSubscriptions) {
      chainSubscriptions.delete(type);
    }
  }

  subscribeToBlocks(chainId: number, callback: (blockNumber: number) => void): void {
    this.subscribeToEvent(chainId, 'newHeads', (result) => {
      if (result?.number) {
        const blockNumber = parseInt(result.number, 16);
        callback(blockNumber);
      }
    });
  }

  unsubscribeFromBlocks(chainId: number): void {
    this.unsubscribeFromEvent(chainId, 'newHeads');
  }

  getConnectionStatus(chainId: number): { status: string; lastError?: Error; lastHeartbeat?: number } {
    return this.connectionStatus.get(chainId) || { status: 'disconnected' };
  }

  isConnected(chainId: number): boolean {
    const ws = this.connections.get(chainId);
    return ws?.readyState === WebSocket.OPEN;
  }
} 