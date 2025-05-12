import { BaseDataSource, DataSourceConfig } from './BaseDataSource';
import { ContractDataSource, ContractDataConfig } from './ContractDataSource';
import { MarketDataSource, MarketDataConfig } from './MarketDataSource';
import { ethers } from 'ethers';

export interface TokenDataConfig extends DataSourceConfig {
  contractDataConfig: ContractDataConfig;
  marketDataConfig: MarketDataConfig;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface TokenBalance {
  address: string;
  balance: string;
  percentage: number;
}

export interface TokenDistribution {
  topHolders: TokenBalance[];
  totalHolders: number;
  circulatingSupply: string;
}

export class TokenDataSource extends BaseDataSource {
  private contractDataSource: ContractDataSource;
  private marketDataSource: MarketDataSource;
  private readonly config: TokenDataConfig;

  constructor(config: TokenDataConfig) {
    super(config);
    this.config = config;
    this.contractDataSource = new ContractDataSource(config.contractDataConfig);
    this.marketDataSource = new MarketDataSource(config.marketDataConfig);
    this.validateConfig();
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.contractDataSource.connect(),
      this.marketDataSource.connect()
    ]);

    this.isConnected = true;
    this.emit('connected');

    // Forward relevant events
    this.contractDataSource.on('contractEvent', (event) => {
      this.emit('contractEvent', event);
    });

    this.marketDataSource.on('price', (update) => {
      this.emit('price', update);
    });

    // Forward errors
    this.contractDataSource.on('error', (error) => {
      this.handleError(error.error, `Contract data source: ${error.context}`);
    });

    this.marketDataSource.on('error', (error) => {
      this.handleError(error.error, `Market data source: ${error.context}`);
    });
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.contractDataSource.disconnect(),
      this.marketDataSource.disconnect()
    ]);
    this.isConnected = false;
  }

  async isHealthy(): Promise<boolean> {
    const [contractHealth, marketHealth] = await Promise.all([
      this.contractDataSource.isHealthy(),
      this.marketDataSource.isHealthy()
    ]);
    return contractHealth && marketHealth;
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    const contract = new ethers.Contract(
      tokenAddress,
      [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ],
      this.contractDataSource['provider']
    );

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply: totalSupply.toString()
    };
  }

  async getTokenDistribution(
    tokenAddress: string,
    limit: number = 100
  ): Promise<TokenDistribution> {
    const contract = new ethers.Contract(
      tokenAddress,
      [
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)'
      ],
      this.contractDataSource['provider']
    );

    // Get transfer events to identify holders
    const events = await this.contractDataSource.getLogs({
      address: tokenAddress,
      topics: [ethers.utils.id('Transfer(address,address,uint256)')]
    });

    // Process events to get unique holders
    const holders = new Set<string>();
    for (const event of events) {
      const [from, to] = event.topics.slice(1).map(topic =>
        ethers.utils.getAddress(ethers.utils.hexDataSlice(topic, 12))
      );
      if (to !== ethers.constants.AddressZero) holders.add(to);
      if (from !== ethers.constants.AddressZero) holders.add(from);
    }

    // Get total supply
    const totalSupply = await contract.totalSupply();

    // Get balances for all holders
    const balances: TokenBalance[] = await Promise.all(
      Array.from(holders).map(async (address) => {
        const balance = await contract.balanceOf(address);
        return {
          address,
          balance: balance.toString(),
          percentage: (balance.mul(10000).div(totalSupply).toNumber() / 100)
        };
      })
    );

    // Sort by balance descending and take top holders
    const topHolders = balances
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
      .slice(0, limit);

    // Calculate circulating supply (excluding burned tokens)
    const burnAddresses = [
      ethers.constants.AddressZero,
      '0x000000000000000000000000000000000000dEaD'
    ];
    const burnedTokens = await Promise.all(
      burnAddresses.map(address => contract.balanceOf(address))
    );
    const totalBurned = burnedTokens.reduce((a, b) => a.add(b));
    const circulatingSupply = totalSupply.sub(totalBurned);

    return {
      topHolders,
      totalHolders: holders.size,
      circulatingSupply: circulatingSupply.toString()
    };
  }

  async subscribeToMarketData(symbol: string): Promise<void> {
    await this.marketDataSource.subscribeToSymbol(symbol);
  }

  async unsubscribeFromMarketData(symbol: string): Promise<void> {
    await this.marketDataSource.unsubscribeFromSymbol(symbol);
  }

  async subscribeToTransfers(tokenAddress: string): Promise<void> {
    await this.contractDataSource.subscribeToEvents({
      address: tokenAddress,
      topics: [ethers.utils.id('Transfer(address,address,uint256)')]
    });
  }

  async unsubscribeFromTransfers(tokenAddress: string): Promise<void> {
    await this.contractDataSource.unsubscribeFromEvents({
      address: tokenAddress,
      topics: [ethers.utils.id('Transfer(address,address,uint256)')]
    });
  }

  protected validateConfig(): void {
    super.validateConfig();
    if (!this.config.contractDataConfig?.rpcUrl) {
      throw new Error('RPC URL is required in contractDataConfig');
    }
    if (!this.config.marketDataConfig?.wsUrl || !this.config.marketDataConfig?.apiUrl) {
      throw new Error('WebSocket and API URLs are required in marketDataConfig');
    }
  }
} 