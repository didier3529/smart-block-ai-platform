import { Result } from 'typescript-result';
import { BaseError } from '@/types/common';

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  maxSize?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastCleanup?: Date;
}

export class CacheError extends Error implements BaseError {
  readonly type = 'cache-error';
  readonly timestamp: number;

  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CacheError';
    this.timestamp = Date.now();
  }
}

export interface ICache<T> {
  get(key: string): Promise<Result<T | null, CacheError>>;
  set(key: string, value: T, ttl?: number): Promise<Result<void, CacheError>>;
  delete(key: string): Promise<Result<void, CacheError>>;
  has(key: string): Promise<Result<boolean, CacheError>>;
  clear(): Promise<Result<void, CacheError>>;
  getStats(): CacheStats;
}

export abstract class BaseCache<T> implements ICache<T> {
  protected stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0
  };

  constructor(protected config: CacheConfig = {}) {
    this.config.ttl = config.ttl || 3600; // Default 1 hour
    this.config.namespace = config.namespace || 'default';
    this.config.maxSize = config.maxSize || 1000;
  }

  abstract get(key: string): Promise<Result<T | null, CacheError>>;
  abstract set(key: string, value: T, ttl?: number): Promise<Result<void, CacheError>>;
  abstract delete(key: string): Promise<Result<void, CacheError>>;
  abstract has(key: string): Promise<Result<boolean, CacheError>>;
  abstract clear(): Promise<Result<void, CacheError>>;

  getStats(): CacheStats {
    return { ...this.stats };
  }

  protected getNamespacedKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  protected updateStats(hit: boolean): void {
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
  }
} 