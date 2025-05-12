import { MarketDataSource, MarketDataConfig } from './MarketDataSource';
import { ContractDataSource, ContractDataConfig } from './ContractDataSource';
import { NFTDataSource, NFTDataConfig } from './NFTDataSource';
import { TokenDataSource, TokenDataConfig } from './TokenDataSource';

export class DataSourceFactory {
  private static instance: DataSourceFactory;
  private dataSources: Map<string, any>;

  private constructor() {
    this.dataSources = new Map();
  }

  public static getInstance(): DataSourceFactory {
    if (!DataSourceFactory.instance) {
      DataSourceFactory.instance = new DataSourceFactory();
    }
    return DataSourceFactory.instance;
  }

  public getMarketDataSource(config: MarketDataConfig): MarketDataSource {
    const sourceKey = `market:${config.wsUrl}`;
    let source = this.dataSources.get(sourceKey) as MarketDataSource;

    if (!source) {
      source = new MarketDataSource(config);
      this.dataSources.set(sourceKey, source);
    }

    return source;
  }

  public getContractDataSource(config: ContractDataConfig): ContractDataSource {
    const sourceKey = `contract:${config.rpcUrl}:${config.networkId || 'default'}`;
    let source = this.dataSources.get(sourceKey) as ContractDataSource;

    if (!source) {
      source = new ContractDataSource(config);
      this.dataSources.set(sourceKey, source);
    }

    return source;
  }

  public getNFTDataSource(config: NFTDataConfig): NFTDataSource {
    const sourceKey = `nft:${config.contractDataConfig.rpcUrl}:${config.contractDataConfig.networkId || 'default'}`;
    let source = this.dataSources.get(sourceKey) as NFTDataSource;

    if (!source) {
      source = new NFTDataSource(config);
      this.dataSources.set(sourceKey, source);
    }

    return source;
  }

  public getTokenDataSource(config: TokenDataConfig): TokenDataSource {
    const sourceKey = `token:${config.contractDataConfig.rpcUrl}:${config.marketDataConfig.wsUrl}`;
    let source = this.dataSources.get(sourceKey) as TokenDataSource;

    if (!source) {
      source = new TokenDataSource(config);
      this.dataSources.set(sourceKey, source);
    }

    return source;
  }

  public async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.dataSources.values()).map(source => 
      source.disconnect().catch(error => {
        console.error('Error disconnecting data source:', error);
      })
    );

    await Promise.all(disconnectPromises);
    this.dataSources.clear();
  }

  public async healthCheck(): Promise<{[key: string]: boolean}> {
    const healthStatus: {[key: string]: boolean} = {};
    
    for (const [key, source] of this.dataSources.entries()) {
      try {
        healthStatus[key] = await source.isHealthy();
      } catch (error) {
        healthStatus[key] = false;
      }
    }

    return healthStatus;
  }
} 