import { BaseAgent } from '../core/BaseAgent';
import { PromptManager } from '../core/PromptManager';
import { TrendSpotterConfig, TrendSpotterState, MarketTrend, AgentResponse } from '../types/agents';
import { fetchMarketData, analyzeSentiment, getHistoricalPatterns } from '../utils/market';
import { PerformanceManager } from '../core/PerformanceManager';

export class TrendSpotter extends BaseAgent<TrendSpotterConfig, TrendSpotterState> {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  constructor(config: TrendSpotterConfig, promptManager: PromptManager) {
    const initialState: TrendSpotterState = {
      status: 'initializing',
      lastUpdate: Date.now(),
      monitoredPatterns: [],
      lastTrend: undefined
    };
    super(config, initialState, promptManager);
  }

  async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.trendParameters?.confidenceThreshold) {
        throw new Error('Confidence threshold not configured');
      }

      if (!this.config.trendParameters?.timeframe) {
        throw new Error('Timeframe not configured');
      }

      // Initialize performance manager for caching
      this.performanceManager.registerCache('market-data', this.CACHE_TTL);

      // Set state to ready
      this.state.status = 'ready';
      this.state.lastUpdate = Date.now();
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  async analyzeTrends(symbol: string, options: { includeSentiment?: boolean } = {}): Promise<AgentResponse> {
    try {
      this.state.status = 'processing';

      // Get market data with caching
      const marketData = await this.getCachedMarketData(symbol);

      // Get sentiment data if requested
      let sentiment;
      if (options.includeSentiment) {
        sentiment = await analyzeSentiment(symbol);
      }

      // Get historical patterns
      const patterns = await getHistoricalPatterns(symbol);

      // Filter patterns based on confidence threshold
      const validPatterns = patterns.filter(
        pattern => pattern.confidence >= this.config.trendParameters.confidenceThreshold
      );

      // Prepare data for prompt
      const promptData = {
        symbol,
        marketData,
        patterns: validPatterns,
        sentiment,
        timeframe: this.config.trendParameters.timeframe
      };

      // Get AI analysis through prompt manager
      const analysis = await this.promptManager.renderPrompt(
        'trend-spotter-analyze',
        promptData,
        this.config.modelConfig
      );

      // Parse and validate the analysis
      const trend: MarketTrend = this.parseAnalysis(analysis);

      // Update state
      this.state.lastTrend = trend;
      this.state.lastUpdate = Date.now();
      this.state.status = 'ready';

      // Return formatted response
      return {
        type: 'market_trend',
        data: trend,
        metadata: {
          symbol,
          timestamp: Date.now(),
          includedSentiment: !!options.includeSentiment
        }
      };
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  private async getCachedMarketData(symbol: string): Promise<any> {
    const cacheKey = `market-data-${symbol}`;
    
    // Try to get from cache first
    const cachedData = await this.performanceManager.getCached(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch fresh data
    const marketData = await fetchMarketData(symbol);
    
    // Cache the result
    await this.performanceManager.cache(cacheKey, marketData);
    
    return marketData;
  }

  private parseAnalysis(analysis: string): MarketTrend {
    try {
      // Assuming the prompt returns a JSON string
      const parsed = JSON.parse(analysis);
      
      // Validate the required fields
      if (!parsed.trend || !parsed.confidence || !parsed.signals || !parsed.predictions) {
        throw new Error('Invalid analysis format');
      }

      // Ensure trend is one of the allowed values
      if (!['bullish', 'bearish', 'neutral'].includes(parsed.trend)) {
        throw new Error('Invalid trend value');
      }

      // Ensure confidence is a number between 0 and 1
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error('Invalid confidence value');
      }

      return parsed as MarketTrend;
    } catch (error) {
      throw new Error(`Failed to parse analysis: ${error.message}`);
    }
  }

  // Method to add a pattern to monitor
  async addMonitoredPattern(pattern: string): Promise<void> {
    if (!this.state.monitoredPatterns.includes(pattern)) {
      this.state.monitoredPatterns.push(pattern);
      this.state.lastUpdate = Date.now();
    }
  }

  // Method to remove a monitored pattern
  async removeMonitoredPattern(pattern: string): Promise<void> {
    this.state.monitoredPatterns = this.state.monitoredPatterns.filter(p => p !== pattern);
    this.state.lastUpdate = Date.now();
  }

  // Override cleanup to handle any TrendSpotter-specific cleanup
  async cleanup(): Promise<void> {
    // Clear the cache
    this.cache.clear();
    
    // Clear monitored patterns
    this.state.monitoredPatterns = [];
    
    // Set status to terminated
    this.state.status = 'terminated';
    this.state.lastUpdate = Date.now();
  }
} 