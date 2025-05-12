import { BlockchainService, ChainId, Address, TransactionData, BlockData } from '@/lib/blockchain';
import { WebSocketManager } from '@/lib/blockchain/websocket';
import { BlockchainDataAdapter, DataAdapterCache } from './BlockchainDataAdapter';
import { TokenDataSource, TokenDataConfig, TokenInfo, TokenDistribution } from './datasources/TokenDataSource';
import { TokenCache, TokenCacheConfig } from './cache/TokenCache';
import { BaseDataSource } from './datasources/BaseDataSource';
import { BaseCache } from './cache/BaseCache';
import { DataSourceFactory } from './datasources/DataSourceFactory';
import { CacheFactory } from './cache/CacheFactory';
import { ethers } from 'ethers';

// Interfaces for token data
export interface TokenData {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  circulatingSupply?: string;
  marketCap?: string;
  holders: number;
  verified: boolean;
  implementation?: Address; // For proxy contracts
}

export interface TokenMarketData {
  price: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  priceChange24h: number;
  timestamp: number;
}

export interface TokenLiquidityData {
  totalLiquidity: string;
  liquidityPairs: LiquidityPair[];
  liquidityScore: number;
  dexVolume24h: string;
  cexVolume24h: string;
  pool: Address;
  token0: Address;
  token1: Address;
  reserve0: string;
  reserve1: string;
  totalValueLocked: string;
  volume24h: string;
  fee: number;
  lastUpdate: number;
}

export interface LiquidityPair {
  dex: string;
  pairAddress: Address;
  token0: Address;
  token1: Address;
  reserve0: string;
  reserve1: string;
  totalLiquidity: string;
  volume24h: string;
  fee: number;
}

export interface TokenHolderData {
  address: Address;
  balance: string;
  percentage: number;
  type: 'contract' | 'eoa' | 'unknown';
  tags?: string[];
  lastTransactionDate?: Date;
  rank: number;
}

export interface TokenAnalysis {
  info: TokenInfo;
  market: TokenMarketData;
  holders: TokenHolderStats;
  metrics: {
    liquidityScore: number;
    concentrationRisk: number;
    tradingActivity: number;
  };
  timestamp: number;
}

export interface TokenHolderStats {
  totalHolders: number;
  topHolders: {
    address: string;
    balance: string;
    percentage: number;
  }[];
  circulatingSupply: string;
  timestamp: number;
}

export interface TokenSentiment {
  score: number; // -1 to 1
  volume: number; // Number of interactions/mentions
  trending: boolean;
  keywords: string[];
  lastUpdate: number;
}

// Specialized cache for token data
export interface TokenCache extends DataAdapterCache<TokenTransfer | TokenMarketData | TokenHolderData | TokenLiquidityData | TokenSentiment> {
  getMarketData(token: Address, chainId: ChainId): TokenMarketData | undefined;
  setMarketData(token: Address, chainId: ChainId, data: TokenMarketData): void;
  getLiquidityData(token: Address, chainId: ChainId): TokenLiquidityData[];
  setLiquidityData(token: Address, chainId: ChainId, data: TokenLiquidityData[]): void;
  getHolderData(token: Address, chainId: ChainId): TokenHolderData[];
  setHolderData(token: Address, chainId: ChainId, data: TokenHolderData[]): void;
  getSentiment(token: Address, chainId: ChainId): TokenSentiment | undefined;
  setSentiment(token: Address, chainId: ChainId, data: TokenSentiment): void;
  getRecentTransfers(token: Address, chainId: ChainId): TokenTransfer[];
  addTransfer(token: Address, chainId: ChainId, transfer: TokenTransfer): void;
}

// Token adapter for ERC20 analysis
export class TokenAdapter extends BlockchainDataAdapter {
  private tokenDataSource: TokenDataSource;
  private tokenCache: TokenCache;
  private monitoredTokens: Set<string> = new Set();

  constructor(
    service: BlockchainService,
    wsManager: WebSocketManager,
    config?: DataAdapterConfig
  ) {
    super(service, wsManager, config);
    this.tokenDataSource = DataSourceFactory.getInstance().getTokenDataSource(
      config?.dataSourceConfig as TokenDataConfig
    );
    this.tokenCache = CacheFactory.getInstance().getTokenCache(
      config?.cacheConfig as TokenCacheConfig
    );
  }

