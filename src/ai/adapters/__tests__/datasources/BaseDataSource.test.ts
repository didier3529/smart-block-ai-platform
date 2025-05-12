import { BaseDataSource, DataSourceConfig } from '../../datasources/BaseDataSource';

class TestDataSource extends BaseDataSource {
  constructor(config: DataSourceConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async isHealthy(): Promise<boolean> {
    return this.isConnected;
  }

  // Expose protected methods for testing
  public testExecuteWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    return this.executeWithRetry(operation);
  }

  public testHandleError(error: Error, context: string): void {
    this.handleError(error, context);
  }

  public testValidateConfig(): void {
    this.validateConfig();
  }
}

describe('BaseDataSource', () => {
  let dataSource: TestDataSource;
  const defaultConfig: DataSourceConfig = {
    apiKey: 'test-key',
    apiUrl: 'http://test.api',
    wsUrl: 'ws://test.ws',
    retryAttempts: 3,
    retryDelay: 100,
    timeout: 1000
  };

  beforeEach(() => {
    dataSource = new TestDataSource(defaultConfig);
  });

  describe('connection management', () => {
    it('should handle connect and disconnect', async () => {
      expect(dataSource.getConnectionStatus()).toBe(false);

      await dataSource.connect();
      expect(dataSource.getConnectionStatus()).toBe(true);

      await dataSource.disconnect();
      expect(dataSource.getConnectionStatus()).toBe(false);
    });

    it('should emit connected event', async () => {
      const connectHandler = jest.fn();
      dataSource.on('connected', connectHandler);

      await dataSource.connect();
      expect(connectHandler).toHaveBeenCalled();
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Test error');
        }
        return 'success';
      });

      const result = await dataSource.testExecuteWithRetry(operation);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(dataSource.testExecuteWithRetry(operation))
        .rejects
        .toThrow('Test error');
      expect(operation).toHaveBeenCalledTimes(defaultConfig.retryAttempts);
    });
  });

  describe('error handling', () => {
    it('should emit error events', () => {
      const errorHandler = jest.fn();
      dataSource.on('error', errorHandler);

      const testError = new Error('Test error');
      dataSource.testHandleError(testError, 'test context');

      expect(errorHandler).toHaveBeenCalledWith({
        error: testError,
        context: 'test context',
        timestamp: expect.any(Date),
        metrics: expect.any(Object)
      });
    });
  });

  describe('metrics', () => {
    it('should track request metrics', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      await dataSource.testExecuteWithRetry(operation);

      const metrics = dataSource.getMetrics();
      expect(metrics.requestCount).toBe(1);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.latency).toBeGreaterThanOrEqual(0);
      expect(metrics.lastRequest).toBeInstanceOf(Date);
    });

    it('should track error metrics', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));

      try {
        await dataSource.testExecuteWithRetry(operation);
      } catch (error) {
        const metrics = dataSource.getMetrics();
        expect(metrics.errorCount).toBe(defaultConfig.retryAttempts);
        expect(metrics.lastError).toBeInstanceOf(Error);
      }
    });
  });

  describe('configuration validation', () => {
    it('should validate API key format', () => {
      const invalidConfig = { ...defaultConfig, apiKey: 123 };
      const invalidSource = new TestDataSource(invalidConfig);

      expect(() => invalidSource.testValidateConfig())
        .toThrow('Invalid API key configuration');
    });

    it('should validate API URL format', () => {
      const invalidConfig = { ...defaultConfig, apiUrl: 123 };
      const invalidSource = new TestDataSource(invalidConfig);

      expect(() => invalidSource.testValidateConfig())
        .toThrow('Invalid API URL configuration');
    });

    it('should validate WebSocket URL format', () => {
      const invalidConfig = { ...defaultConfig, wsUrl: 123 };
      const invalidSource = new TestDataSource(invalidConfig);

      expect(() => invalidSource.testValidateConfig())
        .toThrow('Invalid WebSocket URL configuration');
    });

    it('should accept valid configuration', () => {
      expect(() => dataSource.testValidateConfig()).not.toThrow();
    });
  });
}); 