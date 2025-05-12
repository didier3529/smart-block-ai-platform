import { Orchestrator } from '../Orchestrator';
import { AgentFactory } from '../AgentFactory';
import { PromptManager } from '../PromptManager';
import { ResponseProcessor } from '../ResponseProcessor';
import { MockPortfolioAnalyst } from '../../agents/__mocks__/PortfolioAnalyst';
import { AgentMessage } from '../../types';
import {
  createTestPortfolioAnalystConfig,
  createTestMessage,
  createTestHoldings,
  createTestTasks,
  validateAgentResponse,
  validatePortfolioAnalysis,
  setupTestEnvironment,
  cleanupTestEnvironment,
  canRunIntegrationTests,
  delay
} from './test-helpers';

// Mock the PortfolioAnalyst import in AgentFactory
jest.mock('../../agents/PortfolioAnalyst', () => ({
  PortfolioAnalyst: MockPortfolioAnalyst
}));

const TEST_TIMEOUT = 30000; // 30 seconds

describe('AI Agent System Integration Tests', () => {
  let orchestrator: Orchestrator;
  let agentFactory: AgentFactory;
  let promptManager: PromptManager;
  let responseProcessor: ResponseProcessor;

  beforeAll(async () => {
    if (!canRunIntegrationTests()) {
      console.log('Skipping integration tests');
      return;
    }

    // Setup test environment
    setupTestEnvironment();

    // Initialize core components
    orchestrator = Orchestrator.getInstance();
    agentFactory = AgentFactory.getInstance();
    promptManager = PromptManager.getInstance();
    responseProcessor = ResponseProcessor.getInstance();
  });

  afterAll(async () => {
    if (!canRunIntegrationTests()) {
      return;
    }

    // Cleanup resources
    await orchestrator.cleanup();
    await responseProcessor.cleanup();
    cleanupTestEnvironment();
  });

  describe('Agent Lifecycle Management', () => {
    it('should successfully initialize and register an agent', async () => {
      const config = createTestPortfolioAnalystConfig('test-portfolio-analyst');
      const agent = await agentFactory.createAgent('portfolio-analyst', config);
      
      expect(agent).toBeInstanceOf(MockPortfolioAnalyst);
      expect(agent.getState().status).toBe('ready');
    }, TEST_TIMEOUT);

    it('should handle agent initialization failures gracefully', async () => {
      const invalidConfig = createTestPortfolioAnalystConfig('test-portfolio-analyst', {
        analysisThresholds: undefined
      });

      await expect(agentFactory.createAgent('portfolio-analyst', invalidConfig))
        .rejects.toThrow('Risk tolerance threshold not configured');
    });

    it('should properly cleanup and destroy agents', async () => {
      const config = createTestPortfolioAnalystConfig('test-portfolio-analyst');
      const agent = await agentFactory.createAgent('portfolio-analyst', config);
      const agentId = agent.id;

      await agentFactory.destroyAgent(agentId);
      expect(agentFactory.getAgent(agentId)).toBeUndefined();
    });
  });

  describe('Agent Orchestration', () => {
    let testAgent: MockPortfolioAnalyst;

    beforeEach(async () => {
      const config = createTestPortfolioAnalystConfig('test-orchestration-agent');
      testAgent = await agentFactory.createAgent('portfolio-analyst', config) as MockPortfolioAnalyst;
    });

    afterEach(async () => {
      await agentFactory.destroyAgent(testAgent.id);
    });

    it('should successfully distribute tasks to agents', async () => {
      const [task] = createTestTasks(testAgent.id, 1);
      await orchestrator.distributeTask(task);
      
      const taskStatus = await orchestrator.getTaskStatus(task.taskId);
      expect(taskStatus?.status).toBe('completed');
    }, TEST_TIMEOUT);

    it('should handle task dependencies correctly', async () => {
      const tasks = createTestTasks(testAgent.id, 2, true);
      
      await orchestrator.distributeTask(tasks[0]);
      await orchestrator.distributeTask(tasks[1]);

      const task2Status = await orchestrator.getTaskStatus(tasks[1].taskId);
      expect(task2Status?.status).toBe('completed');
    }, TEST_TIMEOUT);

    it('should handle concurrent task processing', async () => {
      const tasks = createTestTasks(testAgent.id, 5);
      
      await Promise.all(tasks.map(task => orchestrator.distributeTask(task)));
      
      const statuses = await Promise.all(
        tasks.map(task => orchestrator.getTaskStatus(task.taskId))
      );

      statuses.forEach(status => {
        expect(status?.status).toBe('completed');
      });
    }, TEST_TIMEOUT);
  });

  describe('Message Processing', () => {
    let testAgent: MockPortfolioAnalyst;

    beforeEach(async () => {
      const config = createTestPortfolioAnalystConfig('test-message-agent');
      testAgent = await agentFactory.createAgent('portfolio-analyst', config) as MockPortfolioAnalyst;
    });

    afterEach(async () => {
      await agentFactory.destroyAgent(testAgent.id);
    });

    it('should process messages through the response pipeline', async () => {
      const holdings = createTestHoldings();
      const message = createTestMessage(testAgent.id, 'test', { holdings });

      const taskId = await orchestrator.sendMessage(message);
      const result = await orchestrator.getTaskResult(taskId);

      validateAgentResponse(result);
      validatePortfolioAnalysis(result.data);
    }, TEST_TIMEOUT);

    it('should handle message processing errors gracefully', async () => {
      const invalidMessage = createTestMessage(testAgent.id, 'test', { invalid: true });

      const taskId = await orchestrator.sendMessage(invalidMessage);
      await expect(orchestrator.getTaskResult(taskId)).rejects.toThrow('Invalid message data');
    });
  });

  describe('Error Handling and Recovery', () => {
    let testAgent: MockPortfolioAnalyst;

    beforeEach(async () => {
      const config = createTestPortfolioAnalystConfig('test-error-agent');
      testAgent = await agentFactory.createAgent('portfolio-analyst', config) as MockPortfolioAnalyst;
    });

    afterEach(async () => {
      await agentFactory.destroyAgent(testAgent.id);
    });

    it('should handle and recover from temporary failures', async () => {
      // Simulate temporary failure
      testAgent.setState({ status: 'error' });
      expect(testAgent.getState().status).toBe('error');

      // Agent should recover on next operation
      const holdings = createTestHoldings(1);
      const message = createTestMessage(testAgent.id, 'test', { holdings });

      const taskId = await orchestrator.sendMessage(message);
      const result = await orchestrator.getTaskResult(taskId);

      validateAgentResponse(result);
      expect(testAgent.getState().status).toBe('ready');
    }, TEST_TIMEOUT);

    it('should maintain system stability under error conditions', async () => {
      // Send multiple error-inducing messages
      const errorMessages = Array(10).fill(null).map((_, i) => 
        createTestMessage(testAgent.id, 'test', { invalid: true, index: i })
      );

      const taskIds = await Promise.all(
        errorMessages.map(msg => orchestrator.sendMessage(msg))
      );

      // System should remain stable and continue processing
      const holdings = createTestHoldings(1);
      const validMessage = createTestMessage(testAgent.id, 'test', { holdings });

      const validTaskId = await orchestrator.sendMessage(validMessage);
      const result = await orchestrator.getTaskResult(validTaskId);

      validateAgentResponse(result);
      expect(testAgent.getState().status).toBe('ready');
    }, TEST_TIMEOUT);

    it('should track agent metrics during error conditions', async () => {
      const initialMetrics = testAgent.getState().metrics;
      expect(initialMetrics.totalRequests).toBe(0);
      expect(initialMetrics.failedRequests).toBe(0);

      // Send error-inducing message
      const errorMessage = createTestMessage(testAgent.id, 'test', { invalid: true });
      const taskId = await orchestrator.sendMessage(errorMessage);
      await expect(orchestrator.getTaskResult(taskId)).rejects.toThrow();

      const updatedMetrics = testAgent.getState().metrics;
      expect(updatedMetrics.totalRequests).toBe(1);
      expect(updatedMetrics.failedRequests).toBe(1);
    });
  });
}); 