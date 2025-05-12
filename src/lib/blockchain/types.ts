export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl?: string;
}

export interface ChainCapabilities {
  hasWebSocket: boolean;
  supportsEIP1559: boolean;
  hasArchivalNodes: boolean;
  supportsENS: boolean;
  maxBlockRange: number;
}

export interface ChainHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastBlock: number;
  lastBlockTime: number;
  peerCount: number;
  syncStatus: {
    isSyncing: boolean;
    currentBlock: number;
    highestBlock: number;
  };
  errors: {
    count: number;
    lastError?: string;
    lastErrorTime?: number;
  };
}

export interface TransactionData {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit: string;
  gasUsed?: string;
  nonce: number;
  data: string;
  status?: boolean;
  timestamp?: number;
}

export interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  nonce: string;
  difficulty: string;
  gasLimit: string;
  gasUsed: string;
  miner: string;
  extraData: string;
  transactions: string[];
  baseFeePerGas?: string;
}

export interface ChainConnection {
  isConnected: boolean;
  lastBlock?: number;
  wsConnection?: WebSocket;
  health?: ChainHealth;
}

export interface CacheConfig {
  maxAge: number;
  maxSize: number;
}

export interface BlockchainServiceConfig {
  chains: BlockchainConfig[];
  maxRetries?: number;
  cache?: {
    maxSize?: number;
    ttl?: number;
  };
  wsReconnectInterval?: number;
  healthCheck?: {
    enabled: boolean;
    interval?: number;
    timeout?: number;
  };
  // Performance optimization settings
  maxConnections?: number;  // Maximum number of concurrent RPC connections per chain
  batchSize?: number;       // Maximum number of requests to batch together
  batchInterval?: number;   // Maximum time to wait before processing a batch (ms)
}

export type ChainId = number;
export type Address = string;

export interface BlockchainService {
  initialize(): Promise<void>;
  connect(chainId: ChainId): Promise<boolean>;
  disconnect(chainId: ChainId): Promise<void>;
  getTransaction(chainId: ChainId, txHash: string): Promise<TransactionData>;
  getBlock(chainId: ChainId, blockNumber: number): Promise<BlockData>;
  subscribeToNewBlocks(chainId: ChainId, callback: (blockNumber: number) => void): void;
  unsubscribeFromBlocks(chainId: ChainId): void;
  getBalance(chainId: ChainId, address: Address): Promise<string>;
  getChainHealth(chainId: ChainId): Promise<ChainHealth>;
  isConnected(chainId: ChainId): boolean;
  getSupportedChains(): BlockchainConfig[];
  validateChainSupport(chainId: ChainId, feature: keyof ChainCapabilities): boolean;
} 