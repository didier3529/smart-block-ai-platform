import { BaseAgent } from '../core/BaseAgent';
import { PromptManager } from '../core/PromptManager';
import { NFTAdvisorConfig, NFTAdvisorState, NFTEvaluation, AgentResponse } from '../types/agents';
import { fetchNFTData, analyzeRarity, getPriceHistory } from '../utils/nft';
import { PerformanceManager } from '../core/PerformanceManager';

export class NFTAdvisor extends BaseAgent<NFTAdvisorConfig, NFTAdvisorState> {
  private cache: Map<string, { evaluation: NFTEvaluation; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache TTL
  private performanceManager: PerformanceManager;

  constructor(config: NFTAdvisorConfig, promptManager: PromptManager) {
    super('nft_advisor');
    this.config = config;
    this.promptManager = promptManager;
    this.performanceManager = new PerformanceManager();
    this.state = {
      status: 'initializing',
      lastUpdate: Date.now(),
      trackedCollections: []
    };
  }

  async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.evaluationParameters) {
        throw new Error('Evaluation parameters not configured');
      }

      // Initialize performance manager
      await this.performanceManager.initialize({
        enableMetrics: true,
        maxConcurrentOperations: 3,
        cleanupInterval: 300000 // 5 minutes
      });

      this.state.status = 'ready';
      this.state.lastUpdate = Date.now();
    } catch (error) {
      this.state.status = 'error';
      this.state.lastUpdate = Date.now();
      throw error;
    }
  }

  async evaluateNFT(contractAddress: string, tokenId: string): Promise<AgentResponse> {
    try {
      // Input validation
      if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid contract address');
      }

      const cacheKey = `${contractAddress}-${tokenId}`;

      // Check cache
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return {
          type: 'nft_evaluation',
          content: cached.evaluation,
          metadata: {
            cached: true,
            contractAddress,
            tokenId
          }
        };
      }

      // Fetch NFT data
      const nftData = await this.performanceManager.executeWithRetry(
        () => fetchNFTData(contractAddress, tokenId),
        {
          operation: 'fetch_nft_data',
          maxRetries: 3
        }
      );

      // Analyze rarity
      const rarityAnalysis = await this.performanceManager.executeWithRetry(
        () => analyzeRarity(nftData, {
          similarityThreshold: this.config.evaluationParameters.similarityThreshold
        }),
        {
          operation: 'analyze_rarity',
          maxRetries: 2
        }
      );

      // Get price history
      const priceHistory = await this.performanceManager.executeWithRetry(
        () => getPriceHistory(contractAddress, {
          days: this.config.evaluationParameters.priceHistory
        }),
        {
          operation: 'get_price_history',
          maxRetries: 2
        }
      );

      // Generate evaluation with AI
      const prompt = await this.promptManager.renderPrompt('nft-advisor-evaluate', {
        nftData,
        rarityAnalysis,
        priceHistory,
        config: this.config
      });

      // Process the evaluation
      const evaluation: NFTEvaluation = {
        rarity: {
          score: rarityAnalysis.score,
          traits: rarityAnalysis.traits
        },
        priceEstimate: this.calculatePriceEstimate(priceHistory, rarityAnalysis),
        marketTrends: this.analyzeMarketTrends(priceHistory)
      };

      // Update cache and state
      this.cache.set(cacheKey, {
        evaluation,
        timestamp: Date.now()
      });

      // Update state
      this.setState({
        lastEvaluation: evaluation,
        trackedCollections: this.updateTrackedCollections(nftData.collection)
      });

      return {
        type: 'nft_evaluation',
        content: evaluation,
        metadata: {
          cached: false,
          contractAddress,
          tokenId,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      this.state.status = 'error';
      this.state.lastUpdate = Date.now();
      throw error;
    }
  }

  private calculatePriceEstimate(priceHistory: any, rarityAnalysis: any): {
    low: string;
    high: string;
    confidence: number;
  } {
    const avgPrice = parseFloat(priceHistory.averagePrice);
    const rarityMultiplier = rarityAnalysis.score / 50; // Normalize rarity score
    const volatility = this.calculateVolatility(priceHistory.prices);
    
    // Calculate price range based on rarity and recent price history
    const low = (avgPrice * Math.max(0.8, rarityMultiplier - volatility)).toFixed(3);
    const high = (avgPrice * Math.min(1.2, rarityMultiplier + volatility)).toFixed(3);
    
    // Calculate confidence based on price stability and data quality
    const confidence = Math.min(
      1,
      (1 - volatility) * // Price stability factor
      (priceHistory.prices.length / this.config.evaluationParameters.priceHistory) * // Data completeness factor
      0.9 // Max confidence cap
    );

    return {
      low,
      high,
      confidence
    };
  }

  private calculateVolatility(prices: Array<{ price: string; timestamp: number }>): number {
    if (prices.length < 2) return 0.5; // Default volatility for insufficient data

    const priceValues = prices.map(p => parseFloat(p.price));
    const mean = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    const variance = priceValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / priceValues.length;
    
    return Math.min(1, Math.sqrt(variance) / mean);
  }

  private analyzeMarketTrends(priceHistory: any): string[] {
    const trends: string[] = [];
    const prices = priceHistory.prices;
    
    if (prices.length < 2) {
      trends.push('Insufficient price history for trend analysis');
      return trends;
    }

    // Calculate price change percentage
    const oldestPrice = parseFloat(prices[0].price);
    const latestPrice = parseFloat(prices[prices.length - 1].price);
    const priceChange = ((latestPrice - oldestPrice) / oldestPrice) * 100;

    // Add trend observations
    if (priceChange > 10) {
      trends.push('Strong upward price trend');
    } else if (priceChange > 5) {
      trends.push('Moderate price appreciation');
    } else if (priceChange < -10) {
      trends.push('Significant price decline');
    } else if (priceChange < -5) {
      trends.push('Moderate price decline');
    } else {
      trends.push('Stable price range');
    }

    // Add volume analysis if available
    if (prices.length > this.config.evaluationParameters.priceHistory * 0.8) {
      trends.push('High trading activity');
    } else if (prices.length < this.config.evaluationParameters.priceHistory * 0.3) {
      trends.push('Low trading volume');
    }

    return trends;
  }

  private updateTrackedCollections(collection: string): string[] {
    if (!this.state.trackedCollections.includes(collection)) {
      return [...this.state.trackedCollections, collection];
    }
    return this.state.trackedCollections;
  }

  async cleanup(): Promise<void> {
    this.cache.clear();
    await this.performanceManager.cleanup();
  }
} 