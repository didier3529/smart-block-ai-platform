import Redis from 'ioredis';
import { Result } from 'typescript-result';
import { BaseCache, CacheConfig, CacheError } from './BaseCache';

export interface RedisCacheConfig extends CacheConfig {
  redisUrl?: string;
  redisOptions?: Redis.RedisOptions;
  enableAutoPipelining?: boolean;
  maxRetriesPerRequest?: number;
}

export class RedisCache<T> extends BaseCache<T> {
  private redis: Redis;
  private readonly DEFAULT_REDIS_URL = 'redis://localhost:6379';
  private readonly DEFAULT_MAX_RETRIES = 3;

  constructor(config: RedisCacheConfig = {}) {
    super(config);
    
    const redisOptions: Redis.RedisOptions = {
      enableAutoPipelining: config.enableAutoPipelining ?? true,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? this.DEFAULT_MAX_RETRIES,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      ...config.redisOptions
    };

    this.redis = new Redis(
      config.redisUrl || this.DEFAULT_REDIS_URL,
      redisOptions
    );

    // Handle Redis errors
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    // Update stats on connection events
    this.redis.on('connect', () => {
      console.log('Redis connected');
    });

    this.redis.on('ready', () => {
      console.log('Redis ready');
    });
  }

  async get(key: string): Promise<Result<T | null, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const value = await this.redis.get(namespacedKey);

      if (!value) {
        this.updateStats(false);
        return Result.ok(null);
      }

      this.updateStats(true);
      return Result.ok(JSON.parse(value));
    } catch (error) {
      return Result.error(
        new CacheError(
          'GET_ERROR',
          'Failed to get value from Redis cache',
          { key, error }
        )
      );
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<Result<void, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const serializedValue = JSON.stringify(value);
      
      if (ttl || this.config.ttl) {
        await this.redis.set(
          namespacedKey,
          serializedValue,
          'EX',
          ttl || this.config.ttl
        );
      } else {
        await this.redis.set(namespacedKey, serializedValue);
      }

      return Result.ok(void 0);
    } catch (error) {
      return Result.error(
        new CacheError(
          'SET_ERROR',
          'Failed to set value in Redis cache',
          { key, error }
        )
      );
    }
  }

  async delete(key: string): Promise<Result<void, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      await this.redis.del(namespacedKey);
      return Result.ok(void 0);
    } catch (error) {
      return Result.error(
        new CacheError(
          'DELETE_ERROR',
          'Failed to delete value from Redis cache',
          { key, error }
        )
      );
    }
  }

  async has(key: string): Promise<Result<boolean, CacheError>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const exists = await this.redis.exists(namespacedKey);
      return Result.ok(exists === 1);
    } catch (error) {
      return Result.error(
        new CacheError(
          'HAS_ERROR',
          'Failed to check key existence in Redis cache',
          { key, error }
        )
      );
    }
  }

  async clear(): Promise<Result<void, CacheError>> {
    try {
      // Only clear keys in our namespace
      const pattern = this.getNamespacedKey('*');
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100
      });

      for await (const keys of stream) {
        if (keys.length) {
          await this.redis.del(...keys);
        }
      }

      this.stats.lastCleanup = new Date();
      return Result.ok(void 0);
    } catch (error) {
      return Result.error(
        new CacheError(
          'CLEAR_ERROR',
          'Failed to clear Redis cache',
          { error }
        )
      );
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const pattern = this.getNamespacedKey('*');
      const keys = await this.redis.keys(pattern);
      this.stats.size = keys.length;
      return this.stats;
    } catch (error) {
      console.error('Failed to get Redis stats:', error);
      return this.stats;
    }
  }

  dispose(): void {
    this.redis.disconnect();
  }
} 