import { BaseCache, CacheConfig } from '../../cache/BaseCache';

class TestCache extends BaseCache<string> {
  constructor(config: CacheConfig) {
    super(config);
  }
}

describe('BaseCache', () => {
  let cache: TestCache;
  const defaultConfig: CacheConfig = {
    ttl: 1000,
    maxSize: 3,
    cleanupInterval: 500
  };

  beforeEach(() => {
    cache = new TestCache(defaultConfig);
  });

  afterEach(() => {
    cache.dispose();
  });

  describe('get/set operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should respect TTL', async () => {
      cache.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, defaultConfig.ttl + 100));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should respect max size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict oldest entry

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('invalidation', () => {
    it('should invalidate specific keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.invalidate('key1');
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should automatically cleanup expired entries', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      await new Promise(resolve => setTimeout(resolve, defaultConfig.ttl + defaultConfig.cleanupInterval + 100));
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('configuration', () => {
    it('should use default maxSize if not provided', () => {
      const defaultSizeCache = new TestCache({ ttl: 1000 });
      
      // Add more than default size (1000) entries
      for (let i = 0; i < 1001; i++) {
        defaultSizeCache.set(`key${i}`, `value${i}`);
      }
      
      expect(defaultSizeCache.get('key0')).toBeUndefined();
      expect(defaultSizeCache.get('key1000')).toBe('value1000');
      
      defaultSizeCache.dispose();
    });

    it('should use default cleanupInterval if not provided', () => {
      const defaultIntervalCache = new TestCache({ ttl: 1000 });
      expect(defaultIntervalCache['config'].cleanupInterval).toBe(300000);
      defaultIntervalCache.dispose();
    });
  });
}); 