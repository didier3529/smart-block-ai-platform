import { BlockchainService, ChainId, Address } from '@/lib/blockchain';
import { WebSocketManager } from '@/lib/blockchain/websocket';
import { BlockchainDataAdapter, DataAdapterCache } from './BlockchainDataAdapter';
import { MarketDataSource, MarketDataConfig } from './datasources/MarketDataSource';
import { TrendSpotterCache, TrendSpotterCacheConfig } from './cache/TrendSpotterCache';
import { BaseDataSource } from './datasources/BaseDataSource';
import { BaseCache } from './cache/BaseCache';
import { DataSourceFactory } from './datasources/DataSourceFactory';
import { CacheFactory } from './cache/CacheFactory';

// Interfaces for market data
export interface MarketData {
  price: string;
  volume24h: string;
  priceChange24h: number;
  timestamp: number;
}

export interface TrendData {
  direction: 'up' | 'down' | 'sideways';
  strength: number; // 0-1
  timeframe: string;
  indicators: {
    movingAverages: {
      sma20: number;
      ema50: number;
      sma200: number;
    };
    rsi: number;
    volume: string;
  };
}

// Specialized cache for market data
export interface TrendSpotterCache extends DataAdapterCache<MarketData | TrendData> {
  getMarketData(token: Address, chainId: ChainId): MarketData | undefined;
  setMarketData(token: Address, chainId: ChainId, data: MarketData): void;
  getTrendData(token: Address, chainId: ChainId): TrendData | undefined;
  setTrendData(token: Address, chainId: ChainId, data: TrendData): void;
}

export interface PriceData {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  timestamp: number;
}

export interface MarketTrend {
  symbol: string;
  direction: 'up' | 'down' | 'neutral';
  strength: number; // 0 to 1
  timestamp: number;
  indicators: {
    priceAction: { value: number; weight: number; };
    volume: { value: number; weight: number; };
    depth: { value: number; weight: number; };
  };
}

// TrendSpotter adapter for market analysis
export class TrendSpotterAdapter extends BlockchainDataAdapter {
  private readonly marketDataSubscriptions: Map<string, string>;
  private readonly trendUpdateCallbacks: Map<string, (trend: TrendData) => void>;
  private readonly priceUpdateCallbacks: Map<string, (price: string) => void>;
  private marketDataSource: MarketDataSource;
  private trendSpotterCache: TrendSpotterCache;
  private activeSymbols: Set<string> = new Set();

  constructor(
    service: BlockchainService,
    wsManager: WebSocketManager,
    cache?: TrendSpotterCache
  ) {
    super(service, wsManager, cache);
    this.marketDataSubscriptions = new Map();
    this.trendUpdateCallbacks = new Map();
    this.priceUpdateCallbacks = new Map();

    // Listen for relevant events
    this.on('error', this.handleSubscriptionError.bind(this));

    this.marketDataSource = DataSourceFactory.getInstance().getMarketDataSource(
      cache?.dataSourceConfig as MarketDataConfig
    );
    this.trendSpotterCache = CacheFactory.getInstance().getTrendSpotterCache(
      cache?.cacheConfig as TrendSpotterCacheConfig
    );
  }

  private getSubscriptionKey(token: Address, chainId: ChainId): string {
    return `${chainId}-${token}`;
  }

  async subscribeToMarketData(
    token: Address,
    chainId: ChainId,
    onPriceUpdate?: (price: string) => void,
    onTrendUpdate?: (trend: TrendData) => void
  ): Promise<void> {
    const key = this.getSubscriptionKey(token, chainId);

    if (onPriceUpdate) {
      this.priceUpdateCallbacks.set(key, onPriceUpdate);
    }
    if (onTrendUpdate) {
      this.trendUpdateCallbacks.set(key, onTrendUpdate);
    }

    // If already subscribed, just add the callbacks
    if (this.marketDataSubscriptions.has(key)) {
      return;
    }

    try {
      // Subscribe to relevant events for market data
      const subscriptionId = await this.subscribeToLogs(
        chainId,
        {
          address: token,
          topics: [
            // Transfer event signature
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
          ]
        },
        async (log) => {
          await this.handleTransferEvent(token, chainId, log);
        }
      );

      this.marketDataSubscriptions.set(key, subscriptionId);

      // Also subscribe to new blocks for regular trend updates
      await this.subscribeToBlocks(chainId, async (blockNumber) => {
        await this.updateTrendData(token, chainId, blockNumber);
      });
    } catch (error) {
      this.handleError(error, 'subscribeToMarketData');
      throw error;
    }
  }

  async unsubscribeFromMarketData(token: Address, chainId: ChainId): Promise<void> {
    const key = this.getSubscriptionKey(token, chainId);
    const subscriptionId = this.marketDataSubscriptions.get(key);

    if (subscriptionId) {
      this.unsubscribe(subscriptionId);
      this.marketDataSubscriptions.delete(key);
      this.priceUpdateCallbacks.delete(key);
      this.trendUpdateCallbacks.delete(key);
    }
  }

