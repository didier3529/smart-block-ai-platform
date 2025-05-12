import { BaseCache, CacheConfig } from './BaseCache';
import { ContractEvent, ContractState, SecurityAnalysis } from '../SmartContractAdapter';

export interface SmartContractCacheConfig extends CacheConfig {
  eventTTL?: number; // Specific TTL for event data
  stateTTL?: number; // Specific TTL for contract state
  securityTTL?: number; // Specific TTL for security analysis
}

export class SmartContractCache extends BaseCache<ContractEvent | ContractState | SecurityAnalysis> {
  private eventConfig: CacheConfig;
  private stateConfig: CacheConfig;
  private securityConfig: CacheConfig;

  constructor(config: SmartContractCacheConfig) {
    super(config);
    
    this.eventConfig = {
      ...config,
      ttl: config.eventTTL || 300000 // 5 minutes default for events
    };

    this.stateConfig = {
      ...config,
      ttl: config.stateTTL || 60000 // 1 minute default for state
    };

    this.securityConfig = {
      ...config,
      ttl: config.securityTTL || 3600000 // 1 hour default for security analysis
    };
  }

  getEvent(contractAddress: string, eventName: string, blockNumber: number): ContractEvent | undefined {
    const key = `event:${contractAddress}:${eventName}:${blockNumber}`;
    return this.get(key) as ContractEvent | undefined;
  }

  setEvent(contractAddress: string, eventName: string, blockNumber: number, event: ContractEvent): void {
    const key = `event:${contractAddress}:${eventName}:${blockNumber}`;
    this.set(key, event);
  }

  getState(contractAddress: string): ContractState | undefined {
    const key = `state:${contractAddress}`;
    return this.get(key) as ContractState | undefined;
  }

  setState(contractAddress: string, state: ContractState): void {
    const key = `state:${contractAddress}`;
    this.set(key, state);
  }

  getSecurityAnalysis(contractAddress: string): SecurityAnalysis | undefined {
    const key = `security:${contractAddress}`;
    return this.get(key) as SecurityAnalysis | undefined;
  }

  setSecurityAnalysis(contractAddress: string, analysis: SecurityAnalysis): void {
    const key = `security:${contractAddress}`;
    this.set(key, analysis);
  }

  invalidateEvent(contractAddress: string, eventName: string, blockNumber: number): void {
    const key = `event:${contractAddress}:${eventName}:${blockNumber}`;
    this.invalidate(key);
  }

  invalidateState(contractAddress: string): void {
    const key = `state:${contractAddress}`;
    this.invalidate(key);
  }

  invalidateSecurityAnalysis(contractAddress: string): void {
    const key = `security:${contractAddress}`;
    this.invalidate(key);
  }

  protected cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      let ttl: number;
      
      if (key.startsWith('event:')) {
        ttl = this.eventConfig.ttl;
      } else if (key.startsWith('state:')) {
        ttl = this.stateConfig.ttl;
      } else {
        ttl = this.securityConfig.ttl;
      }
      
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }
} 