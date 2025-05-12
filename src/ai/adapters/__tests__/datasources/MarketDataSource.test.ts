import { MarketDataSource, MarketDataConfig, PriceUpdate, MarketDepth } from '../../datasources/MarketDataSource';
import WebSocket from 'ws';

jest.mock('ws');

describe('MarketDataSource', () => {
  let dataSource: MarketDataSource;
  let mockWs: jest.Mocked<WebSocket>;
  const defaultConfig: MarketDataConfig = {
    wsUrl: 'ws://test.market',
    apiUrl: 'http://test.market/api',
    symbols: ['BTC-USD', 'ETH-USD'],
    updateInterval: 1000
  };

  beforeEach(() => {
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN
    } as any;

    (WebSocket as jest.Mock).mockImplementation(() => mockWs);
    dataSource = new MarketDataSource(defaultConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connection management', () => {
    it('should establish WebSocket connection', async () => {
      await dataSource.connect();

      expect(WebSocket).toHaveBeenCalledWith(defaultConfig.wsUrl);
      expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle connection events', async () => {
      const connectHandler = jest.fn();
      dataSource.on('connected', connectHandler);

      await dataSource.connect();
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')[1];
      openHandler();

      expect(connectHandler).toHaveBeenCalled();
      expect(dataSource.getConnectionStatus()).toBe(true);
    });

    it('should handle disconnection', async () => {
      await dataSource.connect();
      await dataSource.disconnect();

      expect(mockWs.close).toHaveBeenCalled();
      expect(dataSource.getConnectionStatus()).toBe(false);
    });
  });

  describe('subscription management', () => {
    beforeEach(async () => {
      await dataSource.connect();
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')[1];
      openHandler();
    });

    it('should subscribe to symbols', async () => {
      await dataSource.subscribeToSymbol('BTC-USD');

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          symbol: 'BTC-USD'
        })
      );
    });

    it('should unsubscribe from symbols', async () => {
      await dataSource.unsubscribeFromSymbol('BTC-USD');

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'unsubscribe',
          symbol: 'BTC-USD'
        })
      );
    });

    it('should handle message events', async () => {
      const priceHandler = jest.fn();
      const depthHandler = jest.fn();
      dataSource.on('price', priceHandler);
      dataSource.on('depth', depthHandler);

      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];

      // Test price update
      const priceUpdate: PriceUpdate = {
        type: 'price',
        symbol: 'BTC-USD',
        price: 50000,
        timestamp: Date.now(),
        volume: 100,
        change24h: 5
      };
      messageHandler(JSON.stringify(priceUpdate));

      expect(priceHandler).toHaveBeenCalledWith({
        symbol: 'BTC-USD',
        price: 50000,
        timestamp: expect.any(Number),
        volume: 100,
        change24h: 5
      });

      // Test market depth
      const depthUpdate: MarketDepth = {
        type: 'depth',
        symbol: 'BTC-USD',
        bids: [[49000, 1], [48000, 2]],
        asks: [[51000, 1], [52000, 2]],
        timestamp: Date.now()
      };
      messageHandler(JSON.stringify(depthUpdate));

      expect(depthHandler).toHaveBeenCalledWith({
        symbol: 'BTC-USD',
        bids: [[49000, 1], [48000, 2]],
        asks: [[51000, 1], [52000, 2]],
        timestamp: expect.any(Number)
      });
    });
  });

  describe('market data retrieval', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it('should fetch market depth', async () => {
      const mockDepth: MarketDepth = {
        symbol: 'BTC-USD',
        bids: [[49000, 1], [48000, 2]],
        asks: [[51000, 1], [52000, 2]],
        timestamp: Date.now()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDepth)
      });

      const depth = await dataSource.getMarketDepth('BTC-USD');

      expect(global.fetch).toHaveBeenCalledWith(
        `${defaultConfig.apiUrl}/depth/BTC-USD`
      );
      expect(depth).toEqual(mockDepth);
    });

    it('should handle market depth fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(dataSource.getMarketDepth('BTC-USD'))
        .rejects
        .toThrow('Failed to fetch market depth: Not Found');
    });
  });

  describe('error handling', () => {
    it('should handle WebSocket errors', async () => {
      const errorHandler = jest.fn();
      dataSource.on('error', errorHandler);

      await dataSource.connect();
      const wsErrorHandler = mockWs.on.mock.calls.find(call => call[0] === 'error')[1];
      const testError = new Error('WebSocket error');
      wsErrorHandler(testError);

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        error: testError,
        context: 'WebSocket error'
      }));
    });

    it('should handle message parsing errors', async () => {
      const errorHandler = jest.fn();
      dataSource.on('error', errorHandler);

      await dataSource.connect();
      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler('invalid json');

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        context: 'WebSocket message parsing'
      }));
    });
  });

  describe('health check', () => {
    it('should report healthy when connected', async () => {
      await dataSource.connect();
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')[1];
      openHandler();

      expect(await dataSource.isHealthy()).toBe(true);
    });

    it('should report unhealthy when disconnected', async () => {
      await dataSource.connect();
      await dataSource.disconnect();

      expect(await dataSource.isHealthy()).toBe(false);
    });
  });
}); 