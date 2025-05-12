import { BlockchainService, ChainId, Address, TransactionData, BlockData } from '@/lib/blockchain';
import { WebSocketManager } from '@/lib/blockchain/websocket';
import { BlockchainDataAdapter, DataAdapterCache } from './BlockchainDataAdapter';
import { NFTDataSource, NFTDataConfig, NFTMetadata } from './datasources/NFTDataSource';
import { NFTCache, NFTCacheConfig } from './cache/NFTCache';
import { BaseDataSource } from './datasources/BaseDataSource';
import { BaseCache } from './cache/BaseCache';
import { DataSourceFactory } from './datasources/DataSourceFactory';
import { CacheFactory } from './cache/CacheFactory';
import { ethers } from 'ethers';

// Interfaces for NFT data
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  externalUrl?: string;
  animationUrl?: string;
}

export interface NFTAttribute {
  traitType: string;
  value: string | number;
  displayType?: string;
  rarity?: number;
}

export interface NFTCollectionData {
  address: Address;
  name: string;
  symbol: string;
  totalSupply: number;
  ownerCount: number;
  floorPrice?: string;
  volume24h?: string;
  verified: boolean;
  standard: 'ERC721' | 'ERC1155';
  contractURI?: string;
  baseURI?: string;
}

export interface NFTTokenData {
  tokenId: string;
  owner: Address;
  metadata: NFTMetadata;
  lastTransferBlock: number;
  lastSalePrice?: string;
  rarityScore?: number;
  estimatedValue?: string;
}

export interface NFTMarketData {
  floorPrice: string;
  volume24h: string;
  sales24h: number;
  averagePrice24h: string;
  highestSale24h: string;
  lowestSale24h: string;
  priceChange24h: number;
  listings: number;
}

export interface NFTRarityAnalysis {
  tokenId: string;
  overallRank: number;
  rarityScore: number;
  attributeScores: Record<string, number>;
  similarTokens: string[];
  estimatedValue: string;
}

export interface NFTTransfer {
  tokenId: string;
  from: Address;
  to: Address;
  price?: string;
  timestamp: number;
  transactionHash: string;
}

export interface NFTCollectionStats {
  floorPrice: string;
  volume24h: string;
  totalVolume: string;
  totalSupply: number;
  numHolders: number;
  averagePrice24h: string;
  lastUpdate: number;
}

export interface NFTRarityScore {
  tokenId: string;
  score: number;
  rank: number;
  traitScores: Record<string, number>;
}

export interface CollectionAnalysis {
  stats: NFTCollectionStats;
  metrics: {
    uniqueHoldersRatio: number;
    tradingVolume24h: number;
    averagePrice24h: number;
    priceChange24h: number;
  };
  timestamp: number;
}

// Specialized cache for NFT data
export interface NFTCache extends DataAdapterCache<NFTTransfer | NFTMetadata | NFTCollectionStats | NFTRarityScore> {
  getCollectionStats(collection: Address, chainId: ChainId): NFTCollectionStats | undefined;
  setCollectionStats(collection: Address, chainId: ChainId, stats: NFTCollectionStats): void;
  getNFTMetadata(collection: Address, tokenId: string, chainId: ChainId): NFTMetadata | undefined;
  setNFTMetadata(collection: Address, tokenId: string, chainId: ChainId, metadata: NFTMetadata): void;
  getRarityScore(collection: Address, tokenId: string, chainId: ChainId): NFTRarityScore | undefined;
  setRarityScore(collection: Address, tokenId: string, chainId: ChainId, score: NFTRarityScore): void;
  getRecentTransfers(collection: Address, chainId: ChainId): NFTTransfer[];
  addTransfer(collection: Address, chainId: ChainId, transfer: NFTTransfer): void;
}

// NFT adapter for collection analysis
export class NFTAdapter extends BlockchainDataAdapter {
  private nftDataSource: NFTDataSource;
  private nftCache: NFTCache;
  private monitoredCollections: Set<string> = new Set();

