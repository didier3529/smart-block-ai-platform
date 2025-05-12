import { DataAdapterCache } from '../BlockchainDataAdapter';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  key: string;
}

export abstract class BaseCache<T> implements DataAdapterCache<T> {
  protected cache: Map<string, CacheEntry<T>>;
  protected config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = {
      ttl: config.ttl,
      maxSize: config.maxSize || 1000,
      cleanupInterval: config.cleanupInterval || 300000 // 5 minutes default
    };

    this.startCleanupTimer();
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Enforce max size limit
    if (this.cache.size >= this.config.maxSize!) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      key
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  protected cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
} 