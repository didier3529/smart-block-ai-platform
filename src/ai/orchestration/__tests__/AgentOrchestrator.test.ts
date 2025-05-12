import { AgentOrchestrator } from '../AgentOrchestrator';
import { BaseAgent } from '../../core/BaseAgent';
import { PromptManager } from '../../core/PromptManager';
import { StateManager } from '../../core/StateManager';
import { PerformanceManager } from '../../core/PerformanceManager';
import { ModelProviderFactory } from '../../providers/ModelProviderFactory';
import { AgentConfig, AgentState, AgentMessage } from '../../types/agents';

// Mock dependencies
jest.mock('../../core/BaseAgent');
jest.mock('../../core/PromptManager');
jest.mock('../../core/StateManager');
jest.mock('../../core/PerformanceManager');
jest.mock('../../providers/ModelProviderFactory');

describe('Agent Orchestration System', () => {
  let orchestrator: AgentOrchestrator;
  let mockPromptManager: jest.Mocked<PromptManager>;
  let mockStateManager: jest.Mocked<StateManager>;
  let mockPerformanceManager: jest.Mocked<PerformanceManager>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock managers
    mockPromptManager = new PromptManager() as jest.Mocked<PromptManager>;
    mockStateManager = new StateManager({} as any, {} as any) as jest.Mocked<StateManager>;
    mockPerformanceManager = new PerformanceManager() as jest.Mocked<PerformanceManager>;

    // Create orchestrator instance
    orchestrator = new AgentOrchestrator(
      mockPromptManager,
      mockStateManager,
      mockPerformanceManager
    );
  });

  describe('Agent Registration', () => {
    it('should register agents successfully', async () => {
      const mockAgent = new BaseAgent('test');
      await orchestrator.registerAgent('test-agent', mockAgent);

      expect(await orchestrator.getAgent('test-agent')).toBe(mockAgent);
    });

    it('should prevent duplicate registration', async () => {
      const mockAgent = new BaseAgent('test');
      await orchestrator.registerAgent('test-agent', mockAgent);

      await expect(orchestrator.registerAgent('test-agent', mockAgent))
        .rejects.toThrow('Agent already registered');
    });

    it('should list registered agents', async () => {
      const mockAgent1 = new BaseAgent('test1');
      const mockAgent2 = new BaseAgent('test2');

      await orchestrator.registerAgent('agent1', mockAgent1);
      await orchestrator.registerAgent('agent2', mockAgent2);

      const agents = await orchestrator.listAgents();
      expect(agents).toContain('agent1');
      expect(agents).toContain('agent2');
    });
  });

  describe('Task Distribution', () => {
    it('should distribute tasks to appropriate agents', async () => {
      const mockAgent = new BaseAgent('test');
      mockAgent.handleTask = jest.fn().mockResolvedValue({ success: true });

      await orchestrator.registerAgent('test-agent', mockAgent);
      await orchestrator.assignTask('test-agent', { type: 'test', data: {} });

      expect(mockAgent.handleTask).toHaveBeenCalled();
    });

    it('should handle task assignment to non-existent agent', async () => {
      await expect(orchestrator.assignTask('non-existent', { type: 'test', data: {} }))
        .rejects.toThrow('Agent not found');
    });

    it('should track task status', async () => {
      const mockAgent = new BaseAgent('test');
      await orchestrator.registerAgent('test-agent', mockAgent);

      const taskId = await orchestrator.assignTask('test-agent', { type: 'test', data: {} });
      const status = await orchestrator.getTaskStatus(taskId);

      expect(status).toBeDefined();
    });
  });

  describe('Inter-agent Communication', () => {
    it('should deliver messages between agents', async () => {
      const mockSender = new BaseAgent('sender');
      const mockReceiver = new BaseAgent('receiver');
      mockReceiver.handleMessage = jest.fn().mockResolvedValue({ success: true });

      await orchestrator.registerAgent('sender', mockSender);
      await orchestrator.registerAgent('receiver', mockReceiver);

      await orchestrator.sendMessage('sender', 'receiver', { type: 'test', data: {} });

      expect(mockReceiver.handleMessage).toHaveBeenCalled();
    });

    it('should handle message delivery to non-existent agent', async () => {
      const mockSender = new BaseAgent('sender');
      await orchestrator.registerAgent('sender', mockSender);

      await expect(orchestrator.sendMessage('sender', 'non-existent', { type: 'test', data: {} }))
        .rejects.toThrow('Recipient agent not found');
    });

    it('should validate message format', async () => {
      const mockSender = new BaseAgent('sender');
      const mockReceiver = new BaseAgent('receiver');

      await orchestrator.registerAgent('sender', mockSender);
      await orchestrator.registerAgent('receiver', mockReceiver);

      await expect(orchestrator.sendMessage('sender', 'receiver', {} as any))
        .rejects.toThrow('Invalid message format');
    });
  });

  describe('State Management', () => {
    it('should persist agent states', async () => {
      const mockAgent = new BaseAgent('test');
      const mockState: AgentState = {
        id: 'test-agent',
        status: 'active',
        lastUpdate: Date.now(),
        data: {}
      };

      await orchestrator.registerAgent('test-agent', mockAgent);
      await orchestrator.saveAgentState('test-agent', mockState);

      expect(mockStateManager.saveState).toHaveBeenCalledWith('test-agent', mockState);
    });

    it('should restore agent states', async () => {
      const mockAgent = new BaseAgent('test');
      const mockState: AgentState = {
        id: 'test-agent',
        status: 'active',
        lastUpdate: Date.now(),
        data: {}
      };

      mockStateManager.loadState.mockResolvedValueOnce(mockState);

      await orchestrator.registerAgent('test-agent', mockAgent);
      const state = await orchestrator.loadAgentState('test-agent');

      expect(state).toEqual(mockState);
    });

    it('should handle state restoration failures', async () => {
      mockStateManager.loadState.mockRejectedValueOnce(new Error('Storage error'));

      await expect(orchestrator.loadAgentState('test-agent'))
        .rejects.toThrow('Failed to load agent state');
    });
  });

  describe('Error Handling', () => {
    it('should handle agent failures gracefully', async () => {
      const mockAgent = new BaseAgent('test');
      mockAgent.handleTask = jest.fn().mockRejectedValue(new Error('Task failed'));

      await orchestrator.registerAgent('test-agent', mockAgent);
      const taskId = await orchestrator.assignTask('test-agent', { type: 'test', data: {} });
      const status = await orchestrator.getTaskStatus(taskId);

      expect(status.error).toBeDefined();
    });

    it('should propagate errors to relevant agents', async () => {
      const mockAgent1 = new BaseAgent('test1');
      const mockAgent2 = new BaseAgent('test2');
      mockAgent2.handleError = jest.fn();

      await orchestrator.registerAgent('agent1', mockAgent1);
      await orchestrator.registerAgent('agent2', mockAgent2);

      await orchestrator.propagateError('agent1', new Error('Test error'), ['agent2']);

      expect(mockAgent2.handleError).toHaveBeenCalled();
    });

    it('should log error events', async () => {
      const mockAgent = new BaseAgent('test');
      const error = new Error('Test error');

      await orchestrator.registerAgent('test-agent', mockAgent);
      await orchestrator.logError('test-agent', error);

      const errors = await orchestrator.getErrorLog('test-agent');
      expect(errors).toContainEqual(expect.objectContaining({
        agentId: 'test-agent',
        error: error.message
      }));
    });
  });

  describe('Performance Optimization', () => {
    it('should batch agent operations', async () => {
      const mockAgent = new BaseAgent('test');
      await orchestrator.registerAgent('test-agent', mockAgent);

      const tasks = Array(5).fill({ type: 'test', data: {} });
      await orchestrator.batchAssignTasks('test-agent', tasks);

      expect(mockPerformanceManager.withBatching).toHaveBeenCalled();
    });

    it('should cache agent responses', async () => {
      const mockAgent = new BaseAgent('test');
      mockAgent.handleTask = jest.fn().mockResolvedValue({ data: 'cached' });

      await orchestrator.registerAgent('test-agent', mockAgent);
      const task = { type: 'test', data: {} };

      // First call
      await orchestrator.assignTask('test-agent', task);
      // Second call with same task
      await orchestrator.assignTask('test-agent', task);

      expect(mockPerformanceManager.withCaching).toHaveBeenCalled();
      expect(mockAgent.handleTask).toHaveBeenCalledTimes(1);
    });

    it('should enforce rate limits', async () => {
      const mockAgent = new BaseAgent('test');
      await orchestrator.registerAgent('test-agent', mockAgent);

      const task = { type: 'test', data: {} };
      await orchestrator.assignTask('test-agent', task);

      expect(mockPerformanceManager.withRateLimit).toHaveBeenCalled();
    });
  });
}); 