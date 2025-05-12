import { Result } from 'typescript-result';
import { BaseCache, CacheConfig, CacheError } from './BaseCache';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class MemoryCache<T> extends BaseCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private cleanupInterval: NodeJS.Timeout;
  private readonly DEFAULT_CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly MAX_IDLE_TIME = 3600000; // 1 hour

  constructor(config: CacheConfig = {}) {
    super(config);
    this.cache = new Map();
    this.stats.lastCleanup = new Date();
    
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.DEFAULT_CLEANUP_INTERVAL);
  }

  async get(key: string): Promise<Result<T | null, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const entry = this.cache.get(namespacedKey);

      if (!entry) {
        this.updateStats(false);
        return Result.ok(null);
      }

      const now = Date.now();
      if (entry.expiresAt < now) {
        this.cache.delete(namespacedKey);
        this.updateStats(false);
        this.stats.size = this.cache.size;
        return Result.ok(null);
      }

      // Update last accessed time
      entry.lastAccessed = now;
      this.cache.set(namespacedKey, entry);
      this.updateStats(true);
      return Result.ok(entry.value);
    } catch (error) {
      return Result.error(
        new CacheError(
          'GET_ERROR',
          'Failed to get value from cache',
          { key, error }
        )
      );
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<Result<void, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const now = Date.now();
      const expiresAt = now + ((ttl || this.config.ttl) * 1000);

      // Check max size before adding
      if (!this.cache.has(namespacedKey) && this.cache.size >= (this.config.maxSize || 1000)) {
        // Try to clean up idle entries first
        this.cleanupIdle();
        
        // If still at max size, return error
        if (this.cache.size >= (this.config.maxSize || 1000)) {
          return Result.error(
            new CacheError(
              'MAX_SIZE_EXCEEDED',
              'Cache has reached maximum size',
              { maxSize: this.config.maxSize }
            )
          );
        }
      }

      this.cache.set(namespacedKey, { 
        value, 
        expiresAt,
        lastAccessed: now
      });
      this.stats.size = this.cache.size;
      return Result.ok(void 0);
    } catch (error) {
      return Result.error(
        new CacheError(
          'SET_ERROR',
          'Failed to set value in cache',
          { key, error }
        )
      );
    }
  }

  async delete(key: string): Promise<Result<void, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      this.cache.delete(namespacedKey);
      this.stats.size = this.cache.size;
      return Result.ok(void 0);
    } catch (error) {
      return Result.error(
        new CacheError(
          'DELETE_ERROR',
          'Failed to delete value from cache',
          { key, error }
        )
      );
    }
  }

  async has(key: string): Promise<Result<boolean, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const entry = this.cache.get(namespacedKey);

      if (!entry) {
        return Result.ok(false);
      }

      if (entry.expiresAt < Date.now()) {
        this.cache.delete(namespacedKey);
        this.stats.size = this.cache.size;
        return Result.ok(false);
      }

      return Result.ok(true);
    } catch (error) {
      return Result.error(
        new CacheError(
          'HAS_ERROR',
          'Failed to check key existence in cache',
          { key, error }
        )
      );
    }
  }

  async clear(): Promise<Result<void, CacheError>> {
    try {
      this.cache.clear();
      this.stats.size = 0;
      this.stats.lastCleanup = new Date();
      return Result.ok(void 0);
    } catch (error) {
      return Result.error(
        new CacheError(
          'CLEAR_ERROR',
          'Failed to clear cache',
          { error }
        )
      );
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
    this.stats.lastCleanup = new Date();
  }

  private cleanupIdle(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > this.MAX_IDLE_TIME) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  dispose(): void {
    clearInterval(this.cleanupInterval);
  }
} 