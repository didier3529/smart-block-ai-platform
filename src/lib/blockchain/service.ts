import { ethers } from 'ethers';
import {
  BlockchainService,
  BlockchainServiceConfig,
  ChainId,
  Address,
  TransactionData,
  BlockData,
  ChainConnection,
  BlockchainConfig,
  ChainHealth,
  ChainCapabilities
} from './types';
import { BlockchainCache } from './cache';
import { WebSocketManager } from './websocket';
import { ConnectionError, BlockchainError, ConfigurationError } from './errors';
import { withRetry } from './utils';
import { ChainHealthMonitor } from './health';
import { validateChainConfig, validateChainSupport, getChainCapabilities } from './chains';
import { BatchProcessor, ConnectionPool, PerformanceMetrics } from './performance';

export class EthereumBlockchainService implements BlockchainService {
  private config: BlockchainServiceConfig;
  private connectionPool: ConnectionPool;
  private connections: Map<ChainId, ChainConnection>;
  private wsManager: WebSocketManager;
  private healthMonitor: ChainHealthMonitor;
  private transactionCache: BlockchainCache<TransactionData>;
  private blockCache: BlockchainCache<BlockData>;
  private blockCallbacks: Map<ChainId, Set<(blockNumber: number) => void>>;
  private batchProcessor: BatchProcessor;
  private metrics: PerformanceMetrics;

  constructor(config: BlockchainServiceConfig) {
    this.config = config;
    this.connections = new Map();
    this.blockCallbacks = new Map();
    
    this.transactionCache = new BlockchainCache(config.cache);
    this.blockCache = new BlockchainCache(config.cache);
    this.wsManager = new WebSocketManager(config.wsReconnectInterval);
    this.healthMonitor = new ChainHealthMonitor(config);
    
    // Initialize performance optimizations
    this.connectionPool = new ConnectionPool(config.maxConnections || 5);
    this.batchProcessor = new BatchProcessor(config.batchSize || 100);
    this.metrics = new PerformanceMetrics();

    // Validate chain configurations
    config.chains.forEach(validateChainConfig);
  }

  async initialize(): Promise<void> {
    for (const chain of this.config.chains) {
      await this.connectToChain(chain);
    }
  }

  private async connectToChain(chain: BlockchainConfig): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      await provider.getNetwork(); // Test connection

      this.connections.set(chain.chainId, { isConnected: true });

      // Start health monitoring
      if (this.config.healthCheck?.enabled) {
        await this.healthMonitor.startMonitoring(chain.chainId, provider);
      }