  private async handleTransferEvent(token: Address, chainId: ChainId, log: any): Promise<void> {
    try {
      // Update market data based on transfer event
      const marketData = await this.fetchLatestMarketData(token, chainId);
      
      if (marketData) {
        // Update cache
        if (this.cache) {
          (this.cache as TrendSpotterCache).setMarketData(token, chainId, marketData);
        }

        // Notify price update subscribers
        const key = this.getSubscriptionKey(token, chainId);
        const priceCallback = this.priceUpdateCallbacks.get(key);
        if (priceCallback) {
          priceCallback(marketData.price);
        }

        // Update trend data
        await this.updateTrendData(token, chainId);
      }
    } catch (error) {
      this.handleError(error, 'handleTransferEvent');
    }
  }

  private async updateTrendData(token: Address, chainId: ChainId, blockNumber?: number): Promise<void> {
    try {
      const trendData = await this.analyzeTrend(token, chainId);
      
      if (trendData) {
        // Update cache
        if (this.cache) {
          (this.cache as TrendSpotterCache).setTrendData(token, chainId, trendData);
        }

        // Notify trend update subscribers
        const key = this.getSubscriptionKey(token, chainId);
        const trendCallback = this.trendUpdateCallbacks.get(key);
        if (trendCallback) {
          trendCallback(trendData);
        }
      }
    } catch (error) {
      this.handleError(error, 'updateTrendData');
    }
  }

  private handleSubscriptionError(error: any): void {
    // Implement custom error handling for market data subscriptions
    console.error('[TrendSpotterAdapter] Subscription error:', error);
    // TODO: Implement retry logic or fallback mechanisms
  }

  // Implement the required abstract methods
  async fetchLatestMarketData(token: Address, chainId: ChainId): Promise<MarketData | undefined> {
    // TODO: Implement actual market data fetching logic
    return undefined;
  }

  async analyzeTrend(token: Address, chainId: ChainId): Promise<TrendData | undefined> {
    // TODO: Implement trend analysis logic
    return undefined;
  }

  // Override cleanup to handle market data subscriptions
  async cleanup(): Promise<void> {
    // Unsubscribe from all market data subscriptions
    for (const [key, subscriptionId] of this.marketDataSubscriptions) {
      this.unsubscribe(subscriptionId);
    }
    this.marketDataSubscriptions.clear();
    this.priceUpdateCallbacks.clear();
    this.trendUpdateCallbacks.clear();

    // Call parent cleanup
    await super.cleanup();
  }

  // Market data fetching
  async getTokenPrice(chainId: ChainId, token: Address): Promise<MarketData | undefined> {
    try {
      if (this.cache) {
        const cached = (this.cache as TrendSpotterCache).getMarketData(token, chainId);
        if (cached) return cached;
      }

      // Fetch latest block for timestamp
      const latestBlock = await this.service.getLatestBlock(chainId);
      if (!latestBlock) throw new Error('Failed to fetch latest block');

      // Get token data from DEX or price feed
      const price = await this.service.getTokenPrice(chainId, token);
      const volume = await this.service.getTokenVolume(chainId, token, '24h');

      const marketData: MarketData = {
        price: price.toString(),
        volume24h: volume.toString(),
        priceChange24h: await this.calculatePriceChange(chainId, token),
        timestamp: latestBlock.timestamp
      };

      // Cache the result
      if (this.cache) {
        (this.cache as TrendSpotterCache).setMarketData(token, chainId, marketData);
      }
      return marketData;
    } catch (error) {
      this.handleError(error, 'getTokenPrice');
      return undefined;
    }
  }

  // Volume analysis
  async analyzeVolume(
    chainId: ChainId,
    token: Address,
    timeframe: string = '24h'
  ): Promise<{ volume: string; volumeChange: number } | undefined> {
    try {
      const currentVolume = await this.service.getTokenVolume(chainId, token, timeframe);
      const previousVolume = await this.service.getTokenVolume(chainId, token, timeframe, true);
      
      const volumeChange = ((Number(currentVolume) - Number(previousVolume)) / Number(previousVolume)) * 100;

      return {
        volume: currentVolume.toString(),
        volumeChange
      };
    } catch (error) {
      this.handleError(error, 'analyzeVolume');
      return undefined;
    }
  }

  // Helper methods
  private async calculatePriceChange(chainId: ChainId, token: Address): Promise<number> {
    try {
      const currentPrice = await this.service.getTokenPrice(chainId, token);
      const previousPrice = await this.service.getTokenPrice(chainId, token, '24h');
      return ((Number(currentPrice) - Number(previousPrice)) / Number(previousPrice)) * 100;
    } catch (error) {
      this.handleError(error, 'calculatePriceChange');
      return 0;
    }
  }

  // Override error handling for market-specific errors
  protected handleError(error: any, context: string): void {
    // Add market-specific error handling
    super.handleError(error, `TrendSpotter:${context}`);
  }

  protected createDataSource(): BaseDataSource {
    return this.marketDataSource;
  }

