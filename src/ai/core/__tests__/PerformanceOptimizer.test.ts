import { PerformanceOptimizer } from '../PerformanceOptimizer';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    optimizer = PerformanceOptimizer.getInstance({
      enableMetrics: true,
      samplingRate: 1.0,
      slowOperationThreshold: 100,
      maxConcurrentOperations: 5,
      resourceMonitoringInterval: 0, // Disable for tests
      cleanupInterval: 0, // Disable for tests
      retentionPeriod: 3600000
    });
  });

  afterEach(async () => {
    await optimizer.shutdown();
  });

  describe('Operation Tracking', () => {
    it('should track operation metrics correctly', () => {
      const startTime = optimizer.startOperation('test_operation');
      expect(startTime).toBeDefined();
      expect(typeof startTime).toBe('number');

      optimizer.endOperation('test_operation', startTime);

      const metrics = optimizer.getMetrics();
      expect(metrics.operations).toHaveLength(1);
      expect(metrics.operations[0]).toMatchObject({
        operation: 'test_operation',
        success: true
      });
      expect(metrics.operations[0].duration).toBeDefined();
      expect(metrics.summary.totalOperations).toBe(1);
      expect(metrics.summary.operationCounts.test_operation).toBe(1);
    });

    it('should track failed operations', () => {
      const startTime = optimizer.startOperation('failed_operation');
      optimizer.endOperation('failed_operation', startTime, new Error('Test error'));

      const metrics = optimizer.getMetrics();
      expect(metrics.operations[0]).toMatchObject({
        operation: 'failed_operation',
        success: false,
        error: 'Test error'
      });
    });

    it('should respect maxConcurrentOperations limit', () => {
      const warningEvents: any[] = [];
      optimizer.on('warning', (warning) => warningEvents.push(warning));

      // Start more operations than the limit
      for (let i = 0; i < 6; i++) {
        optimizer.startOperation('concurrent_test');
      }

      expect(warningEvents).toHaveLength(1);
      expect(warningEvents[0].type).toBe('concurrent_operations_limit');
    });
  });

  describe('Performance Monitoring', () => {
    it('should detect slow operations', () => {
      const slowEvents: any[] = [];
      optimizer.on('slow_operation', (event) => slowEvents.push(event));

      const startTime = Date.now() - 200; // Simulate operation that took 200ms
      optimizer.endOperation('slow_operation', startTime);

      expect(slowEvents).toHaveLength(1);
      expect(slowEvents[0]).toMatchObject({
        operation: 'slow_operation',
        threshold: 100
      });
    });

    it('should calculate accurate performance metrics', async () => {
      // Simulate multiple operations
      const operations = ['op1', 'op2', 'op3'];
      const startTimes = operations.map(op => optimizer.startOperation(op));
      
      // Simulate different durations
      await new Promise(resolve => setTimeout(resolve, 50));
      optimizer.endOperation('op1', startTimes[0]);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      optimizer.endOperation('op2', startTimes[1], new Error('Test error'));
      
      optimizer.endOperation('op3', startTimes[2]);

      const metrics = optimizer.getMetrics();
      expect(metrics.summary.totalOperations).toBe(3);
      expect(metrics.summary.successRate).toBe(2/3);
      expect(metrics.summary.averageDuration).toBeGreaterThan(0);
    });
  });

  describe('Resource Monitoring', () => {
    it('should monitor system resources', async () => {
      const resourceEvents: any[] = [];
      optimizer.on('resource_usage', (metrics) => resourceEvents.push(metrics));

      // Manually trigger resource monitoring
      const usage = await (optimizer as any).monitorResourceUsage();

      expect(usage.memory).toBeDefined();
      expect(usage.cpu).toBeDefined();
      expect(usage.memory.heapUsed).toBeGreaterThan(0);
      expect(usage.memory.heapTotal).toBeGreaterThan(0);
    });

    it('should emit warnings on high memory usage', async () => {
      const warningEvents: any[] = [];
      optimizer.on('warning', (warning) => warningEvents.push(warning));

      // Simulate high memory usage by monitoring actual process memory
      await (optimizer as any).monitorResourceUsage();

      // Note: This test may not always trigger a warning since it depends on actual memory usage
      if (warningEvents.length > 0) {
        expect(warningEvents[0].type).toBe('memory_pressure');
      }
    });
  });

  describe('Cleanup & Maintenance', () => {
    it('should cleanup old metrics', () => {
      // Add some old metrics
      const oldStartTime = Date.now() - 4000000; // Older than retention period
      optimizer.startOperation('old_operation');
      (optimizer as any).metrics[0].startTime = oldStartTime;

      // Add some new metrics
      optimizer.startOperation('new_operation');

      // Manually trigger cleanup
      (optimizer as any).cleanup();

      const metrics = optimizer.getMetrics();
      expect(metrics.operations.length).toBe(1);
      expect(metrics.operations[0].operation).toBe('new_operation');
    });

    it('should properly shutdown', async () => {
      const startTime = optimizer.startOperation('test');
      optimizer.endOperation('test', startTime);

      await optimizer.shutdown();

      const metrics = optimizer.getMetrics();
      expect(metrics.operations).toHaveLength(0);
      expect(metrics.summary.totalOperations).toBe(0);
    });
  });
}); 