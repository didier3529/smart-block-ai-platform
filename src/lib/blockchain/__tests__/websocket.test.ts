import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { WebSocketManager } from '../websocket';
import { BlockchainConfig } from '../types';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Error) => void) | null = null;
  readyState = WebSocket.CONNECTING;

  constructor(public url: string) {}

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }

  send(data: string) {
    // Mock successful subscription response
    if (this.onmessage) {
      const message = {
        method: 'eth_subscription',
        params: {
          result: {
            number: '0x1234'
          }
        }
      };
      this.onmessage({ data: JSON.stringify(message) });
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketManager', () => {
  let manager: WebSocketManager;
  const testConfig: BlockchainConfig = {
    chainId: 1,
    name: 'Test Chain',
    rpcUrl: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Test',
      symbol: 'TEST',
      decimals: 18
    }
  };

  beforeEach(() => {
    manager = new WebSocketManager(1000);
    jest.useFakeTimers();
  });

  it('should establish WebSocket connection', async () => {
    const connected = await manager.connect(testConfig);
    expect(connected).toBe(true);
  });

  it('should handle new block notifications', async () => {
    const blockCallback = jest.fn();
    manager.subscribeToBlocks(testConfig.chainId, blockCallback);

    await manager.connect(testConfig);
    
    // The mock WebSocket will trigger a block notification
    expect(blockCallback).toHaveBeenCalledWith(0x1234);
  });

  it('should handle disconnection and reconnection', async () => {
    await manager.connect(testConfig);
    const ws = (manager as any).connections.get(testConfig.chainId);
    
    ws.close();
    expect(manager.isConnected(testConfig.chainId)).toBe(false);

    // Fast-forward reconnection timer
    jest.advanceTimersByTime(1000);
    
    expect(manager.isConnected(testConfig.chainId)).toBe(true);
  });

  it('should unsubscribe from block notifications', async () => {
    const blockCallback = jest.fn();
    manager.subscribeToBlocks(testConfig.chainId, blockCallback);
    manager.unsubscribeFromBlocks(testConfig.chainId, blockCallback);

    await manager.connect(testConfig);
    
    // The mock WebSocket triggers a block notification but callback shouldn't be called
    expect(blockCallback).not.toHaveBeenCalled();
  });

  it('should convert HTTP URLs to WebSocket URLs', () => {
    const getWebSocketUrl = (manager as any).getWebSocketUrl.bind(manager);
    
    expect(getWebSocketUrl('http://localhost:8545')).toBe('ws://localhost:8545');
    expect(getWebSocketUrl('https://mainnet.infura.io')).toBe('wss://mainnet.infura.io');
  });
}); 