  protected createCache(): BaseCache<any> {
    return this.trendSpotterCache;
  }

  protected setupEventHandlers(): void {
    this.marketDataSource.on('price', (update) => {
      this.handlePriceUpdate(update);
    });

    this.marketDataSource.on('error', (error) => {
      this.handleError(error.error, `Market data source: ${error.context}`);
    });
  }

  public async analyzeTrend(symbol: string): Promise<MarketTrend> {
    this.validateInitialized();

    try {
      // Check cache first
      const cachedTrend = this.trendSpotterCache.getTrendData(symbol, '1h');
      if (cachedTrend) {
        return cachedTrend;
      }

      // Subscribe to real-time updates if not already
      if (!this.activeSymbols.has(symbol)) {
        await this.marketDataSource.subscribeToSymbol(symbol);
        this.activeSymbols.add(symbol);
      }

      // Get market depth for analysis
      const depth = await this.marketDataSource.getMarketDepth(symbol);

      // Calculate trend indicators
      const trend = await this.calculateTrend(symbol, depth);

      // Cache the result
      this.trendSpotterCache.setTrendData(symbol, '1h', trend);

      return trend;
    } catch (error) {
      throw new Error(`Failed to analyze market trend: ${error.message}`);
    }
  }

  private async calculateTrend(
    symbol: string,
    depth: any
  ): Promise<MarketTrend> {
    // Get recent price data from cache
    const priceData = this.trendSpotterCache.getPriceData(symbol);
    if (!priceData) {
      throw new Error('No price data available for trend calculation');
    }

    // Calculate price action indicator
    const priceAction = this.calculatePriceAction(priceData);

    // Calculate volume indicator
    const volumeIndicator = this.calculateVolumeIndicator(priceData);

    // Calculate depth indicator
    const depthIndicator = this.calculateDepthIndicator(depth);

    // Combine indicators with weights
    const indicators = {
      priceAction: { value: priceAction, weight: 0.3 },
      volume: { value: volumeIndicator, weight: 0.3 },
      depth: { value: depthIndicator, weight: 0.4 }
    };

    // Calculate overall trend
    const strength = this.calculateTrendStrength(indicators);
    const direction = this.determineTrendDirection(strength, priceData);

    return {
      symbol,
      direction,
      strength: Math.abs(strength),
      timestamp: Date.now(),
      indicators
    };
  }

  private calculatePriceAction(priceData: PriceData): number {
    // Simple price action calculation based on 24h change
    return Math.min(Math.max(priceData.change24h / 10, -1), 1);
  }

  private calculateVolumeIndicator(priceData: PriceData): number {
    // Volume analysis relative to recent average (placeholder)
    // In real implementation, compare to historical average
    return Math.min(priceData.volume / 1000, 1);
  }

  private calculateDepthIndicator(depth: any): number {
    // Analyze order book depth for buy/sell pressure
    const buyVolume = depth.bids.reduce((sum: number, [_, size]: number[]) => sum + size, 0);
    const sellVolume = depth.asks.reduce((sum: number, [_, size]: number[]) => sum + size, 0);
    
    // Calculate buy/sell pressure ratio
    const ratio = buyVolume / (buyVolume + sellVolume);
    return (ratio - 0.5) * 2; // Scale to -1 to 1
  }

  private calculateTrendStrength(indicators: MarketTrend['indicators']): number {
    return Object.values(indicators).reduce(
      (sum, { value, weight }) => sum + value * weight,
      0
    );
  }

  private determineTrendDirection(
    strength: number,
    priceData: PriceData
  ): MarketTrend['direction'] {
    if (Math.abs(strength) < 0.1) return 'neutral';
    return strength > 0 ? 'up' : 'down';
  }

  private handlePriceUpdate(update: PriceData): void {
    // Cache the price update
    this.trendSpotterCache.setPriceData(update.symbol, update);

    // Check if significant change warrants new trend calculation
    const cachedTrend = this.trendSpotterCache.getTrendData(update.symbol, '1h');
    if (this.isSignificantChange(update, cachedTrend)) {
      this.analyzeTrend(update.symbol)
        .then(trend => this.emit('trendUpdate', trend))
        .catch(error => this.handleError(error, 'Trend analysis'));
    }
  }

  private isSignificantChange(
    update: PriceData,
    lastTrend?: MarketTrend
  ): boolean {
    if (!lastTrend) return true;

    // Consider change significant if:
    // 1. More than 5% price change
    // 2. More than 15 minutes since last trend
    // 3. Volume spike (2x average)
    return (
      Math.abs(update.change24h) > 5 ||
      Date.now() - lastTrend.timestamp > 900000 ||
      update.volume > 200 // Threshold should be dynamic based on historical data
    );
  }

  public async shutdown(): Promise<void> {
    // Unsubscribe from all symbols
    for (const symbol of this.activeSymbols) {
      await this.marketDataSource.unsubscribeFromSymbol(symbol);
    }
    this.activeSymbols.clear();

    await super.shutdown();
  }
}

