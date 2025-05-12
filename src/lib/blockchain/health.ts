import { ethers } from 'ethers';
import { ChainHealth, BlockchainServiceConfig, ChainId } from './types';
import { getChainConfig } from './chains';

export class ChainHealthMonitor {
  private healthData: Map<ChainId, ChainHealth>;
  private config: BlockchainServiceConfig;
  private monitoringIntervals: Map<ChainId, NodeJS.Timeout>;

  constructor(config: BlockchainServiceConfig) {
    this.healthData = new Map();
    this.config = config;
    this.monitoringIntervals = new Map();
  }

  async startMonitoring(chainId: ChainId, provider: ethers.JsonRpcProvider): Promise<void> {
    if (!this.config.healthCheck?.enabled) return;

    // Clear existing interval if any
    this.stopMonitoring(chainId);

    // Initialize health data
    this.healthData.set(chainId, {
      status: 'healthy',
      latency: 0,
      lastBlock: 0,
      lastBlockTime: 0,
      peerCount: 0,
      syncStatus: {
        isSyncing: false,
        currentBlock: 0,
        highestBlock: 0
      },
      errors: {
        count: 0,
        lastError: undefined,
        lastErrorTime: undefined
      }
    });

    // Start periodic health checks
    const interval = setInterval(async () => {
      try {
        await this.checkHealth(chainId, provider);
      } catch (error) {
        console.error(`Health check failed for chain ${chainId}:`, error);
        this.recordError(chainId, error as Error);
      }
    }, this.config.healthCheck.interval);

    this.monitoringIntervals.set(chainId, interval);
  }

  stopMonitoring(chainId: ChainId): void {
    const interval = this.monitoringIntervals.get(chainId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(chainId);
    }
  }

  private async checkHealth(chainId: ChainId, provider: ethers.JsonRpcProvider): Promise<void> {
    const health = this.healthData.get(chainId)!;
    const startTime = Date.now();

    try {
      // Check network connectivity and latency
      const network = await provider.getNetwork();
      health.latency = Date.now() - startTime;

      // Get current block
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      
      if (block) {
        health.lastBlock = blockNumber;
        health.lastBlockTime = block.timestamp;
      }

      // Get peer count
      const peerCount = await this.getPeerCount(provider);
      health.peerCount = peerCount;

      // Check sync status
      const syncStatus = await this.getSyncStatus(provider);
      health.syncStatus = syncStatus;

      // Update status based on checks
      health.status = this.determineStatus(health);

      // Reset error count if successful
      if (health.errors.count > 0) {
        health.errors.count = 0;
      }
    } catch (error) {
      this.recordError(chainId, error as Error);
    }

    this.healthData.set(chainId, health);
  }

  private async getPeerCount(provider: ethers.JsonRpcProvider): Promise<number> {
    try {
      const peerCount = await provider.send('net_peerCount', []);
      return parseInt(peerCount, 16);
    } catch {
      return 0;
    }
  }

  private async getSyncStatus(provider: ethers.JsonRpcProvider): Promise<ChainHealth['syncStatus']> {
    try {
      const sync = await provider.send('eth_syncing', []);
      if (sync === false) {
        const currentBlock = await provider.getBlockNumber();
        return {
          isSyncing: false,
          currentBlock,
          highestBlock: currentBlock
        };
      }

      return {
        isSyncing: true,
        currentBlock: parseInt(sync.currentBlock, 16),
        highestBlock: parseInt(sync.highestBlock, 16)
      };
    } catch {
      return {
        isSyncing: false,
        currentBlock: 0,
        highestBlock: 0
      };
    }
  }

  private determineStatus(health: ChainHealth): ChainHealth['status'] {
    const { timeoutThreshold, errorThreshold } = this.config.healthCheck || {
      timeoutThreshold: 5000,
      errorThreshold: 3
    };

    if (health.errors.count >= errorThreshold) {
      return 'down';
    }

    if (
      health.latency > timeoutThreshold ||
      health.peerCount === 0 ||
      (Date.now() / 1000 - health.lastBlockTime > 600) // No new blocks for 10 minutes
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  private recordError(chainId: ChainId, error: Error): void {
    const health = this.healthData.get(chainId)!;
    
    health.errors = {
      count: health.errors.count + 1,
      lastError: error.message,
      lastErrorTime: Date.now()
    };

    health.status = this.determineStatus(health);
    this.healthData.set(chainId, health);
  }

  getHealth(chainId: ChainId): ChainHealth | undefined {
    return this.healthData.get(chainId);
  }

  getAllHealth(): Map<ChainId, ChainHealth> {
    return new Map(this.healthData);
  }
} 