import { BaseDataSource, DataSourceConfig } from './BaseDataSource';
import { ethers } from 'ethers';

export interface ContractDataConfig extends DataSourceConfig {
  rpcUrl: string;
  networkId?: number;
  maxBlockRange?: number;
  providerConfig?: any;
}

export interface ContractEventFilter {
  address: string;
  topics: string[];
  fromBlock?: number;
  toBlock?: number;
}

export interface ContractCallParams {
  address: string;
  abi: ethers.ContractInterface;
  method: string;
  params: any[];
}

export class ContractDataSource extends BaseDataSource {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private eventSubscriptions: Map<string, ethers.providers.Listener> = new Map();
  private readonly config: ContractDataConfig;

  constructor(config: ContractDataConfig) {
    super(config);
    this.config = {
      maxBlockRange: 1000,
      ...config
    };
    this.validateConfig();
  }

  async connect(): Promise<void> {
    if (this.provider) {
      return;
    }

    try {
      this.provider = new ethers.providers.JsonRpcProvider(
        this.config.rpcUrl,
        this.config.networkId
      );

      await this.provider.ready;
      this.isConnected = true;
      this.emit('connected');

      // Set up provider event handlers
      this.provider.on('block', (blockNumber: number) => {
        this.emit('block', blockNumber);
      });

      this.provider.on('error', (error: Error) => {
        this.handleError(error, 'Provider error');
        this.scheduleReconnect();
      });

    } catch (error) {
      this.handleError(error as Error, 'Provider connection');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.removeAllListeners();
      this.provider = null;
    }

    this.eventSubscriptions.clear();
    this.isConnected = false;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    try {
      await this.provider.getNetwork();
      return true;
    } catch {
      return false;
    }
  }

  async subscribeToEvents(filter: ContractEventFilter): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    const key = this.getFilterKey(filter);
    if (this.eventSubscriptions.has(key)) {
      return;
    }

    const listener = (log: ethers.providers.Log) => {
      this.emit('contractEvent', {
        address: log.address,
        topics: log.topics,
        data: log.data,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.logIndex
      });
    };

    await this.executeWithRetry(async () => {
      this.provider!.on(filter, listener);
    });

    this.eventSubscriptions.set(key, listener);
  }

  async unsubscribeFromEvents(filter: ContractEventFilter): Promise<void> {
    if (!this.provider) {
      return;
    }

    const key = this.getFilterKey(filter);
    const listener = this.eventSubscriptions.get(key);
    if (listener) {
      this.provider.off(filter, listener);
      this.eventSubscriptions.delete(key);
    }
  }

  async getContractState(params: ContractCallParams): Promise<any> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    return this.executeWithRetry(async () => {
      const contract = new ethers.Contract(
        params.address,
        params.abi,
        this.provider!
      );

      return contract[params.method](...params.params);
    });
  }

  async getLogs(filter: ContractEventFilter): Promise<ethers.providers.Log[]> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    return this.executeWithRetry(async () => {
      const logs = await this.provider!.getLogs(filter);
      return logs;
    });
  }

  private getFilterKey(filter: ContractEventFilter): string {
    return `${filter.address}:${filter.topics.join(':')}`;
  }

  private scheduleReconnect(): void {
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.handleError(error as Error, 'Reconnection attempt');
        this.scheduleReconnect();
      }
    }, this.config.retryDelay);
  }

  protected validateConfig(): void {
    super.validateConfig();
    if (!this.config.rpcUrl) {
      throw new Error('RPC URL is required for ContractDataSource');
    }
  }
} 