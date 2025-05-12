import { PortfolioAnalyst } from '../PortfolioAnalyst';
import { PromptManager } from '../../core/PromptManager';
import { PortfolioAnalystConfig, PortfolioAnalystState } from '../../types/agents';
import { fetchTokenPrices, getWalletHoldings, getMarketConditions } from '../../utils/blockchain';

// Mock dependencies
jest.mock('../../utils/blockchain');
jest.mock('../../core/PromptManager');

describe('PortfolioAnalyst', () => {
  let analyst: PortfolioAnalyst;
  let mockPromptManager: jest.Mocked<PromptManager>;
  let mockConfig: PortfolioAnalystConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      capabilities: ['portfolio analysis', 'risk assessment', 'investment recommendations'],
      analysisThresholds: {
        riskTolerance: 0.7,
        minimumHoldingValue: '1000'
      },
      walletAddress: '0x123...',
      modelConfig: {
        temperature: 0.7,
        maxTokens: 1000
      }
    };

    // Setup mock PromptManager
    mockPromptManager = new PromptManager() as jest.Mocked<PromptManager>;
    mockPromptManager.renderPrompt = jest.fn().mockResolvedValue('Mocked prompt');

    // Initialize agent
    analyst = new PortfolioAnalyst(mockConfig, mockPromptManager);
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(analyst.initialize()).resolves.not.toThrow();
      expect(analyst.getState().status).toBe('ready');
    });

    it('should throw error if risk tolerance is not configured', async () => {
      const invalidConfig = {
        ...mockConfig,
        analysisThresholds: { minimumHoldingValue: '1000' }
      };
      const invalidAnalyst = new PortfolioAnalyst(invalidConfig, mockPromptManager);
      
      await expect(invalidAnalyst.initialize()).rejects.toThrow('Risk tolerance threshold not configured');
      expect(invalidAnalyst.getState().status).toBe('error');
    });
  });

  describe('processQuery', () => {
    const mockHoldings = [
      { token: 'ETH', amount: '1.5', value: '3000' },
      { token: 'BTC', amount: '0.1', value: '4000' }
    ];

    const mockMarketConditions = {
      trend: 'bullish',
      volatility: 'medium',
      sentiment: 'positive'
    };

    beforeEach(() => {
      // Mock blockchain utility functions
      (getWalletHoldings as jest.Mock).mockResolvedValue(mockHoldings);
      (fetchTokenPrices as jest.Mock).mockResolvedValue({ ETH: 2000, BTC: 40000 });
      (getMarketConditions as jest.Mock).mockResolvedValue(mockMarketConditions);
    });

    it('should process full portfolio analysis query', async () => {
      await analyst.initialize();
      const response = await analyst.processQuery('Analyze my portfolio');

      expect(response.type).toBe('portfolio_analysis');
      expect(response.content).toHaveProperty('holdings');
      expect(response.content).toHaveProperty('totalValue');
      expect(response.content).toHaveProperty('riskScore');
      expect(response.content).toHaveProperty('recommendations');
    });

    it('should process risk-focused query', async () => {
      await analyst.initialize();
      const response = await analyst.processQuery('What are my portfolio risks?');

      expect(mockPromptManager.renderPrompt).toHaveBeenCalledWith(
        'portfolio-analyst-analyze',
        expect.objectContaining({
          riskTolerance: mockConfig.analysisThresholds.riskTolerance
        }),
        expect.any(Object)
      );
    });

    it('should handle errors during analysis', async () => {
      await analyst.initialize();
      (getWalletHoldings as jest.Mock).mockRejectedValue(new Error('Failed to fetch holdings'));

      await expect(analyst.processQuery('Analyze my portfolio')).rejects.toThrow('Failed to fetch holdings');
      expect(analyst.getState().status).toBe('error');
    });
  });

  describe('state management', () => {
    it('should update state with last analysis', async () => {
      await analyst.initialize();
      await analyst.processQuery('Analyze my portfolio');

      const state = analyst.getState();
      expect(state).toHaveProperty('lastAnalysis');
      expect(state.lastAnalysis).toHaveProperty('holdings');
      expect(state.lastAnalysis).toHaveProperty('riskScore');
    });

    it('should maintain watched tokens list', async () => {
      await analyst.initialize();
      const state = analyst.getState();
      expect(state.watchedTokens).toEqual([]);
      // Test adding/removing watched tokens if those methods exist
    });
  });

  describe('error handling', () => {
    it('should handle blockchain connection errors', async () => {
      await analyst.initialize();
      (getWalletHoldings as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(analyst.processQuery('Analyze portfolio')).rejects.toThrow('Network error');
      expect(analyst.getState().status).toBe('error');
    });

    it('should handle invalid wallet address', async () => {
      const invalidConfig = {
        ...mockConfig,
        walletAddress: 'invalid'
      };
      const invalidAnalyst = new PortfolioAnalyst(invalidConfig, mockPromptManager);

      await invalidAnalyst.initialize();
      await expect(invalidAnalyst.processQuery('Analyze portfolio')).rejects.toThrow();
    });
  });

  describe('performance optimization', () => {
    it('should cache token prices for repeated queries', async () => {
      await analyst.initialize();
      
      // First query
      await analyst.processQuery('Analyze portfolio');
      expect(fetchTokenPrices).toHaveBeenCalledTimes(1);
      
      // Second query within cache window
      await analyst.processQuery('Analyze portfolio');
      expect(fetchTokenPrices).toHaveBeenCalledTimes(1); // Should use cached prices
    });
  });
}); 