  protected createDataSource(): BaseDataSource {
    return this.tokenDataSource;
  }

  protected createCache(): BaseCache<any> {
    return this.tokenCache;
  }

  protected setupEventHandlers(): void {
    this.tokenDataSource.on('contractEvent', (event) => {
      if (event.topics[0] === ethers.utils.id('Transfer(address,address,uint256)')) {
        this.handleTransferEvent(event);
      }
    });

    this.tokenDataSource.on('price', (update) => {
      this.handlePriceUpdate(update);
    });

    this.tokenDataSource.on('error', (error) => {
      this.handleError(error.error, `Token data source: ${error.context}`);
    });
  }

  public async monitorToken(tokenAddress: string, symbol: string): Promise<void> {
    this.validateInitialized();

    try {
      if (this.monitoredTokens.has(tokenAddress)) {
        return;
      }

      // Get initial token info
      await this.getTokenInfo(tokenAddress);

      // Subscribe to Transfer events
      await this.tokenDataSource.subscribeToTransfers(tokenAddress);

      // Subscribe to market data
      await this.tokenDataSource.subscribeToMarketData(symbol);

      this.monitoredTokens.add(tokenAddress);
    } catch (error) {
      throw new Error(`Failed to monitor token: ${error.message}`);
    }
  }

  public async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    this.validateInitialized();

