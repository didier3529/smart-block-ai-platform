import { ErrorHandler } from '../error-handler';
import { PerformanceMonitor } from '../../performance/monitor';

jest.mock('../../performance/monitor');

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let performanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance() as jest.Mocked<PerformanceMonitor>;
    errorHandler = new ErrorHandler({
      maxRetries: 2,
      retryDelay: 100,
      errorThreshold: 3,
      recoveryWindow: 1000,
      circuitBreakerTimeout: 500
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    errorHandler.cleanup();
  });

  describe('error handling', () => {
    it('should handle low severity errors without retries', async () => {
      const error = new Error('Test error');
      const errorPromise = new Promise(resolve => {
        errorHandler.once('error:low', resolve);
      });

      await errorHandler.handleError('test', error, 'low');
      const emittedError = await errorPromise;

      expect(emittedError).toEqual({
        id: 'test',
        error,
        metadata: undefined
      });

      const metrics = errorHandler.getMetrics();
      expect(metrics.retryAttempts).toBe(0);
    });

    it('should retry medium severity errors', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      const retryPromise = new Promise(resolve => {
        errorHandler.once('error:retry', resolve);
      });

      await errorHandler.handleError('test', error, 'medium');
      const emittedRetry = await retryPromise;

      expect(emittedRetry).toMatchObject({
        id: 'test',
        error,
        attempt: 1
      });

      jest.useRealTimers();
    });

    it('should handle critical errors by tripping circuit breaker', async () => {
      const error = new Error('Critical error');
      const circuitBreakerPromise = new Promise(resolve => {
        errorHandler.once('circuit_breaker:trip', resolve);
      });

      await errorHandler.handleError('test', error, 'critical');
      const emittedTrip = await circuitBreakerPromise;

      expect(emittedTrip).toEqual({ id: 'test' });
      expect(errorHandler['isCircuitBroken']('test')).toBe(true);
    });

    it('should block errors when circuit breaker is tripped', async () => {
      const error = new Error('Test error');
      const blockedPromise = new Promise(resolve => {
        errorHandler.once('error:blocked', resolve);
      });

      // Trip circuit breaker
      await errorHandler.handleError('test', error, 'critical');

      // Try to handle another error
      await errorHandler.handleError('test', new Error('Another error'));
      const emittedBlocked = await blockedPromise;

      expect(emittedBlocked).toMatchObject({
        id: 'test',
        reason: 'circuit_breaker'
      });
    });
  });

  describe('retry behavior', () => {
    it('should use exponential backoff for retries', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      const retryDelays: number[] = [];

      errorHandler.on('error:retry', (data) => {
        retryDelays.push(data.delay);
      });

      await errorHandler.handleError('test', error, 'high');
      
      // First retry
      jest.advanceTimersByTime(100);
      // Second retry
      jest.advanceTimersByTime(200);

      expect(retryDelays[1]).toBeGreaterThan(retryDelays[0]);

      jest.useRealTimers();
    });

    it('should stop retrying after max attempts', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      const maxRetriesPromise = new Promise(resolve => {
        errorHandler.once('error:max_retries', resolve);
      });

      await errorHandler.handleError('test', error, 'high');

      // Advance through all retry attempts
      jest.advanceTimersByTime(1000);

      const emittedMaxRetries = await maxRetriesPromise;
      expect(emittedMaxRetries).toMatchObject({
        id: 'test',
        error,
        retries: 2
      });

      jest.useRealTimers();
    });
  });

  describe('circuit breaker', () => {
    it('should reset circuit breaker after timeout', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      const resetPromise = new Promise(resolve => {
        errorHandler.once('circuit_breaker:reset', resolve);
      });

      // Trip circuit breaker
      await errorHandler.handleError('test', error, 'critical');
      expect(errorHandler['isCircuitBroken']('test')).toBe(true);

      // Advance time to trigger reset
      jest.advanceTimersByTime(500);

      const emittedReset = await resetPromise;
      expect(emittedReset).toEqual({ id: 'test' });
      expect(errorHandler['isCircuitBroken']('test')).toBe(false);

      jest.useRealTimers();
    });

    it('should trip circuit breaker after error threshold', async () => {
      const error = new Error('Test error');
      const tripPromise = new Promise(resolve => {
        errorHandler.once('circuit_breaker:trip', resolve);
      });

      // Generate errors up to threshold
      for (let i = 0; i < 3; i++) {
        await errorHandler.handleError('test', error);
      }

      const emittedTrip = await tripPromise;
      expect(emittedTrip).toEqual({ id: 'test' });
      expect(errorHandler['isCircuitBroken']('test')).toBe(true);
    });
  });

  describe('metrics tracking', () => {
    it('should track error metrics accurately', async () => {
      const error = new Error('Test error');

      // Generate some errors
      await errorHandler.handleError('test1', error, 'low');
      await errorHandler.handleError('test2', error, 'medium');
      await errorHandler.handleError('test3', error, 'high');

      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorRate).toBeGreaterThan(0);
    });

    it('should track retry attempts', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      await errorHandler.handleError('test', error, 'high');

      // Advance through retries
      jest.advanceTimersByTime(500);

      const metrics = errorHandler.getMetrics();
      expect(metrics.retryAttempts).toBeGreaterThan(0);

      jest.useRealTimers();
    });

    it('should track circuit breaker trips', async () => {
      const error = new Error('Test error');
      await errorHandler.handleError('test', error, 'critical');

      const metrics = errorHandler.getMetrics();
      expect(metrics.circuitBreakerTrips).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clean up old errors', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      await errorHandler.handleError('test', error);

      // Advance time beyond recovery window
      jest.advanceTimersByTime(1500);

      expect(errorHandler.getErrorContext('test')).toBeUndefined();

      jest.useRealTimers();
    });

    it('should clean up resolved circuit breakers', async () => {
      jest.useFakeTimers();

      const error = new Error('Test error');
      await errorHandler.handleError('test', error, 'critical');

      // Advance time beyond circuit breaker timeout
      jest.advanceTimersByTime(1000);

      expect(errorHandler['circuitBreakers'].size).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('performance monitoring', () => {
    it('should track error handling performance', async () => {
      const startTime = Date.now();
      performanceMonitor.startOperation.mockReturnValue(startTime);

      await errorHandler.handleError('test', new Error('Test error'));

      expect(performanceMonitor.startOperation).toHaveBeenCalledWith('errorHandler.handle');
      expect(performanceMonitor.endOperation).toHaveBeenCalledWith('errorHandler.handle', startTime);
    });

    it('should track error handling failures', async () => {
      const startTime = Date.now();
      performanceMonitor.startOperation.mockReturnValue(startTime);
      const handlingError = new Error('Handling failed');

      // Mock a failure in the error handling process
      jest.spyOn(errorHandler as any, 'handleHighSeverityError')
        .mockRejectedValueOnce(handlingError);

      await expect(errorHandler.handleError('test', new Error('Test error'), 'high'))
        .rejects
        .toThrow(handlingError);

      expect(performanceMonitor.endOperation).toHaveBeenCalledWith(
        'errorHandler.handle',
        startTime,
        handlingError
      );
    });
  });
}); 