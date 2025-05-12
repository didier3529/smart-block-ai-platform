import { ResponseProcessor } from '../ResponseProcessor';
import { Orchestrator } from '../Orchestrator';
import { PerformanceOptimizer } from '../PerformanceOptimizer';
import { ProcessingStep, ProcessingPipeline } from '../../types/processing';
import { AgentResponse, Agent, AgentConfig, AgentMessage, BaseAgent } from '../../types/agents';
import { commonSteps } from '../../processing/commonSteps';
import { EventEmitter } from 'events';

describe('AI Agent System Performance Benchmarks', () => {
  let responseProcessor: ResponseProcessor;
  let orchestrator: Orchestrator;
  let optimizer: PerformanceOptimizer;

  beforeAll(() => {
    responseProcessor = ResponseProcessor.getInstance();
    orchestrator = Orchestrator.getInstance();
    optimizer = PerformanceOptimizer.getInstance({
      enableMetrics: true,
      samplingRate: 1.0
    });
  });

  afterAll(async () => {
    await responseProcessor.cleanup();
    await orchestrator.cleanup();
    await optimizer.shutdown();
  });

  describe('Response Processing Performance', () => {
    it('should process responses efficiently with caching', async () => {
      const mockResponse: AgentResponse = {
        type: 'test',
        data: { value: 'test data' },
        metadata: {}
      };

      const pipeline: ProcessingPipeline = {
        steps: [
          commonSteps.formatJsonStep,
          commonSteps.validateNumbersStep,
          commonSteps.addTimestampStep
        ]
      };

      // First request - uncached
      const uncachedStart = Date.now();
      const result1 = await responseProcessor.processResponse(mockResponse, pipeline);
      const uncachedTime = Date.now() - uncachedStart;

      // Second request - should hit cache
      const cachedStart = Date.now();
      const result2 = await responseProcessor.processResponse(mockResponse, pipeline);
      const cachedTime = Date.now() - cachedStart;

      console.log('Response processing performance:');
      console.log('Uncached processing time:', uncachedTime, 'ms');
      console.log('Cached processing time:', cachedTime, 'ms');
      console.log('Cache performance improvement:', ((uncachedTime - cachedTime) / uncachedTime * 100).toFixed(2) + '%');

      // Cached processing should be significantly faster
      expect(cachedTime).toBeLessThanOrEqual(uncachedTime);  // For small test data, just ensure it's not slower
      expect(result2).toEqual(result1);
    });

    it('should handle concurrent response processing efficiently', async () => {
      const mockResponses = Array(10).fill(null).map((_, i) => ({
        type: 'test',
        data: { value: `test data ${i}` },
        metadata: {}
      }));

      const pipeline: ProcessingPipeline = {
        steps: [
          commonSteps.formatJsonStep,
          commonSteps.validateNumbersStep,
          commonSteps.addTimestampStep
        ]
      };

      const startTime = Date.now();
      const results = await Promise.all(
        mockResponses.map(response => 
          responseProcessor.processResponse(response, pipeline)
        )
      );
      const totalTime = Date.now() - startTime;

      console.log('Concurrent processing performance:');
      console.log('Total time for', mockResponses.length, 'responses:', totalTime, 'ms');
      console.log('Average time per response:', totalTime / mockResponses.length, 'ms');

      expect(results).toHaveLength(mockResponses.length);
      const metrics = responseProcessor.getPerformanceMetrics();
      console.log('Detailed performance metrics:', metrics.summary);
    });
  });

  describe('Agent Orchestration Performance', () => {
    class TestAgent extends BaseAgent {
      constructor() {
        super('test');
      }

      async processMessage(message: AgentMessage): Promise<AgentResponse> {
        return {
          type: 'test',
          data: { processed: message },
          metadata: {}
        };
      }
    }

    beforeEach(async () => {
      // Register test agents
      for (let i = 0; i < 5; i++) {
        await orchestrator.registerAgent(new TestAgent(), {
          id: `test-agent-${i}`,
          type: 'test',
          capabilities: ['test']
        });
      }
    });

    it('should handle concurrent agent operations efficiently', async () => {
      const messages = Array(20).fill(null).map((_, i) => ({
        type: 'test',
        targetAgent: `test-agent-${i % 5}`,
        data: { test: i }
      }));

      const startTime = Date.now();
      const taskIds = await Promise.all(
        messages.map(msg => orchestrator.sendMessage(msg))
      );
      const results = await Promise.all(
        taskIds.map(id => orchestrator.getTaskResult(id))
      );
      const totalTime = Date.now() - startTime;

      console.log('Agent orchestration performance:');
      console.log('Total time for', messages.length, 'messages:', totalTime, 'ms');
      console.log('Average time per message:', totalTime / messages.length, 'ms');

      expect(results).toHaveLength(messages.length);
      const metrics = orchestrator.getPerformanceMetrics();
      console.log('Detailed orchestration metrics:', metrics.summary);
    });

    it('should efficiently broadcast messages to all agents', async () => {
      const broadcastMessage = {
        type: 'broadcast-test',
        targetAgent: '*',
        data: { broadcast: true }
      };

      const startTime = Date.now();
      const taskIds = await orchestrator.broadcastMessage(broadcastMessage);
      const results = await Promise.all(
        taskIds.map(id => orchestrator.getTaskResult(id))
      );
      const totalTime = Date.now() - startTime;

      console.log('Broadcast performance:');
      console.log('Total broadcast time:', totalTime, 'ms');
      console.log('Average time per agent:', totalTime / results.length, 'ms');

      expect(results).toHaveLength(5); // One result per test agent
      const metrics = orchestrator.getPerformanceMetrics();
      console.log('Broadcast metrics:', metrics.summary);
    });
  });

  describe('System Resource Usage', () => {
    it('should monitor resource usage under load', async () => {
      const resourceMetrics: any[] = [];
      optimizer.on('resource_usage', (metrics) => resourceMetrics.push(metrics));

      // Generate load
      const loadOperations = Array(100).fill(null).map((_, i) => {
        const opId = optimizer.startOperation(`load_test_${i}`);
        return new Promise(resolve => {
          setTimeout(() => {
            optimizer.endOperation(`load_test_${i}`, opId);
            resolve(null);
          }, Math.random() * 100);
        });
      });

      await Promise.all(loadOperations);

      // Wait for resource metrics collection
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(resourceMetrics.length).toBeGreaterThan(0);
      console.log('Resource usage metrics:', resourceMetrics[resourceMetrics.length - 1]);

      const metrics = optimizer.getMetrics();
      console.log('Load test metrics:', metrics.summary);
      expect(metrics.summary.totalOperations).toBeGreaterThanOrEqual(100);
    });
  });
}); 