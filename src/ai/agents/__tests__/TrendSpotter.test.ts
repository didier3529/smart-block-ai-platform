import { TrendSpotter } from '../TrendSpotter';
import { PromptManager } from '../../core/PromptManager';
import { TrendSpotterConfig, MarketTrend } from '../../types/agents';
import { fetchMarketData, analyzeSentiment, getHistoricalPatterns } from '../../utils/market';

// Mock dependencies
jest.mock('../../utils/market');
jest.mock('../../core/PromptManager');

describe('TrendSpotter', () => {
  let spotter: TrendSpotter;
  let mockPromptManager: jest.Mocked<PromptManager>;
  let mockConfig: TrendSpotterConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      capabilities: ['market trend analysis', 'sentiment analysis', 'pattern recognition'],
      trendParameters: {
        timeframe: '24h',
        confidenceThreshold: 0.8
      },
      modelConfig: {
        temperature: 0.7,
        maxTokens: 1000
      }
    };

    // Setup mock PromptManager
    mockPromptManager = new PromptManager() as jest.Mocked<PromptManager>;
    mockPromptManager.renderPrompt = jest.fn().mockResolvedValue('Mocked prompt');

    // Initialize agent
    spotter = new TrendSpotter(mockConfig, mockPromptManager);
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(spotter.initialize()).resolves.not.toThrow();
      expect(spotter.getState().status).toBe('ready');
    });

    it('should throw error if confidence threshold is not configured', async () => {
      const invalidConfig = {
        ...mockConfig,
        trendParameters: { timeframe: '24h' }
      };
      const invalidSpotter = new TrendSpotter(invalidConfig, mockPromptManager);
      
      await expect(invalidSpotter.initialize()).rejects.toThrow('Confidence threshold not configured');
      expect(invalidSpotter.getState().status).toBe('error');
    });
  });

  describe('trend analysis', () => {
    const mockMarketData = {
      prices: [/* mock price data */],
      volume: [/* mock volume data */],
      marketCap: [/* mock market cap data */]
    };

    const mockSentiment = {
      score: 0.75,
      sources: ['twitter', 'reddit', 'news'],
      keywords: ['bullish', 'growth', 'adoption']
    };

    const mockPatterns = [
      { name: 'bullish flag', confidence: 0.85, timeframe: '4h' },
      { name: 'support level', confidence: 0.9, price: 50000 }
    ];

    beforeEach(() => {
      // Mock market utility functions
      (fetchMarketData as jest.Mock).mockResolvedValue(mockMarketData);
      (analyzeSentiment as jest.Mock).mockResolvedValue(mockSentiment);
      (getHistoricalPatterns as jest.Mock).mockResolvedValue(mockPatterns);
    });

    it('should analyze market trends successfully', async () => {
      await spotter.initialize();
      const response = await spotter.analyzeTrends('BTC');

      expect(response.type).toBe('market_trend');
      expect(response.content).toHaveProperty('trend');
      expect(response.content).toHaveProperty('confidence');
      expect(response.content).toHaveProperty('signals');
      expect(response.content).toHaveProperty('predictions');
    });

    it('should incorporate sentiment analysis', async () => {
      await spotter.initialize();
      const response = await spotter.analyzeTrends('ETH', { includeSentiment: true });

      expect(mockPromptManager.renderPrompt).toHaveBeenCalledWith(
        'trend-spotter-analyze',
        expect.objectContaining({
          sentiment: expect.any(Object)
        }),
        expect.any(Object)
      );
    });

    it('should detect patterns with sufficient confidence', async () => {
      await spotter.initialize();
      const response = await spotter.analyzeTrends('BTC');

      expect(response.content.signals).toContainEqual(
        expect.objectContaining({
          indicator: 'pattern',
          value: 'bullish flag'
        })
      );
    });
  });

  describe('state management', () => {
    it('should update state with last trend analysis', async () => {
      await spotter.initialize();
      await spotter.analyzeTrends('BTC');

      const state = spotter.getState();
      expect(state).toHaveProperty('lastTrend');
      expect(state.lastTrend).toHaveProperty('trend');
      expect(state.lastTrend).toHaveProperty('confidence');
    });

    it('should maintain monitored patterns list', async () => {
      await spotter.initialize();
      const state = spotter.getState();
      expect(state.monitoredPatterns).toEqual([]);
      // Test adding/removing patterns if those methods exist
    });
  });

  describe('error handling', () => {
    it('should handle market data fetch errors', async () => {
      await spotter.initialize();
      (fetchMarketData as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(spotter.analyzeTrends('BTC')).rejects.toThrow('API error');
      expect(spotter.getState().status).toBe('error');
    });

    it('should handle invalid timeframe parameter', async () => {
      const invalidConfig = {
        ...mockConfig,
        trendParameters: {
          timeframe: 'invalid',
          confidenceThreshold: 0.8
        }
      };
      const invalidSpotter = new TrendSpotter(invalidConfig, mockPromptManager);

      await invalidSpotter.initialize();
      await expect(invalidSpotter.analyzeTrends('BTC')).rejects.toThrow();
    });
  });

  describe('performance optimization', () => {
    it('should cache market data for repeated analysis', async () => {
      await spotter.initialize();
      
      // First analysis
      await spotter.analyzeTrends('BTC');
      expect(fetchMarketData).toHaveBeenCalledTimes(1);
      
      // Second analysis within cache window
      await spotter.analyzeTrends('BTC');
      expect(fetchMarketData).toHaveBeenCalledTimes(1); // Should use cached data
    });

    it('should respect confidence threshold for pattern detection', async () => {
      await spotter.initialize();
      const response = await spotter.analyzeTrends('BTC');

      // Only patterns above confidence threshold should be included
      const patterns = response.content.signals.filter(s => s.indicator === 'pattern');
      patterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(mockConfig.trendParameters.confidenceThreshold);
      });
    });
  });
}); 