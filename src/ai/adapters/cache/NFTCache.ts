import { BaseCache, CacheConfig } from './BaseCache';
import { NFTCollectionStats, NFTTransfer, NFTRarityScore } from '../NFTAdapter';

export interface NFTCacheConfig extends CacheConfig {
  statsTTL?: number; // Specific TTL for collection stats
  transferTTL?: number; // Specific TTL for transfer data
  rarityTTL?: number; // Specific TTL for rarity scores
}

export class NFTCache extends BaseCache<NFTCollectionStats | NFTTransfer | NFTRarityScore> {
  private statsConfig: CacheConfig;
  private transferConfig: CacheConfig;
  private rarityConfig: CacheConfig;

  constructor(config: NFTCacheConfig) {
    super(config);
    
    this.statsConfig = {
      ...config,
      ttl: config.statsTTL || 300000 // 5 minutes default for collection stats
    };

    this.transferConfig = {
      ...config,
      ttl: config.transferTTL || 60000 // 1 minute default for transfers
    };

    this.rarityConfig = {
      ...config,
      ttl: config.rarityTTL || 3600000 // 1 hour default for rarity scores
    };
  }

  getCollectionStats(collectionAddress: string): NFTCollectionStats | undefined {
    const key = `stats:${collectionAddress}`;
    return this.get(key) as NFTCollectionStats | undefined;
  }

  setCollectionStats(collectionAddress: string, stats: NFTCollectionStats): void {
    const key = `stats:${collectionAddress}`;
    this.set(key, stats);
  }

  getTransfer(collectionAddress: string, tokenId: string): NFTTransfer | undefined {
    const key = `transfer:${collectionAddress}:${tokenId}`;
    return this.get(key) as NFTTransfer | undefined;
  }

  setTransfer(collectionAddress: string, tokenId: string, transfer: NFTTransfer): void {
    const key = `transfer:${collectionAddress}:${tokenId}`;
    this.set(key, transfer);
  }

  getRarityScore(collectionAddress: string, tokenId: string): NFTRarityScore | undefined {
    const key = `rarity:${collectionAddress}:${tokenId}`;
    return this.get(key) as NFTRarityScore | undefined;
  }

  setRarityScore(collectionAddress: string, tokenId: string, score: NFTRarityScore): void {
    const key = `rarity:${collectionAddress}:${tokenId}`;
    this.set(key, score);
  }

  invalidateCollectionStats(collectionAddress: string): void {
    const key = `stats:${collectionAddress}`;
    this.invalidate(key);
  }

  invalidateTransfer(collectionAddress: string, tokenId: string): void {
    const key = `transfer:${collectionAddress}:${tokenId}`;
    this.invalidate(key);
  }

  invalidateRarityScore(collectionAddress: string, tokenId: string): void {
    const key = `rarity:${collectionAddress}:${tokenId}`;
    this.invalidate(key);
  }

  protected cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      let ttl: number;
      
      if (key.startsWith('stats:')) {
        ttl = this.statsConfig.ttl;
      } else if (key.startsWith('transfer:')) {
        ttl = this.transferConfig.ttl;
      } else {
        ttl = this.rarityConfig.ttl;
      }
      
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }
} 