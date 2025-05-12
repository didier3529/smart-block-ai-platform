import { BlockchainEventManager } from '../blockchain-event-manager';
import { DataStreamManager } from '../data-stream-manager';
import { PerformanceMonitor } from '../../performance/monitor';

jest.mock('../data-stream-manager');
jest.mock('../../performance/monitor');

describe('BlockchainEventManager', () => {
  let eventManager: BlockchainEventManager;
  let streamManager: jest.Mocked<DataStreamManager>;
  let performanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    streamManager = new DataStreamManager() as jest.Mocked<DataStreamManager>;
    performanceMonitor = PerformanceMonitor.getInstance() as jest.Mocked<PerformanceMonitor>;
    eventManager = new BlockchainEventManager(streamManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    eventManager.cleanup();
  });

  describe('subscription management', () => {
    it('should create a subscription successfully', async () => {
      const callback = jest.fn();
      const subscriptionId = await eventManager.subscribe('newBlock', callback);

      expect(subscriptionId).toBeDefined();
      expect(streamManager.createStream).toHaveBeenCalledWith('newBlock', expect.any(Object));
    });

    it('should handle subscription with filters', async () => {
      const callback = jest.fn();
      const filter = { chainId: 1 };
      const subscriptionId = await eventManager.subscribe('newBlock', callback, { filter });

      expect(subscriptionId).toBeDefined();
      expect(streamManager.createStream).toHaveBeenCalled();
    });

    it('should unsubscribe successfully', async () => {
      const callback = jest.fn();
      const subscriptionId = await eventManager.subscribe('newBlock', callback);
      const result = eventManager.unsubscribe(subscriptionId);

      expect(result).toBe(true);
    });

    it('should return false when unsubscribing from non-existent subscription', () => {
      const result = eventManager.unsubscribe('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should process events and notify matching subscribers', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const eventData = { blockNumber: 123, chainId: 1 };

      await eventManager.subscribe('newBlock', callback1);
      await eventManager.subscribe('newBlock', callback2);
      await eventManager.handleEvent('newBlock', eventData);

      expect(callback1).toHaveBeenCalledWith(eventData);
      expect(callback2).toHaveBeenCalledWith(eventData);
    });

    it('should filter events based on subscription filters', async () => {
      const callback = jest.fn();
      const filter = { chainId: 1 };
      const eventData = { blockNumber: 123, chainId: 2 };

      await eventManager.subscribe('newBlock', callback, { filter });
      await eventManager.handleEvent('newBlock', eventData);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle events with priority order', async () => {
      const highPriorityCallback = jest.fn();
      const normalPriorityCallback = jest.fn();
      const lowPriorityCallback = jest.fn();
      const eventData = { blockNumber: 123 };

      await eventManager.subscribe('newBlock', highPriorityCallback, { priority: 'high' });
      await eventManager.subscribe('newBlock', normalPriorityCallback, { priority: 'normal' });
      await eventManager.subscribe('newBlock', lowPriorityCallback, { priority: 'low' });

      const executionOrder: number[] = [];
      highPriorityCallback.mockImplementation(() => executionOrder.push(1));
      normalPriorityCallback.mockImplementation(() => executionOrder.push(2));
      lowPriorityCallback.mockImplementation(() => executionOrder.push(3));

      await eventManager.handleEvent('newBlock', eventData);

      expect(executionOrder).toEqual([1, 2, 3]);
    });
  });

  describe('error handling', () => {
    it('should handle callback errors without affecting other subscribers', async () => {
      const successCallback = jest.fn();
      const errorCallback = jest.fn().mockRejectedValue(new Error('Test error'));
      const eventData = { blockNumber: 123 };

      await eventManager.subscribe('newBlock', successCallback);
      await eventManager.subscribe('newBlock', errorCallback);

      await eventManager.handleEvent('newBlock', eventData);

      expect(successCallback).toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    });

    it('should emit subscription errors', async () => {
      const errorCallback = jest.fn().mockRejectedValue(new Error('Test error'));
      const errorHandler = jest.fn();
      const eventData = { blockNumber: 123 };

      eventManager.on('subscription:error', errorHandler);
      await eventManager.subscribe('newBlock', errorCallback);
      await eventManager.handleEvent('newBlock', eventData);

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('performance monitoring', () => {
    it('should track event processing metrics', async () => {
      const callback = jest.fn();
      const eventData = { blockNumber: 123 };

      await eventManager.subscribe('newBlock', callback);
      await eventManager.handleEvent('newBlock', eventData);

      const metrics = eventManager.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.processedEvents).toBe(1);
    });

    it('should track filtered events', async () => {
      const callback = jest.fn();
      const filter = { chainId: 1 };
      const eventData = { blockNumber: 123, chainId: 2 };

      await eventManager.subscribe('newBlock', callback, { filter });
      await eventManager.handleEvent('newBlock', eventData);

      const metrics = eventManager.getMetrics();
      expect(metrics.filteredEvents).toBe(0);
    });
  });

  describe('garbage collection', () => {
    it('should clean up inactive subscriptions', async () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      
      await eventManager.subscribe('newBlock', callback);
      
      // Fast forward 6 minutes (beyond the 5-minute GC interval)
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      // Verify GC ran
      expect(performanceMonitor.startOperation).toHaveBeenCalledWith('garbageCollect');
      
      jest.useRealTimers();
    });
  });
}); 