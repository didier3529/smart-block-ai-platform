import { BlockchainService } from '@/lib/blockchain';
import { WebSocketManager } from '@/lib/blockchain/websocket';
import { BlockchainDataAdapter } from './BlockchainDataAdapter';
import { TrendSpotterAdapter } from './TrendSpotterAdapter';
import { SmartContractAdapter } from './SmartContractAdapter';
import { NFTAdapter } from './NFTAdapter';
import { TokenAdapter } from './TokenAdapter';

// Re-export all adapters and their types
export * from './BlockchainDataAdapter';
export * from './TrendSpotterAdapter';
export * from './SmartContractAdapter';
export * from './NFTAdapter';
export * from './TokenAdapter';
export * from './datasources';
export * from './cache';

// Factory class for creating adapters
export class BlockchainAdapterFactory {
  private readonly service: BlockchainService;
  private readonly wsManager: WebSocketManager;
  private readonly adapters: Map<string, BlockchainDataAdapter>;

  constructor(service: BlockchainService, wsManager: WebSocketManager) {
    this.service = service;
    this.wsManager = wsManager;
    this.adapters = new Map();
  }

  // Get or create a TrendSpotter adapter instance
  getTrendSpotterAdapter(cache?: any): TrendSpotterAdapter {
    const key = 'trendSpotter';
    let adapter = this.adapters.get(key) as TrendSpotterAdapter;

    if (!adapter) {
      adapter = new TrendSpotterAdapter(this.service, this.wsManager, cache);
      this.adapters.set(key, adapter);
    }

    return adapter;
  }

  // Get or create a SmartContract adapter instance
  getSmartContractAdapter(cache?: any): SmartContractAdapter {
    const key = 'smartContract';
    let adapter = this.adapters.get(key) as SmartContractAdapter;

    if (!adapter) {
      adapter = new SmartContractAdapter(this.service, this.wsManager, cache);
      this.adapters.set(key, adapter);
    }

    return adapter;
  }

  // Get or create an NFT adapter instance
  getNFTAdapter(cache?: any): NFTAdapter {
    const key = 'nft';
    let adapter = this.adapters.get(key) as NFTAdapter;

    if (!adapter) {
      adapter = new NFTAdapter(this.service, this.wsManager, cache);
      this.adapters.set(key, adapter);
    }

    return adapter;
  }

  // Get or create a Token adapter instance
  getTokenAdapter(cache?: any): TokenAdapter {
    const key = 'token';
    let adapter = this.adapters.get(key) as TokenAdapter;

    if (!adapter) {
      adapter = new TokenAdapter(this.service, this.wsManager, cache);
      this.adapters.set(key, adapter);
    }

    return adapter;
  }

  // Clean up all adapters
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.adapters.values()).map(adapter => adapter.cleanup());
    await Promise.all(cleanupPromises);
    this.adapters.clear();
  }
}