      // Set up WebSocket connection if supported
      if (validateChainSupport(chain.chainId, 'hasWebSocket')) {
        const wsConnected = await this.wsManager.connect(chain);
        if (wsConnected) {
          this.wsManager.subscribeToBlocks(chain.chainId, async (blockNumber) => {
            await this.handleNewBlock(chain.chainId, blockNumber);
          });
        }
      }
    } catch (error) {
      console.error(`Failed to connect to chain ${chain.chainId}:`, error);
      this.connections.set(chain.chainId, { isConnected: false });
      throw new ConnectionError(chain.chainId, 'Failed to establish connection');
    }
  }

  private async handleNewBlock(chainId: ChainId, blockNumber: number): Promise<void> {
    const connection = this.connections.get(chainId);
    if (connection) {
      connection.lastBlock = blockNumber;
    }

    const callbacks = this.blockCallbacks.get(chainId);
    if (callbacks) {
      callbacks.forEach(callback => callback(blockNumber));
    }
  }

  private async getProvider(chainId: ChainId): Promise<ethers.JsonRpcProvider> {
    const chain = this.config.chains.find(c => c.chainId === chainId);
    if (!chain) {
      throw new ConfigurationError(`Configuration not found for chain ID ${chainId}`);
    }
    return this.connectionPool.getProvider(chainId, chain);
  }

  async connect(chainId: ChainId): Promise<boolean> {
    const chain = this.config.chains.find(c => c.chainId === chainId);
    if (!chain) {
      throw new ConfigurationError(`Configuration not found for chain ID ${chainId}`);
    }

    return this.connectToChain(chain).then(() => true).catch(() => false);
  }

  async disconnect(chainId: ChainId): Promise<void> {
    this.connections.delete(chainId);
    this.blockCallbacks.delete(chainId);
    
    if (validateChainSupport(chainId, 'hasWebSocket')) {
      await this.wsManager.disconnect(chainId);
    }

    this.healthMonitor.stopMonitoring(chainId);
  }

  async getTransaction(chainId: ChainId, txHash: string): Promise<TransactionData> {
    const startTime = this.metrics.startOperation('getTransaction');
    try {
      // Check cache first
      const cached = this.transactionCache.get(chainId, txHash);
      if (cached) {
        this.metrics.endOperation('getTransaction', startTime);
        return cached;
      }

      const provider = await this.getProvider(chainId);
      
      try {
        // Use batch processor for transaction and receipt
        const [tx, receipt] = await Promise.all([
          this.batchProcessor.addRequest(chainId, provider, 'eth_getTransactionByHash', [txHash]),
          this.batchProcessor.addRequest(chainId, provider, 'eth_getTransactionReceipt', [txHash])
        ]);

        if (!tx) {
          throw new BlockchainError(`Transaction ${txHash} not found`);
        }

        const txData: TransactionData = {
          hash: tx.hash,
          blockNumber: Number(tx.blockNumber),
          from: tx.from,
          to: tx.to ?? '',
          value: tx.value.toString(),
          gasPrice: tx.gasPrice?.toString() ?? '',
          maxFeePerGas: tx.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
          gasLimit: tx.gasLimit.toString(),
          gasUsed: receipt?.gasUsed?.toString(),
          nonce: Number(tx.nonce),
          data: tx.data,
          status: receipt?.status,
          timestamp: receipt ? (await this.batchProcessor.addRequest(
            chainId,
            provider,
            'eth_getBlockByNumber',
            [receipt.blockNumber, false]
          )).timestamp : undefined
        };

        this.transactionCache.set(chainId, txHash, txData);
        this.metrics.endOperation('getTransaction', startTime);
        return txData;
      } finally {
        this.connectionPool.releaseProvider(chainId, provider);
      }
    } catch (error) {
      this.metrics.endOperation('getTransaction', startTime, error);
      throw new BlockchainError(`Failed to fetch transaction: ${error.message}`);
    }
  }

  async getBlock(chainId: ChainId, blockNumber: number): Promise<BlockData> {
    const startTime = this.metrics.startOperation('getBlock');
    try {
      // Check cache first
      const cached = this.blockCache.get(chainId, blockNumber.toString());
      if (cached) {
        this.metrics.endOperation('getBlock', startTime);
        return cached;
      }

      const provider = await this.getProvider(chainId);
      
      try {
        const block = await this.batchProcessor.addRequest(
          chainId,
          provider,
          'eth_getBlockByNumber',
          [ethers.toBeHex(blockNumber), false]
        );

        if (!block) {
          throw new BlockchainError(`Block ${blockNumber} not found`);
        }

        const blockData: BlockData = {
          number: Number(block.number),
          hash: block.hash,
          parentHash: block.parentHash,
          timestamp: block.timestamp,
          nonce: block.nonce ?? '0x0',
          difficulty: block.difficulty?.toString() ?? '0',
          gasLimit: block.gasLimit.toString(),
          gasUsed: block.gasUsed.toString(),
          miner: block.miner,
          extraData: block.extraData,
          transactions: block.transactions as string[],
          baseFeePerGas: block.baseFeePerGas?.toString()
        };

        this.blockCache.set(chainId, blockNumber.toString(), blockData);
        this.metrics.endOperation('getBlock', startTime);
        return blockData;
      } finally {
        this.connectionPool.releaseProvider(chainId, provider);
      }
    } catch (error) {
      this.metrics.endOperation('getBlock', startTime, error);
      throw new BlockchainError(`Failed to fetch block: ${error.message}`);
    }
  }

  async getBalance(chainId: ChainId, address: Address): Promise<string> {
    const provider = await this.getProvider(chainId);
    
    try {
      const balance = await withRetry(() => provider.getBalance(address), {
        maxRetries: this.config.maxRetries
      });
      return balance.toString();
    } catch (error) {
      throw new BlockchainError(`Failed to fetch balance: ${error.message}`);
    }
  }

  subscribeToNewBlocks(chainId: ChainId, callback: (blockNumber: number) => void): void {
    if (!this.blockCallbacks.has(chainId)) {
      this.blockCallbacks.set(chainId, new Set());
    }
    this.blockCallbacks.get(chainId)!.add(callback);

    // Set up WebSocket subscription if supported
    if (validateChainSupport(chainId, 'hasWebSocket')) {
      this.wsManager.subscribeToBlocks(chainId, callback);
    }
  }

  unsubscribeFromBlocks(chainId: ChainId): void {
    this.blockCallbacks.delete(chainId);
    if (validateChainSupport(chainId, 'hasWebSocket')) {
      this.wsManager.unsubscribeFromBlocks(chainId);
    }
  }

  async getChainHealth(chainId: ChainId): Promise<ChainHealth> {
    const health = this.healthMonitor.getHealth(chainId);
    if (!health) {
      throw new BlockchainError(`Health data not available for chain ${chainId}`);
    }
    return health;
  }

  isConnected(chainId: ChainId): boolean {
    return this.connections.get(chainId)?.isConnected ?? false;
  }

  getSupportedChains(): BlockchainConfig[] {
    return [...this.config.chains];
  }

  validateChainSupport(chainId: ChainId, feature: keyof ChainCapabilities): boolean {
    return validateChainSupport(chainId, feature);
  }

  getPerformanceMetrics(): Map<string, {
    count: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
    errorRate: number;
  }> {
    return this.metrics.getMetrics();
  }

  cleanup(chainId: ChainId): void {
    this.batchProcessor.clear(chainId);
    this.connectionPool.clear(chainId);
    this.metrics.clear();
  }
} 