    try {
      return await this.tokenDataSource.getTokenInfo(tokenAddress);
    } catch (error) {
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  public async analyzeToken(tokenAddress: string): Promise<TokenAnalysis> {
    this.validateInitialized();

    try {
      // Get token info
      const info = await this.getTokenInfo(tokenAddress);

      // Get market data from cache
      const marketData = this.tokenCache.getMarketData(tokenAddress);
      if (!marketData) {
        throw new Error('No market data available');
      }

      // Get holder distribution
      const holders = await this.tokenDataSource.getTokenDistribution(tokenAddress);

      // Calculate metrics
      const metrics = this.calculateTokenMetrics(marketData, holders);

      return {
        info,
        market: marketData,
        holders,
        metrics,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to analyze token: ${error.message}`);
    }
  }

  private calculateTokenMetrics(
    market: TokenMarketData,
    holders: TokenHolderStats
  ): TokenAnalysis['metrics'] {
    // Calculate liquidity score (0-1)
    // Higher is better - based on liquidity relative to market cap
    const liquidityScore = Math.min(market.liquidity / market.marketCap, 1);

    // Calculate concentration risk (0-1)
    // Higher means more concentrated holdings (worse)
    const concentrationRisk = holders.topHolders.reduce(
      (risk, holder) => risk + Math.pow(holder.percentage / 100, 2),
      0
    );

    // Calculate trading activity (0-1)
    // Higher means more active trading relative to market cap
    const tradingActivity = Math.min(market.volume24h / market.marketCap, 1);

    return {
      liquidityScore,
      concentrationRisk,
      tradingActivity
    };
  }

  private handleTransferEvent(event: any): void {
    const [from, to] = event.topics.slice(1).map(topic =>
      ethers.utils.getAddress(ethers.utils.hexDataSlice(topic, 12))
    );
    const amount = ethers.BigNumber.from(event.data).toString();

    const transfer: TokenTransfer = {
      from,
      to,
      amount,
      timestamp: Date.now(),
      transactionHash: event.transactionHash
    };

    // Cache the transfer
    this.tokenCache.setTransfer(event.address, event.transactionHash, transfer);

    // Emit transfer event
    this.emit('transfer', transfer);

    // Invalidate holder stats cache
    this.tokenCache.invalidateHolderStats(event.address);
  }

  private handlePriceUpdate(update: any): void {
    const marketData: TokenMarketData = {
      price: update.price,
      volume24h: update.volume,
      marketCap: update.price * parseFloat(update.totalSupply),
      liquidity: update.liquidity || 0,
      priceChange24h: update.change24h,
      timestamp: update.timestamp
    };

    // Cache the market data
    this.tokenCache.setMarketData(update.symbol, marketData);

    // Emit market update
    this.emit('marketUpdate', marketData);
  }

  public async shutdown(): Promise<void> {
    // Unsubscribe from all tokens
    for (const address of this.monitoredTokens) {
      await this.tokenDataSource.unsubscribeFromTransfers(address);
      // Note: We should also unsubscribe from market data, but we need to maintain
      // a mapping of address to symbol to do this properly
    }
    this.monitoredTokens.clear();

    await super.shutdown();
  }

  // Token data fetching
  async getTokenData(chainId: ChainId, address: Address): Promise<TokenData | undefined> {
    try {
      if (this.tokenCache) {
        const cached = this.tokenCache.get(address);
        if (cached) return cached;
      }

      const contract = await this.service.getContract(chainId, address);
      if (!contract) throw new Error('Token contract not found');

      const tokenData: TokenData = {
        address,
        name: await this.service.callContractMethod(chainId, address, 'name', []),
        symbol: await this.service.callContractMethod(chainId, address, 'symbol', []),
        decimals: Number(await this.service.callContractMethod(chainId, address, 'decimals', [])),
        totalSupply: (await this.service.callContractMethod(chainId, address, 'totalSupply', [])).toString(),
        circulatingSupply: await this.getCirculatingSupply(chainId, address),
        marketCap: await this.getMarketCap(chainId, address),
        holders: await this.getHolderCount(chainId, address),
        verified: await this.service.isContractVerified(chainId, address),
        implementation: await this.getImplementationAddress(chainId, address)
      };

      this.tokenCache?.set(address, tokenData);
      return tokenData;
    } catch (error) {
      this.handleError(error, 'getTokenData');
      return undefined;
    }
  }

  // Market data fetching
  async getMarketData(chainId: ChainId, address: Address): Promise<TokenMarketData | undefined> {
    try {
      if (this.tokenCache) {
        const cached = this.tokenCache.getMarketData(address);
        if (cached) return cached;
      }

      // Implementation should aggregate data from multiple sources
      // This is a placeholder that should be implemented based on your data sources
      return undefined;
    } catch (error) {
      this.handleError(error, 'getMarketData');
      return undefined;
    }
  }

  // Liquidity analysis
  async getLiquidityData(chainId: ChainId, address: Address): Promise<TokenLiquidityData | undefined> {
    try {
      if (this.tokenCache) {
        const cached = this.tokenCache.getLiquidityData(address);
        if (cached) return cached;
      }

      // Implementation should aggregate DEX data
      // This is a placeholder that should be implemented based on your data sources
      return undefined;
    } catch (error) {
      this.handleError(error, 'getLiquidityData');
      return undefined;
    }
  }

  // Holder analysis
  async getHolderData(chainId: ChainId, address: Address): Promise<TokenHolderData[] | undefined> {
    try {
      if (this.tokenCache) {
        const cached = this.tokenCache.getHolderData(address);
        if (cached) return cached;
      }

      // Implementation should fetch and analyze holder data
      // This is a placeholder that should be implemented based on your data sources
      return undefined;
    } catch (error) {
      this.handleError(error, 'getHolderData');
      return undefined;
    }
  }

  // Helper methods
  private async getCirculatingSupply(chainId: ChainId, address: Address): Promise<string | undefined> {
    // Implementation should calculate circulating supply
    // This is a placeholder that should be implemented based on your data sources
    return undefined;
  }

  private async getMarketCap(chainId: ChainId, address: Address): Promise<string | undefined> {
    // Implementation should calculate market cap
    // This is a placeholder that should be implemented based on your data sources
    return undefined;
  }

  private async getHolderCount(chainId: ChainId, address: Address): Promise<number> {
    // Implementation should count unique holders
    // This is a placeholder that should be implemented based on your data sources
    return 0;
  }

  private async getImplementationAddress(chainId: ChainId, address: Address): Promise<Address | undefined> {
    try {
      // Try EIP-1967 proxy storage slot
      const implementation = await this.service.getStorageAt(
        chainId,
        address,
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
      );
      return implementation as Address;
    } catch {
      return undefined;
    }
  }

  // Override error handling for token-specific errors
  protected handleError(error: any, context: string): void {
    // Add token-specific error handling
    super.handleError(error, `Token:${context}`);
  }
}