  constructor(config?: DataAdapterConfig) {
    super();
    this.nftDataSource = DataSourceFactory.getInstance().getNFTDataSource(
      config?.dataSourceConfig as NFTDataConfig
    );
    this.nftCache = CacheFactory.getInstance().getNFTCache(
      config?.cacheConfig as NFTCacheConfig
    );
  }

  protected createDataSource(): BaseDataSource {
    return this.nftDataSource;
  }

  protected createCache(): BaseCache<any> {
    return this.nftCache;
  }

  protected setupEventHandlers(): void {
    this.nftDataSource.on('contractEvent', (event) => {
      if (event.topics[0] === ethers.utils.id('Transfer(address,address,uint256)')) {
        this.handleTransferEvent(event);
      }
    });

    this.nftDataSource.on('error', (error) => {
      this.handleError(error.error, `NFT data source: ${error.context}`);
    });
  }

  public async monitorCollection(collectionAddress: string): Promise<void> {
    this.validateInitialized();

    try {
      if (this.monitoredCollections.has(collectionAddress)) {
        return;
      }

      // Get initial collection stats
      await this.getCollectionStats(collectionAddress);

      // Subscribe to Transfer events
      await this.nftDataSource.subscribeToEvents({
        address: collectionAddress,
        topics: [ethers.utils.id('Transfer(address,address,uint256)')]
      });

      this.monitoredCollections.add(collectionAddress);
    } catch (error) {
      throw new Error(`Failed to monitor collection: ${error.message}`);
    }
  }

  public async getCollectionStats(collectionAddress: string): Promise<NFTCollectionStats> {
    this.validateInitialized();

    try {
      // Check cache first
      const cachedStats = this.nftCache.getCollectionStats(collectionAddress);
      if (cachedStats) {
        return cachedStats;
      }

      // Get stats from blockchain
      const stats = await this.nftDataSource.getCollectionStats(collectionAddress);

      // Cache the result
      this.nftCache.setCollectionStats(collectionAddress, stats);

      return stats;
    } catch (error) {
      throw new Error(`Failed to get collection stats: ${error.message}`);
    }
  }

  public async analyzeCollection(collectionAddress: string): Promise<CollectionAnalysis> {
    this.validateInitialized();

    try {
      // Get collection stats
      const stats = await this.getCollectionStats(collectionAddress);

      // Get recent sales
      const sales = await this.nftDataSource.getSales(
        collectionAddress,
        Math.floor((Date.now() - 86400000) / 1000) // 24h ago
      );

      // Calculate metrics
      const metrics = this.calculateCollectionMetrics(stats, sales);

      return {
        stats,
        metrics,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to analyze collection: ${error.message}`);
    }
  }

  public async analyzeTokenMetadata(
    collectionAddress: string,
    tokenId: string
  ): Promise<{
    metadata: NFTMetadata;
    rarity: NFTRarityScore;
    timestamp: number;
  }> {
    this.validateInitialized();

    try {
      // Check cache first
      const cachedRarity = this.nftCache.getRarityScore(collectionAddress, tokenId);
      let metadata: NFTMetadata;

      if (cachedRarity) {
        metadata = await this.nftDataSource.getTokenMetadata(collectionAddress, tokenId);
        return {
          metadata,
          rarity: cachedRarity,
          timestamp: Date.now()
        };
      }

      // Get metadata and calculate rarity
      metadata = await this.nftDataSource.getTokenMetadata(collectionAddress, tokenId);
      const rarity = await this.calculateRarityScore(collectionAddress, metadata);

      // Cache the result
      this.nftCache.setRarityScore(collectionAddress, tokenId, rarity);

      return {
        metadata,
        rarity,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to analyze token metadata: ${error.message}`);
    }
  }

