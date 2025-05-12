import { BaseCache, CacheConfig } from './BaseCache';
import { TokenTransfer, TokenMarketData, TokenHolderStats } from '../TokenAdapter';

export interface TokenCacheConfig extends CacheConfig {
  transferTTL?: number; // Specific TTL for transfer data
  marketTTL?: number; // Specific TTL for market data
  holdersTTL?: number; // Specific TTL for holder statistics
}

export class TokenCache extends BaseCache<TokenTransfer | TokenMarketData | TokenHolderStats> {
  private transferConfig: CacheConfig;
  private marketConfig: CacheConfig;
  private holdersConfig: CacheConfig;

  constructor(config: TokenCacheConfig) {
    super(config);
    
    this.transferConfig = {
      ...config,
      ttl: config.transferTTL || 60000 // 1 minute default for transfers
    };

    this.marketConfig = {
      ...config,
      ttl: config.marketTTL || 300000 // 5 minutes default for market data
    };

    this.holdersConfig = {
      ...config,
      ttl: config.holdersTTL || 3600000 // 1 hour default for holder stats
    };
  }

  getTransfer(tokenAddress: string, txHash: string): TokenTransfer | undefined {
    const key = `transfer:${tokenAddress}:${txHash}`;
    return this.get(key) as TokenTransfer | undefined;
  }

  setTransfer(tokenAddress: string, txHash: string, transfer: TokenTransfer): void {
    const key = `transfer:${tokenAddress}:${txHash}`;
    this.set(key, transfer);
  }

  getMarketData(tokenAddress: string): TokenMarketData | undefined {
    const key = `market:${tokenAddress}`;
    return this.get(key) as TokenMarketData | undefined;
  }

  setMarketData(tokenAddress: string, data: TokenMarketData): void {
    const key = `market:${tokenAddress}`;
    this.set(key, data);
  }

  getHolderStats(tokenAddress: string): TokenHolderStats | undefined {
    const key = `holders:${tokenAddress}`;
    return this.get(key) as TokenHolderStats | undefined;
  }

  setHolderStats(tokenAddress: string, stats: TokenHolderStats): void {
    const key = `holders:${tokenAddress}`;
    this.set(key, stats);
  }

  invalidateTransfer(tokenAddress: string, txHash: string): void {
    const key = `transfer:${tokenAddress}:${txHash}`;
    this.invalidate(key);
  }

  invalidateMarketData(tokenAddress: string): void {
    const key = `market:${tokenAddress}`;
    this.invalidate(key);
  }

  invalidateHolderStats(tokenAddress: string): void {
    const key = `holders:${tokenAddress}`;
    this.invalidate(key);
  }

  protected cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      let ttl: number;
      
      if (key.startsWith('transfer:')) {
        ttl = this.transferConfig.ttl;
      } else if (key.startsWith('market:')) {
        ttl = this.marketConfig.ttl;
      } else {
        ttl = this.holdersConfig.ttl;
      }
      
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }
} 