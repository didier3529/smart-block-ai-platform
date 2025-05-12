import { NFTAdvisor } from '../NFTAdvisor';
import { PromptManager } from '../../core/PromptManager';
import { NFTAdvisorConfig, NFTEvaluation } from '../../types/agents';
import { fetchNFTData, analyzeRarity, getPriceHistory } from '../../utils/nft';

// Mock dependencies
jest.mock('../../utils/nft');
jest.mock('../../core/PromptManager');

describe('NFTAdvisor', () => {
  let advisor: NFTAdvisor;
  let mockPromptManager: jest.Mocked<PromptManager>;
  let mockConfig: NFTAdvisorConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      capabilities: ['NFT valuation', 'rarity analysis', 'market opportunity detection'],
      evaluationParameters: {
        priceHistory: 30, // days
        similarityThreshold: 0.8
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
    advisor = new NFTAdvisor(mockConfig, mockPromptManager);
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(advisor.initialize()).resolves.not.toThrow();
      expect(advisor.getState().status).toBe('ready');
    });

    it('should throw error if evaluation parameters are not configured', async () => {
      const invalidConfig = {
        ...mockConfig,
        evaluationParameters: undefined
      };
      const invalidAdvisor = new NFTAdvisor(invalidConfig, mockPromptManager);
      
      await expect(invalidAdvisor.initialize()).rejects.toThrow('Evaluation parameters not configured');
      expect(invalidAdvisor.getState().status).toBe('error');
    });
  });

  describe('NFT evaluation', () => {
    const mockNFTData = {
      tokenId: '1234',
      collection: 'CryptoPunks',
      traits: {
        'background': 'blue',
        'eyes': 'laser',
        'mouth': 'smile'
      },
      owner: '0x123...',
      lastSale: {
        price: '10.5',
        timestamp: Date.now() - 86400000 // 1 day ago
      }
    };

    const mockRarityAnalysis = {
      score: 85.5,
      traits: {
        'background': 0.15,
        'eyes': 0.05,
        'mouth': 0.2
      },
      rank: 123
    };

    const mockPriceHistory = {
      prices: [
        { price: '10.0', timestamp: Date.now() - 86400000 * 30 },
        { price: '10.5', timestamp: Date.now() - 86400000 }
      ],
      averagePrice: '10.25',
      priceChange: '+5%'
    };

    beforeEach(() => {
      // Mock NFT utility functions
      (fetchNFTData as jest.Mock).mockResolvedValue(mockNFTData);
      (analyzeRarity as jest.Mock).mockResolvedValue(mockRarityAnalysis);
      (getPriceHistory as jest.Mock).mockResolvedValue(mockPriceHistory);
    });

    it('should evaluate NFT successfully', async () => {
      await advisor.initialize();
      const response = await advisor.evaluateNFT('0x123...', '1234');

      expect(response.type).toBe('nft_evaluation');
      expect(response.content).toHaveProperty('rarity');
      expect(response.content).toHaveProperty('priceEstimate');
      expect(response.content).toHaveProperty('marketTrends');
    });

    it('should calculate accurate rarity scores', async () => {
      await advisor.initialize();
      const response = await advisor.evaluateNFT('0x123...', '1234');

      expect(response.content.rarity.score).toBe(mockRarityAnalysis.score);
      expect(response.content.rarity.traits).toEqual(mockRarityAnalysis.traits);
    });

    it('should provide price estimates with confidence levels', async () => {
      await advisor.initialize();
      const response = await advisor.evaluateNFT('0x123...', '1234');

      expect(response.content.priceEstimate).toHaveProperty('low');
      expect(response.content.priceEstimate).toHaveProperty('high');
      expect(response.content.priceEstimate).toHaveProperty('confidence');
    });
  });

  describe('state management', () => {
    it('should update state with last evaluation', async () => {
      await advisor.initialize();
      await advisor.evaluateNFT('0x123...', '1234');

      const state = advisor.getState();
      expect(state).toHaveProperty('lastEvaluation');
      expect(state.lastEvaluation).toHaveProperty('rarity');
      expect(state.lastEvaluation).toHaveProperty('priceEstimate');
    });

    it('should maintain tracked collections list', async () => {
      await advisor.initialize();
      const state = advisor.getState();
      expect(state.trackedCollections).toEqual([]);
      // Test adding/removing collections if those methods exist
    });
  });

  describe('error handling', () => {
    it('should handle NFT fetch errors', async () => {
      await advisor.initialize();
      (fetchNFTData as jest.Mock).mockRejectedValue(new Error('NFT not found'));

      await expect(advisor.evaluateNFT('0x123...', '1234')).rejects.toThrow('NFT not found');
      expect(advisor.getState().status).toBe('error');
    });

    it('should handle invalid NFT contract address', async () => {
      await advisor.initialize();
      await expect(advisor.evaluateNFT('invalid', '1234')).rejects.toThrow();
    });

    it('should handle rarity analysis failures', async () => {
      await advisor.initialize();
      (analyzeRarity as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

      await expect(advisor.evaluateNFT('0x123...', '1234')).rejects.toThrow('Analysis failed');
      expect(advisor.getState().status).toBe('error');
    });
  });

  describe('performance optimization', () => {
    it('should cache NFT evaluation results', async () => {
      await advisor.initialize();
      
      // First evaluation
      await advisor.evaluateNFT('0x123...', '1234');
      expect(fetchNFTData).toHaveBeenCalledTimes(1);
      
      // Second evaluation within cache window
      await advisor.evaluateNFT('0x123...', '1234');
      expect(fetchNFTData).toHaveBeenCalledTimes(1); // Should use cached results
    });

    it('should respect similarity threshold for trait comparison', async () => {
      await advisor.initialize();
      await advisor.evaluateNFT('0x123...', '1234');

      expect(analyzeRarity).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          similarityThreshold: mockConfig.evaluationParameters.similarityThreshold
        })
      );
    });

    it('should limit price history analysis to configured timeframe', async () => {
      await advisor.initialize();
      await advisor.evaluateNFT('0x123...', '1234');

      expect(getPriceHistory).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        mockConfig.evaluationParameters.priceHistory
      );
    });
  });

  describe('market trend analysis', () => {
    it('should identify market opportunities', async () => {
      await advisor.initialize();
      const response = await advisor.evaluateNFT('0x123...', '1234', { includeMarketAnalysis: true });

      expect(response.content.marketTrends).toBeDefined();
      expect(response.content.marketTrends.length).toBeGreaterThan(0);
    });

    it('should consider floor price trends', async () => {
      await advisor.initialize();
      const response = await advisor.evaluateNFT('0x123...', '1234', { includeMarketAnalysis: true });

      expect(mockPromptManager.renderPrompt).toHaveBeenCalledWith(
        'nft-advisor-analyze',
        expect.objectContaining({
          priceHistory: expect.any(Object)
        }),
        expect.any(Object)
      );
    });
  });
}); 