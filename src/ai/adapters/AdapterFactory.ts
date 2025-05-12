import { DataAdapterConfig } from './BlockchainDataAdapter';
import { TrendSpotterAdapter } from './TrendSpotterAdapter';
import { SmartContractAdapter } from './SmartContractAdapter';
import { NFTAdapter } from './NFTAdapter';
import { TokenAdapter } from './TokenAdapter';

export class AdapterFactory {
  private static instance: AdapterFactory;
  private adapters: Map<string, any>;

  private constructor() {
    this.adapters = new Map();
  }

  public static getInstance(): AdapterFactory {
    if (!AdapterFactory.instance) {
      AdapterFactory.instance = new AdapterFactory();
    }
    return AdapterFactory.instance;
  }

  public getTrendSpotterAdapter(config?: DataAdapterConfig): TrendSpotterAdapter {
    const adapterKey = 'trendspotter';
    let adapter = this.adapters.get(adapterKey) as TrendSpotterAdapter;

    if (!adapter) {
      adapter = new TrendSpotterAdapter(config);
      this.adapters.set(adapterKey, adapter);
    }

    return adapter;
  }

  public getSmartContractAdapter(config?: DataAdapterConfig): SmartContractAdapter {
    const adapterKey = 'smartcontract';
    let adapter = this.adapters.get(adapterKey) as SmartContractAdapter;

    if (!adapter) {
      adapter = new SmartContractAdapter(config);
      this.adapters.set(adapterKey, adapter);
    }

    return adapter;
  }

  public getNFTAdapter(config?: DataAdapterConfig): NFTAdapter {
    const adapterKey = 'nft';
    let adapter = this.adapters.get(adapterKey) as NFTAdapter;

    if (!adapter) {
      adapter = new NFTAdapter(config);
      this.adapters.set(adapterKey, adapter);
    }

    return adapter;
  }

  public getTokenAdapter(config?: DataAdapterConfig): TokenAdapter {
    const adapterKey = 'token';
    let adapter = this.adapters.get(adapterKey) as TokenAdapter;

    if (!adapter) {
      adapter = new TokenAdapter(config);
      this.adapters.set(adapterKey, adapter);
    }

    return adapter;
  }

  public async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.adapters.values()).map(adapter =>
      adapter.initialize().catch(error => {
        console.error('Error initializing adapter:', error);
      })
    );

    await Promise.all(initPromises);
  }

  public async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.adapters.values()).map(adapter =>
      adapter.shutdown().catch(error => {
        console.error('Error shutting down adapter:', error);
      })
    );

    await Promise.all(shutdownPromises);
    this.adapters.clear();
  }

  public async healthCheck(): Promise<{[key: string]: boolean}> {
    const healthStatus: {[key: string]: boolean} = {};
    
    for (const [key, adapter] of this.adapters.entries()) {
      try {
        healthStatus[key] = await adapter.isHealthy();
      } catch (error) {
        healthStatus[key] = false;
      }
    }

    return healthStatus;
  }
} 