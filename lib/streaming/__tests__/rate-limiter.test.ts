import { RateLimiter } from '../rate-limiter';
import { PerformanceMonitor } from '../../performance/monitor';

jest.mock('../../performance/monitor');

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let performanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance() as jest.Mocked<PerformanceMonitor>;
    rateLimiter = new RateLimiter({
      defaultLimit: 10,
      defaultWindow: 1000,
      bucketCapacity: 10,
      refillInterval: 100,
      overflowStrategy: 'delay',
      maxDelay: 1000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    rateLimiter.cleanup();
  });

  describe('token bucket behavior', () => {
    it('should allow requests within rate limit', async () => {
      const results = await Promise.all(
        Array(5).fill(null).map(() => rateLimiter.acquire('test'))
      );

      expect(results.every(result => result === true)).toBe(true);
      const metrics = rateLimiter.getMetrics();
      expect(metrics.totalRequests).toBe(5);
      expect(metrics.limitedRequests).toBe(0);
    });

    it('should limit requests exceeding rate limit', async () => {
      const results = await Promise.all(
        Array(15).fill(null).map(() => rateLimiter.acquire('test'))
      );

      const successCount = results.filter(result => result === true).length;
      const failureCount = results.filter(result => result === false).length;

      expect(successCount).toBe(10); // Initial bucket capacity
      expect(failureCount).toBe(5);
    });

    it('should refill tokens over time', async () => {
      jest.useFakeTimers();

      // Use up all tokens
      await Promise.all(
        Array(10).fill(null).map(() => rateLimiter.acquire('test'))
      );

      // Advance time to allow token refill
      jest.advanceTimersByTime(1000);

      // Should be able to acquire more tokens
      const result = await rateLimiter.acquire('test');
      expect(result).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('overflow strategies', () => {
    it('should drop requests when using drop strategy', async () => {
      const dropLimiter = new RateLimiter({
        defaultLimit: 5,
        overflowStrategy: 'drop'
      });

      const results = await Promise.all(
        Array(10).fill(null).map(() => dropLimiter.acquire('test'))
      );

      const successCount = results.filter(result => result === true).length;
      const failureCount = results.filter(result => result === false).length;

      expect(successCount).toBe(5);
      expect(failureCount).toBe(5);

      dropLimiter.cleanup();
    });

    it('should delay requests when using delay strategy', async () => {
      jest.useFakeTimers();

      const delayLimiter = new RateLimiter({
        defaultLimit: 5,
        overflowStrategy: 'delay',
        maxDelay: 2000
      });

      // Start multiple requests
      const promises = Array(7).fill(null).map(() => delayLimiter.acquire('test'));

      // First 5 should complete immediately
      const immediate = await Promise.race([
        Promise.all(promises.slice(0, 5)),
        new Promise(resolve => setTimeout(resolve, 100, 'timeout'))
      ]);

      expect(immediate).not.toBe('timeout');

      // Advance time to allow delayed requests
      jest.advanceTimersByTime(1000);

      // Remaining requests should complete
      const results = await Promise.all(promises);
      expect(results.every(result => result === true)).toBe(true);

      const metrics = delayLimiter.getMetrics();
      expect(metrics.delayedRequests).toBeGreaterThan(0);

      jest.useRealTimers();
      delayLimiter.cleanup();
    });

    it('should throw error when using error strategy', async () => {
      const errorLimiter = new RateLimiter({
        defaultLimit: 5,
        overflowStrategy: 'error'
      });

      // Use up all tokens
      await Promise.all(
        Array(5).fill(null).map(() => errorLimiter.acquire('test'))
      );

      // Next request should throw
      await expect(errorLimiter.acquire('test'))
        .rejects
        .toThrow('Rate limit exceeded');

      errorLimiter.cleanup();
    });
  });

  describe('multiple buckets', () => {
    it('should handle multiple keys independently', async () => {
      const results1 = await Promise.all(
        Array(8).fill(null).map(() => rateLimiter.acquire('test1'))
      );
      const results2 = await Promise.all(
        Array(8).fill(null).map(() => rateLimiter.acquire('test2'))
      );

      expect(results1.filter(r => r === true).length).toBe(8);
      expect(results2.filter(r => r === true).length).toBe(8);
    });

    it('should clean up unused buckets', async () => {
      jest.useFakeTimers();

      await rateLimiter.acquire('test1');
      await rateLimiter.acquire('test2');

      // Advance time to trigger cleanup
      jest.advanceTimersByTime(2000);

      // Internal buckets map should be empty
      expect((rateLimiter as any).buckets.size).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('metrics tracking', () => {
    it('should track request metrics accurately', async () => {
      // Make some successful requests
      await Promise.all(
        Array(5).fill(null).map(() => rateLimiter.acquire('test'))
      );

      // Make some requests that will be limited
      await Promise.all(
        Array(8).fill(null).map(() => rateLimiter.acquire('test'))
      );

      const metrics = rateLimiter.getMetrics();
      expect(metrics.totalRequests).toBe(13);
      expect(metrics.limitedRequests).toBeGreaterThan(0);
      expect(metrics.currentLoad).toBeGreaterThan(0);
    });

    it('should calculate average delay correctly', async () => {
      jest.useFakeTimers();

      // Use up initial tokens
      await Promise.all(
        Array(10).fill(null).map(() => rateLimiter.acquire('test'))
      );

      // Make a request that will be delayed
      const promise = rateLimiter.acquire('test');
      jest.advanceTimersByTime(500);
      await promise;

      const metrics = rateLimiter.getMetrics();
      expect(metrics.averageDelay).toBeGreaterThan(0);

      jest.useRealTimers();
    });
  });

  describe('performance monitoring', () => {
    it('should track acquire operation performance', async () => {
      const startTime = Date.now();
      performanceMonitor.startOperation.mockReturnValue(startTime);

      await rateLimiter.acquire('test');

      expect(performanceMonitor.startOperation).toHaveBeenCalledWith('rateLimiter.acquire');
      expect(performanceMonitor.endOperation).toHaveBeenCalledWith('rateLimiter.acquire', startTime);
    });

    it('should track refill operation performance', async () => {
      jest.useFakeTimers();

      const startTime = Date.now();
      performanceMonitor.startOperation.mockReturnValue(startTime);

      // Trigger refill
      jest.advanceTimersByTime(100);

      expect(performanceMonitor.startOperation).toHaveBeenCalledWith('rateLimiter.refill');
      expect(performanceMonitor.endOperation).toHaveBeenCalledWith('rateLimiter.refill', startTime);

      jest.useRealTimers();
    });
  });
}); 