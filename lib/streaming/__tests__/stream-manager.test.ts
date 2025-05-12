import { StreamManager } from '../stream-manager';
import { BlockchainEventManager } from '../blockchain-event-manager';
import { PerformanceMonitor } from '../../performance/monitor';
import { DataTransformationPipeline } from '../data-transformation-pipeline';

jest.mock('../blockchain-event-manager');
jest.mock('../../performance/monitor');
jest.mock('../data-transformation-pipeline');

describe('StreamManager', () => {
  let streamManager: StreamManager;
  let eventManager: jest.Mocked<BlockchainEventManager>;
  let performanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    eventManager = new BlockchainEventManager() as jest.Mocked<BlockchainEventManager>;
    performanceMonitor = PerformanceMonitor.getInstance() as jest.Mocked<PerformanceMonitor>;
    streamManager = new StreamManager(eventManager, {
      maxConcurrentStreams: 2,
      streamTimeout: 1000,
      recoveryAttempts: 2,
      recoveryDelay: 100
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    streamManager.cleanup();
  });

  describe('stream lifecycle', () => {
    it('should create a stream successfully', async () => {
      const metadata = { chainId: 1 };
      const stream = await streamManager.createStream('test', metadata);

      expect(stream.id).toBe('test');
      expect(stream.status).toBe('active');
      expect(stream.metadata).toEqual(metadata);
      expect(eventManager.subscribe).toHaveBeenCalled();
    });

    it('should enforce maximum concurrent streams limit', async () => {
      await streamManager.createStream('stream1');
      await streamManager.createStream('stream2');

      await expect(streamManager.createStream('stream3'))
        .rejects
        .toThrow('Maximum concurrent streams limit reached');
    });

    it('should close a stream successfully', async () => {
      await streamManager.createStream('test');
      const result = await streamManager.closeStream('test');

      expect(result).toBe(true);
      const state = streamManager.getStreamState('test');
      expect(state).toBeUndefined();
    });

    it('should pause and resume a stream', async () => {
      await streamManager.createStream('test');
      
      await streamManager.pauseStream('test');
      let state = streamManager.getStreamState('test');
      expect(state?.status).toBe('paused');

      await streamManager.resumeStream('test');
      state = streamManager.getStreamState('test');
      expect(state?.status).toBe('active');
    });
  });

  describe('data handling', () => {
    it('should process stream data correctly', async () => {
      const streamId = 'test';
      const testData = { value: 'test' };
      const transformedData = { transformed: true };

      // Mock transformation pipeline
      (DataTransformationPipeline.prototype.process as jest.Mock).mockResolvedValue(transformedData);

      // Create stream and simulate data
      await streamManager.createStream(streamId);
      
      // Get the callback passed to eventManager.subscribe
      const [[, callback]] = (eventManager.subscribe as jest.Mock).mock.calls;
      
      // Create promise to wait for stream:data event
      const dataPromise = new Promise(resolve => {
        streamManager.once('stream:data', resolve);
      });

      // Simulate data arrival
      await callback(testData);

      // Wait for and verify emitted data
      const emittedData = await dataPromise;
      expect(emittedData).toEqual({
        streamId,
        data: transformedData
      });
    });

    it('should handle data transformation errors', async () => {
      const streamId = 'test';
      const testData = { value: 'test' };
      const error = new Error('Transform error');

      // Mock transformation pipeline to throw error
      (DataTransformationPipeline.prototype.process as jest.Mock).mockRejectedValue(error);

      // Create stream and simulate data
      await streamManager.createStream(streamId);
      
      // Get the callback passed to eventManager.subscribe
      const [[, callback]] = (eventManager.subscribe as jest.Mock).mock.calls;
      
      // Create promise to wait for stream:error event
      const errorPromise = new Promise(resolve => {
        streamManager.once('stream:error', resolve);
      });

      // Simulate data arrival
      await callback(testData);

      // Wait for and verify error
      const emittedError = await errorPromise;
      expect(emittedError).toEqual({
        streamId,
        error,
        status: 'error'
      });
    });
  });

  describe('error recovery', () => {
    it('should attempt recovery after error', async () => {
      jest.useFakeTimers();

      const streamId = 'test';
      await streamManager.createStream(streamId);

      // Simulate error
      const error = new Error('Test error');
      streamManager['handleError'](streamId, error);

      // First recovery attempt
      jest.advanceTimersByTime(100);
      let state = streamManager.getStreamState(streamId);
      expect(state?.status).toBe('active');

      // Simulate another error
      streamManager['handleError'](streamId, error);

      // Second recovery attempt
      jest.advanceTimersByTime(200);
      state = streamManager.getStreamState(streamId);
      expect(state?.status).toBe('active');

      // Simulate third error (should close stream after max attempts)
      streamManager['handleError'](streamId, error);
      jest.advanceTimersByTime(300);
      state = streamManager.getStreamState(streamId);
      expect(state).toBeUndefined();

      jest.useRealTimers();
    });
  });

  describe('cleanup and maintenance', () => {
    it('should clean up inactive streams', async () => {
      jest.useFakeTimers();

      await streamManager.createStream('test1');
      await streamManager.createStream('test2');

      // Advance time beyond timeout
      jest.advanceTimersByTime(1500);

      // Verify streams were cleaned up
      expect(streamManager.getStreamState('test1')).toBeUndefined();
      expect(streamManager.getStreamState('test2')).toBeUndefined();

      jest.useRealTimers();
    });

    it('should maintain accurate metrics', async () => {
      const streamId = 'test';
      await streamManager.createStream(streamId);

      // Simulate some activity
      const [[, callback]] = (eventManager.subscribe as jest.Mock).mock.calls;
      await callback({ value: 'test1' });
      await callback({ value: 'test2' });

      const metrics = streamManager.getMetrics();
      expect(metrics.activeStreams).toBe(1);
      expect(metrics.totalMessages).toBe(2);
      expect(metrics.messageRate).toBeGreaterThan(0);
      expect(metrics.averageLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance monitoring', () => {
    it('should track stream creation performance', async () => {
      const startTime = Date.now();
      performanceMonitor.startOperation.mockReturnValue(startTime);

      await streamManager.createStream('test');

      expect(performanceMonitor.startOperation).toHaveBeenCalledWith('createStream');
      expect(performanceMonitor.endOperation).toHaveBeenCalledWith('createStream', startTime);
    });

    it('should track stream data handling performance', async () => {
      const startTime = Date.now();
      performanceMonitor.startOperation.mockReturnValue(startTime);

      await streamManager.createStream('test');
      const [[, callback]] = (eventManager.subscribe as jest.Mock).mock.calls;
      await callback({ value: 'test' });

      expect(performanceMonitor.startOperation).toHaveBeenCalledWith('handleStreamData');
      expect(performanceMonitor.endOperation).toHaveBeenCalledWith('handleStreamData', startTime);
    });
  });
}); 