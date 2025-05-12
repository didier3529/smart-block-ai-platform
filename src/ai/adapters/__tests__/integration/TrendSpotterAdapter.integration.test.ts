import { TrendSpotterAdapter } from '../../TrendSpotterAdapter';
import { MarketDataSource } from '../../datasources/MarketDataSource';
import { TrendSpotterCache } from '../../cache/TrendSpotterCache';
import { CacheFactory } from '../../cache/CacheFactory';
import { DataSourceFactory } from '../../datasources/DataSourceFactory';

jest.mock('../../cache/CacheFactory');
jest.mock('../../datasources/DataSourceFactory');

describe('TrendSpotterAdapter Integration', () => {
  let adapter: TrendSpotterAdapter;
  let mockMarketDataSource: jest.Mocked<MarketDataSource>;
  let mockCache: jest.Mocked<TrendSpotterCache>;

  const mockPriceUpdate = {
    symbol: 'BTC-USD',
    price: 50000,
    timestamp: Date.now(),
    volume: 100,
    change24h: 5
  };

  beforeEach(() => {
    mockMarketDataSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
      subscribeToSymbol: jest.fn(),
      unsubscribeFromSymbol: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      getMarketDepth: jest.fn()
    } as any;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    } as any;

    (DataSourceFactory.getInstance as jest.Mock).mockReturnValue({
      getMarketDataSource: jest.fn().mockReturnValue(mockMarketDataSource)
    });

    (CacheFactory.getInstance as jest.Mock).mockReturnValue({
      getTrendSpotterCache: jest.fn().mockReturnValue(mockCache)
    });

    adapter = new TrendSpotterAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('market trend analysis', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should analyze trends using real-time data and caching', async () => {
      // Set up cache miss for initial data
      mockCache.get.mockResolvedValueOnce(undefined);

      // Set up market data source response
      mockMarketDataSource.getMarketDepth.mockResolvedValueOnce({
        symbol: 'BTC-USD',
        bids: [[49000, 1], [48000, 2]],
        asks: [[51000, 1], [52000, 2]],
        timestamp: Date.now()
      });

      // Trigger price update
      const priceHandler = mockMarketDataSource.on.mock.calls.find(
        call => call[0] === 'price'
      )[1];
      priceHandler(mockPriceUpdate);

      // Request trend analysis
      const trend = await adapter.analyzeTrend('BTC-USD');

      // Verify data source interaction
      expect(mockMarketDataSource.subscribeToSymbol).toHaveBeenCalledWith('BTC-USD');
      expect(mockMarketDataSource.getMarketDepth).toHaveBeenCalledWith('BTC-USD');

      // Verify caching behavior
      expect(mockCache.get).toHaveBeenCalledWith('trend:BTC-USD');
      expect(mockCache.set).toHaveBeenCalledWith(
        'trend:BTC-USD',
        expect.objectContaining({
          symbol: 'BTC-USD',
          direction: expect.any(String),
          strength: expect.any(Number),
          timestamp: expect.any(Number)
        })
      );

      // Verify trend analysis result
      expect(trend).toEqual(expect.objectContaining({
        symbol: 'BTC-USD',
        direction: expect.any(String),
        strength: expect.any(Number),
        timestamp: expect.any(Number),
        indicators: expect.any(Object)
      }));
    });

    it('should use cached trend data when available', async () => {
      const cachedTrend = {
        symbol: 'BTC-USD',
        direction: 'up',
        strength: 0.8,
        timestamp: Date.now() - 1000,
        indicators: {
          priceAction: { value: 1, weight: 0.3 },
          volume: { value: 0.7, weight: 0.3 },
          depth: { value: 0.6, weight: 0.4 }
        }
      };

      mockCache.get.mockResolvedValueOnce(cachedTrend);

      const trend = await adapter.analyzeTrend('BTC-USD');

      expect(mockMarketDataSource.getMarketDepth).not.toHaveBeenCalled();
      expect(trend).toEqual(cachedTrend);
    });

    it('should handle data source errors gracefully', async () => {
      mockCache.get.mockResolvedValueOnce(undefined);
      mockMarketDataSource.getMarketDepth.mockRejectedValueOnce(
        new Error('Market data unavailable')
      );

      await expect(adapter.analyzeTrend('BTC-USD'))
        .rejects
        .toThrow('Failed to analyze market trend: Market data unavailable');
    });
  });

  describe('real-time updates', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should emit trend updates on significant price changes', async () => {
      const trendHandler = jest.fn();
      adapter.on('trendUpdate', trendHandler);

      // Simulate multiple price updates
      const priceHandler = mockMarketDataSource.on.mock.calls.find(
        call => call[0] === 'price'
      )[1];

      // First update
      priceHandler({
        ...mockPriceUpdate,
        price: 50000
      });

      // Significant price change
      priceHandler({
        ...mockPriceUpdate,
        price: 55000 // 10% increase
      });

      expect(trendHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC-USD',
          direction: 'up',
          strength: expect.any(Number)
        })
      );
    });

    it('should handle multiple symbol subscriptions', async () => {
      await adapter.analyzeTrend('BTC-USD');
      await adapter.analyzeTrend('ETH-USD');

      expect(mockMarketDataSource.subscribeToSymbol).toHaveBeenCalledWith('BTC-USD');
      expect(mockMarketDataSource.subscribeToSymbol).toHaveBeenCalledWith('ETH-USD');
    });
  });

  describe('cleanup', () => {
    it('should properly clean up resources on shutdown', async () => {
      await adapter.initialize();
      await adapter.analyzeTrend('BTC-USD');

      await adapter.shutdown();

      expect(mockMarketDataSource.disconnect).toHaveBeenCalled();
      expect(mockCache.dispose).toHaveBeenCalled();
    });
  });
}); 