  private async calculateRarityScore(
    collectionAddress: string,
    metadata: NFTMetadata
  ): Promise<NFTRarityScore> {
    // Placeholder for actual rarity calculation logic
    // In a real implementation, this would:
    // 1. Get trait distribution for the collection
    // 2. Calculate rarity score for each trait
    // 3. Calculate overall rarity score
    // 4. Determine rank within collection

    const traitScores = metadata.attributes.map(attr => ({
      trait_type: attr.traitType,
      value: attr.value,
      rarity: 0.1 // Placeholder - should be calculated based on trait distribution
    }));

    const score = traitScores.reduce((sum, trait) => sum + trait.rarity, 0);

    return {
      score,
      rank: 1, // Placeholder - should be calculated based on collection
      traitScores,
      timestamp: Date.now()
    };
  }

  private calculateCollectionMetrics(
    stats: NFTCollectionStats,
    sales: any[]
  ): CollectionAnalysis['metrics'] {
    const uniqueHoldersRatio = stats.numHolders / stats.totalSupply;

    const volume24h = sales.reduce((sum, sale) => sum + sale.price, 0);
    const averagePrice24h = sales.length > 0 ? volume24h / sales.length : 0;

    // Calculate price change
    const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);
    const latestPrice = sortedSales[0]?.price || 0;
    const oldestPrice = sortedSales[sortedSales.length - 1]?.price || latestPrice;
    const priceChange24h = oldestPrice > 0 
      ? ((latestPrice - oldestPrice) / oldestPrice) * 100 
      : 0;

    return {
      uniqueHoldersRatio,
      tradingVolume24h: volume24h,
      averagePrice24h,
      priceChange24h
    };
  }

  private handleTransferEvent(event: any): void {
    const [from, to] = event.topics.slice(1).map(topic =>
      ethers.utils.getAddress(ethers.utils.hexDataSlice(topic, 12))
    );
    const tokenId = ethers.BigNumber.from(event.topics[3]).toString();

    const transfer: NFTTransfer = {
      tokenId,
      from,
      to,
      timestamp: Date.now(),
      transactionHash: event.transactionHash
    };

    // Cache the transfer
    this.nftCache.setTransfer(event.address, tokenId, transfer);

    // Emit transfer event
    this.emit('transfer', {
      ...transfer,
      collection: event.address
    });

    // Invalidate collection stats cache
    this.nftCache.invalidateCollectionStats(event.address);
  }

  public async shutdown(): Promise<void> {
    // Unsubscribe from all collections
    for (const address of this.monitoredCollections) {
      await this.nftDataSource.unsubscribeFromEvents({
        address,
        topics: [ethers.utils.id('Transfer(address,address,uint256)')]
      });
    }
    this.monitoredCollections.clear();

    await super.shutdown();
  }

  // Required abstract method implementations
  async parseTransferEvent(collection: Address, chainId: ChainId, log: any): Promise<NFTTransfer | undefined> {
    // TODO: Implement actual transfer event parsing logic
    return undefined;
  }

  async fetchCollectionStats(collection: Address, chainId: ChainId): Promise<NFTCollectionStats | undefined> {
    // TODO: Implement collection stats fetching logic
    return undefined;
  }

  async fetchNFTMetadata(collection: Address, tokenId: string, chainId: ChainId): Promise<NFTMetadata | undefined> {
    try {
      // Check cache first
      if (this.cache) {
        const cached = (this.cache as NFTCache).getNFTMetadata(collection, tokenId, chainId);
        if (cached) {
          return cached;
        }
      }

      // TODO: Implement metadata fetching logic
      const metadata: NFTMetadata = {
        tokenId,
        attributes: []
      };

      // Cache the result
      if (this.cache) {
        (this.cache as NFTCache).setNFTMetadata(collection, tokenId, chainId, metadata);
      }

      return metadata;
    } catch (error) {
      this.handleError(error, 'fetchNFTMetadata');
      return undefined;
    }
  }

  // Override error handling for NFT-specific errors
  protected handleError(error: any, context: string): void {
    // Add NFT-specific error handling
    super.handleError(error, `NFT:${context}`);
  }
}

