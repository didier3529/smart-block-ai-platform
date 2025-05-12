import { DataStreamManager } from '../data-stream-manager';

describe('DataStreamManager Performance Tests', () => {
  let streamManager: DataStreamManager;
  const streamId = 'test-stream';

  beforeEach(() => {
    streamManager = new DataStreamManager({
      batchSize: 100,
      batchTimeout: 50,
      maxQueueSize: 1000,
      priorityLevels: 3,
      rateLimit: 1000
    });
  });

  afterEach(async () => {
    await streamManager.cleanup();
  });

  it('should handle high throughput without degrading performance', async () => {
    await streamManager.createStream(streamId);
    
    const startTime = Date.now();
    const messageCount = 10000;
    const messages = [];
    
    // Generate test messages
    for (let i = 0; i < messageCount; i++) {
      messages.push({
        id: i,
        timestamp: Date.now(),
        data: `test-data-${i}`
      });
    }

    // Track metrics
    let maxLatency = 0;
    let totalLatency = 0;
    let droppedMessages = 0;

    streamManager.on('metrics:update', (metrics) => {
      maxLatency = Math.max(maxLatency, metrics.latency);
      totalLatency += metrics.latency;
      droppedMessages = metrics.droppedMessages;
    });

    // Send messages in parallel
    await Promise.all(messages.map(msg => 
      streamManager.pushToStream(streamId, msg)
    ));

    const endTime = Date.now();
    const duration = endTime - startTime;
    const throughput = messageCount / (duration / 1000); // messages per second

    // Performance assertions
    expect(throughput).toBeGreaterThan(500); // At least 500 msgs/sec
    expect(maxLatency).toBeLessThan(1000); // Max latency under 1s
    expect(droppedMessages).toBe(0); // No dropped messages
  });

  it('should maintain performance under backpressure', async () => {
    await streamManager.createStream(streamId, {
      maxQueueSize: 100 // Small queue to test backpressure
    });

    const messageCount = 1000;
    let processedMessages = 0;
    let maxBackpressure = 0;

    streamManager.on('metrics:update', (metrics) => {
      processedMessages = metrics.processedMessages;
      maxBackpressure = Math.max(maxBackpressure, metrics.backpressure);
    });

    // Send messages faster than processing rate
    for (let i = 0; i < messageCount; i++) {
      await streamManager.pushToStream(streamId, {
        id: i,
        priority: i % 3 === 0 ? 'high' : 'normal'
      });
    }

    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify backpressure handling
    expect(processedMessages).toBeGreaterThan(0);
    expect(maxBackpressure).toBeLessThan(0.9); // Backpressure should be managed
  });

  it('should prioritize high-priority messages under load', async () => {
    await streamManager.createStream(streamId);

    const messageCount = 1000;
    const highPriorityMessages = new Set();
    const processedOrder: string[] = [];

    // Track message processing order
    streamManager.on('data', (data) => {
      processedOrder.push(data.id);
    });

    // Send mix of high and normal priority messages
    for (let i = 0; i < messageCount; i++) {
      const priority = i % 3 === 0 ? 'high' : 'normal';
      if (priority === 'high') {
        highPriorityMessages.add(i);
      }
      await streamManager.pushToStream(streamId, { id: i }, priority);
    }

    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify high priority messages were processed first
    let highPriorityProcessed = 0;
    for (let i = 0; i < highPriorityMessages.size; i++) {
      if (highPriorityMessages.has(parseInt(processedOrder[i]))) {
        highPriorityProcessed++;
      }
    }

    // At least 80% of high priority messages should be processed first
    expect(highPriorityProcessed / highPriorityMessages.size).toBeGreaterThan(0.8);
  });

  it('should maintain memory usage within bounds', async () => {
    await streamManager.createStream(streamId);

    const initialMemory = process.memoryUsage().heapUsed;
    const messageCount = 10000;
    const largeData = Buffer.alloc(1024).fill('x').toString(); // 1KB data

    // Send large messages
    for (let i = 0; i < messageCount; i++) {
      await streamManager.pushToStream(streamId, {
        id: i,
        data: largeData
      });
    }

    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100);
  });

  it('should recover from connection failures without data loss', async () => {
    await streamManager.createStream(streamId);

    const messageCount = 1000;
    let processedMessages = 0;
    let errors = 0;

    streamManager.on('metrics:update', (metrics) => {
      processedMessages = metrics.processedMessages;
    });

    streamManager.on('error', () => {
      errors++;
    });

    // Simulate connection failures while sending messages
    for (let i = 0; i < messageCount; i++) {
      if (i % 100 === 0) {
        // Simulate connection failure
        await streamManager.closeStream(streamId);
        await streamManager.createStream(streamId);
      }
      await streamManager.pushToStream(streamId, { id: i });
    }

    // Wait for recovery and processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify all messages were eventually processed
    expect(processedMessages).toBe(messageCount);
    expect(errors).toBeGreaterThan(0); // Should have detected errors
  });
}); 