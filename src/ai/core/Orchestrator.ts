import { EventEmitter } from 'events';
import { BaseAgent } from './BaseAgent';
import { AgentRegistry, TaskDistribution, AgentMessage, OrchestrationConfig } from '../types/orchestration';
import { AgentConfig, AgentState } from '../types/agents';
import { PerformanceOptimizer } from './PerformanceOptimizer';

export class Orchestrator {
  private static instance: Orchestrator;
  private registry: AgentRegistry;
  private tasks: Map<string, Promise<AgentResponse>>;
  private messageQueue: AgentMessage[];
  private events: EventEmitter;
  private config: OrchestrationConfig;
  private optimizer: PerformanceOptimizer;

  private constructor(config: OrchestrationConfig = {}) {
    this.registry = {
      agents: new Map(),
      configs: new Map(),
      states: new Map()
    };
    this.tasks = new Map();
    this.messageQueue = [];
    this.events = new EventEmitter();
    this.config = {
      maxConcurrentTasks: 5,
      taskTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: true,
      ...config
    };
    this.optimizer = PerformanceOptimizer.getInstance({
      slowOperationThreshold: 5000, // Consider agent operations slow after 5s
      maxConcurrentOperations: 50,
      resourceMonitoringInterval: 30000 // Monitor resources every 30s
    });

    // Forward performance events
    this.optimizer.on('slow_operation', (event) => {
      this.events.emit('slow_agent', event);
    });
    this.optimizer.on('warning', (warning) => {
      this.events.emit('performance_warning', warning);
    });
    this.optimizer.on('resource_usage', (metrics) => {
      this.events.emit('resource_metrics', metrics);
    });
  }

  public static getInstance(config?: OrchestrationConfig): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator(config);
    }
    return Orchestrator.instance;
  }

  public registerAgent<TConfig extends AgentConfig, TState extends AgentState>(
    id: string,
    agent: BaseAgent<TConfig, TState>,
    config: TConfig
  ): void {
    if (this.registry.agents.has(id)) {
      throw new Error(`Agent with id ${id} is already registered`);
    }

    this.registry.agents.set(id, agent);
    this.registry.configs.set(id, config);
    this.registry.states.set(id, agent.getState());

    // Listen for state changes
    agent.on('stateChanged', (newState: TState) => {
      this.registry.states.set(id, newState);
      this.events.emit('agentStateChanged', { agentId: id, state: newState });
    });
  }

  public async distributeTask(task: Omit<TaskDistribution, 'status'>): Promise<void> {
    const taskId = `${task.agentId}-${task.taskId}`;
    const taskDistribution: TaskDistribution = {
      ...task,
      status: 'pending'
    };

    this.tasks.set(taskId, agent.process(task));
    await this.scheduleTask(taskDistribution);
  }

  private async scheduleTask(task: TaskDistribution): Promise<void> {
    const agent = this.registry.agents.get(task.agentId);
    if (!agent) {
      throw new Error(`Agent ${task.agentId} not found`);
    }

    // Check dependencies
    const unmetDependencies = task.dependencies.filter(depId => {
      const dep = this.tasks.get(depId);
      return !dep || dep.status !== 'completed';
    });

    if (unmetDependencies.length > 0) {
      return; // Task will be rescheduled when dependencies complete
    }

    try {
      task.status = 'in-progress';
      const result = await Promise.race([
        agent.process(task),
        this.createTimeout(task.taskId)
      ]);

      task.status = 'completed';
      task.result = result;
      this.events.emit('taskCompleted', task);
    } catch (error) {
      task.status = 'failed';
      task.error = error as Error;
      this.events.emit('taskFailed', task);
    }
  }

  private createTimeout(taskId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out`));
      }, this.config.taskTimeout);
    });
  }

  public async sendMessage(message: Omit<AgentMessage, 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      timestamp: Date.now()
    };

    this.messageQueue.push(fullMessage);
    await this.processMessage(fullMessage);
  }

  private async processMessage(message: AgentMessage): Promise<void> {
    const targetAgent = this.registry.agents.get(message.to);
    if (!targetAgent) {
      throw new Error(`Target agent ${message.to} not found`);
    }

    try {
      const response = await targetAgent.handleMessage(message);
      if (response) {
        await this.sendMessage({
          from: message.to,
          to: message.from,
          type: 'response',
          payload: response,
          correlationId: message.correlationId
        });
      }
    } catch (error) {
      this.events.emit('messageError', { message, error });
    }
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  public getAgentState(agentId: string): AgentState | undefined {
    return this.registry.states.get(agentId);
  }

  public getTaskStatus(taskId: string): TaskDistribution | undefined {
    return this.tasks.get(taskId);
  }

  public async cleanup(): Promise<void> {
    const operationId = this.optimizer.startOperation('cleanup');
    try {
      const cleanupPromises = Array.from(this.registry.agents.values())
        .map(agent => agent.cleanup());
      
      await Promise.all(cleanupPromises);
      this.registry.agents.clear();
      this.registry.configs.clear();
      this.registry.states.clear();
      this.tasks.clear();
      this.messageQueue = [];
      this.events.removeAllListeners();
      await this.optimizer.shutdown();
      this.optimizer.endOperation('cleanup', operationId);
    } catch (error) {
      this.optimizer.endOperation('cleanup', operationId, error);
      throw error;
    }
  }

  public getPerformanceMetrics() {
    return this.optimizer.getMetrics();
  }
} 