import { BaseCache, CacheConfig } from './BaseCache';
import { MarketTrend, PriceData } from '../TrendSpotterAdapter';

export interface TrendSpotterCacheConfig extends CacheConfig {
  priceTTL?: number; // Specific TTL for price data
  trendTTL?: number; // Specific TTL for trend analysis
}

export class TrendSpotterCache extends BaseCache<PriceData | MarketTrend> {
  private priceConfig: CacheConfig;
  private trendConfig: CacheConfig;

  constructor(config: TrendSpotterCacheConfig) {
    super(config);
    
    // Initialize specialized TTLs for different data types
    this.priceConfig = {
      ...config,
      ttl: config.priceTTL || 60000 // 1 minute default for price data
    };

    this.trendConfig = {
      ...config,
      ttl: config.trendTTL || 300000 // 5 minutes default for trend data
    };
  }

  getPriceData(symbol: string): PriceData | undefined {
    const key = `price:${symbol}`;
    return this.get(key) as PriceData | undefined;
  }

  setPriceData(symbol: string, data: PriceData): void {
    const key = `price:${symbol}`;
    this.set(key, data);
  }

  getTrendData(symbol: string, timeframe: string): MarketTrend | undefined {
    const key = `trend:${symbol}:${timeframe}`;
    return this.get(key) as MarketTrend | undefined;
  }

  setTrendData(symbol: string, timeframe: string, trend: MarketTrend): void {
    const key = `trend:${symbol}:${timeframe}`;
    this.set(key, trend);
  }

  invalidatePriceData(symbol: string): void {
    const key = `price:${symbol}`;
    this.invalidate(key);
  }

  invalidateTrendData(symbol: string, timeframe: string): void {
    const key = `trend:${symbol}:${timeframe}`;
    this.invalidate(key);
  }

  protected cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const isPriceData = key.startsWith('price:');
      const ttl = isPriceData ? this.priceConfig.ttl : this.trendConfig.ttl;
      
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }
} 