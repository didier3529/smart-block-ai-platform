import { CacheConfig } from './types';

interface CacheOptions {
  ttl: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class BlockchainCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached value if still valid
    if (cached && now - cached.timestamp < options.ttl) {
      return cached.value;
    }

    // Implement retry logic
    let lastError: Error | null = null;
    const maxRetries = options.maxRetries || 1;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const value = await fetchFn();
        this.cache.set(key, { value, timestamp: now });
        return value;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError || new Error('Failed to fetch after retries');
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export const blockchainCache = new BlockchainCache();

export class BlockchainCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  private generateKey(chainId: number, key: string): string {
    return `${chainId}:${key}`;
  }

  set(chainId: number, key: string, value: T): void {
    const cacheKey = this.generateKey(chainId, key);
    
    // Implement LRU-like behavior by removing oldest entries if we exceed maxSize
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });
  }

  get(chainId: number, key: string): T | null {
    const cacheKey = this.generateKey(chainId, key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }

  remove(chainId: number, key: string): void {
    const cacheKey = this.generateKey(chainId, key);
    this.cache.delete(cacheKey);
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
} 