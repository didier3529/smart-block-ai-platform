import { jest } from '@jest/globals';
import { TrendSpotterAdapter } from '../adapters/TrendSpotterAdapter';
import { mockMarketData, mockRedisClient, mockWebSocket, cleanup, flushPromises } from './setup';

describe('TrendSpotterAdapter', () => {
  let adapter: TrendSpotterAdapter;

  beforeEach(() => {
    adapter = new TrendSpotterAdapter({
      redisClient: mockRedisClient,
      websocket: mockWebSocket
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Market Data', () => {
    it('should fetch and cache market data', async () => {
      const spy = jest.spyOn(adapter, 'fetchMarketData');
      const data = await adapter.getMarketData('BTC');
      
      expect(spy).toHaveBeenCalledWith('BTC');
      expect(data).toEqual(mockMarketData);
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should use cached market data when available', async () => {
      await mockRedisClient.set('market:BTC', JSON.stringify(mockMarketData));
      const spy = jest.spyOn(adapter, 'fetchMarketData');
      
      const data = await adapter.getMarketData('BTC');
      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual(mockMarketData);
    });

    it('should handle market data fetch errors', async () => {
      const error = new Error('API Error');
      jest.spyOn(adapter, 'fetchMarketData').mockRejectedValue(error);
      
      await expect(adapter.getMarketData('BTC')).rejects.toThrow('API Error');
    });
  });

  describe('WebSocket Subscriptions', () => {
    it('should subscribe to price updates', () => {
      adapter.subscribeToPriceUpdates('BTC');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', symbol: 'BTC' })
      );
    });

    it('should handle price update messages', async () => {
      const callback = jest.fn();
      adapter.onPriceUpdate(callback);
      
      mockWebSocket.emit('message', JSON.stringify({
        type: 'price',
        symbol: 'BTC',
        price: 1000
      }));

      await flushPromises();
      expect(callback).toHaveBeenCalledWith({
        symbol: 'BTC',
        price: 1000
      });
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze market trends', async () => {
      const trends = await adapter.analyzeTrends('BTC', '1d');
      expect(trends).toBeDefined();
      expect(trends.direction).toBeDefined();
      expect(trends.strength).toBeDefined();
      expect(trends.signals).toBeDefined();
    });

    it('should detect pattern formations', async () => {
      const patterns = await adapter.detectPatterns('BTC', '1d');
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      mockWebSocket.emit('error', new Error('Connection failed'));
      await flushPromises();
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should attempt reconnection on disconnect', async () => {
      mockWebSocket.emit('close');
      await flushPromises();
      expect(mockWebSocket.connect).toHaveBeenCalled();
    });
  });
}); 