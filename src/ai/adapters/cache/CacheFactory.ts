import { TrendSpotterCache, TrendSpotterCacheConfig } from './TrendSpotterCache';
import { SmartContractCache, SmartContractCacheConfig } from './SmartContractCache';
import { NFTCache, NFTCacheConfig } from './NFTCache';
import { TokenCache, TokenCacheConfig } from './TokenCache';
import { CacheConfig } from './BaseCache';

export class CacheFactory {
  private static instance: CacheFactory;
  private caches: Map<string, any>;

  private constructor() {
    this.caches = new Map();
  }

  public static getInstance(): CacheFactory {
    if (!CacheFactory.instance) {
      CacheFactory.instance = new CacheFactory();
    }
    return CacheFactory.instance;
  }

  public getTrendSpotterCache(config?: Partial<TrendSpotterCacheConfig>): TrendSpotterCache {
    const cacheKey = 'trendspotter';
    let cache = this.caches.get(cacheKey) as TrendSpotterCache;

    if (!cache) {
      const defaultConfig: TrendSpotterCacheConfig = {
        ttl: 300000, // 5 minutes default
        maxSize: 1000,
        cleanupInterval: 300000,
        priceTTL: 60000,
        trendTTL: 300000
      };
      cache = new TrendSpotterCache({ ...defaultConfig, ...config });
      this.caches.set(cacheKey, cache);
    }

    return cache;
  }

  public getSmartContractCache(config?: Partial<SmartContractCacheConfig>): SmartContractCache {
    const cacheKey = 'smartcontract';
    let cache = this.caches.get(cacheKey) as SmartContractCache;

    if (!cache) {
      const defaultConfig: SmartContractCacheConfig = {
        ttl: 300000,
        maxSize: 1000,
        cleanupInterval: 300000,
        eventTTL: 300000,
        stateTTL: 60000,
        securityTTL: 3600000
      };
      cache = new SmartContractCache({ ...defaultConfig, ...config });
      this.caches.set(cacheKey, cache);
    }

    return cache;
  }

  public getNFTCache(config?: Partial<NFTCacheConfig>): NFTCache {
    const cacheKey = 'nft';
    let cache = this.caches.get(cacheKey) as NFTCache;

    if (!cache) {
      const defaultConfig: NFTCacheConfig = {
        ttl: 300000,
        maxSize: 1000,
        cleanupInterval: 300000,
        statsTTL: 300000,
        transferTTL: 60000,
        rarityTTL: 3600000
      };
      cache = new NFTCache({ ...defaultConfig, ...config });
      this.caches.set(cacheKey, cache);
    }

    return cache;
  }

  public getTokenCache(config?: Partial<TokenCacheConfig>): TokenCache {
    const cacheKey = 'token';
    let cache = this.caches.get(cacheKey) as TokenCache;

    if (!cache) {
      const defaultConfig: TokenCacheConfig = {
        ttl: 300000,
        maxSize: 1000,
        cleanupInterval: 300000,
        transferTTL: 60000,
        marketTTL: 300000,
        holdersTTL: 3600000
      };
      cache = new TokenCache({ ...defaultConfig, ...config });
      this.caches.set(cacheKey, cache);
    }

    return cache;
  }

  public clearAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  public disposeAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.dispose();
    }
    this.caches.clear();
  }
} 