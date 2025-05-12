import { EventEmitter } from 'events';
import {
  IOrchestrator,
  IAgent,
  AgentWorkflow,
  WorkflowStep,
  OrchestratorConfig,
  AgentEvent,
  AgentEventType
} from '../types';
import { withTimeout, measureTime } from '../utils/time';

export class Orchestrator extends EventEmitter implements IOrchestrator {
  private agents: Map<string, IAgent>;
  private config: OrchestratorConfig;
  private activeWorkflows: Map<string, AgentWorkflow>;
  private workflowStatus: Map<string, Map<string, boolean>>;
  private performanceMetrics: {
    stepExecutionTimes: Map<string, number[]>;
    agentInitTimes: Map<string, number[]>;
    lastGcTime?: number;
  };

  constructor(config: OrchestratorConfig) {
    super();
    this.agents = new Map();
    this.activeWorkflows = new Map();
    this.workflowStatus = new Map();
    this.performanceMetrics = {
      stepExecutionTimes: new Map(),
      agentInitTimes: new Map()
    };
    
    this.config = {
      maxConcurrentAgents: config.maxConcurrentAgents ?? 2, // Reduced from 3
      defaultTimeout: config.defaultTimeout ?? 120000,
      retryStrategy: {
        maxAttempts: 2,
        initialDelayMs: 2000,
        maxDelayMs: 20000,
        backoffMultiplier: 1.5,
        ...config.retryStrategy
      }
    };

    // Reduced frequency of health checks
    setInterval(() => {
      this.checkHealth();
    }, 300000); // Changed from 60000 (1 minute) to 300000 (5 minutes)

    // Add performance monitoring
    setInterval(() => {
      this.monitorPerformance();
    }, 120000); // Every 2 minutes
  }

  private async monitorPerformance(): Promise<void> {
    const metrics = {
      activeWorkflows: this.activeWorkflows.size,
      queuedSteps: Array.from(this.activeWorkflows.values())
        .reduce((acc, wf) => acc + wf.steps.length, 0),
      averageStepTime: this.calculateAverageStepTime(),
      memoryUsage: process.memoryUsage(),
      timestamp: Date.now()
    };

    // Emit performance metrics
    this.emit('performance:metrics', metrics);

    // Check for memory issues
    if (metrics.memoryUsage.heapUsed > 500 * 1024 * 1024) { // Over 500MB
      this.emit('performance:warning', {
        type: 'high-memory-usage',
        ...metrics
      });
    }
  }

  private calculateAverageStepTime(): number {
    let totalTime = 0;
    let count = 0;

    this.performanceMetrics.stepExecutionTimes.forEach(times => {
      times.forEach(time => {
        totalTime += time;
        count++;
      });
    });

    return count > 0 ? totalTime / count : 0;
  }

  private checkHealth(): void {
    const now = Date.now();
    this.activeWorkflows.forEach((workflow, id) => {
      const status = this.workflowStatus.get(id);
      if (status && workflow.startTime && (now - workflow.startTime) > this.config.defaultTimeout) {
        this.emit('healthCheck:warning', {
          workflowId: id,
          message: 'Workflow potentially stuck',
          duration: now - workflow.startTime,
          timestamp: now
        });
      }
    });
  }

  registerAgent(agent: IAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} is already registered`);
    }

    // Subscribe to agent events
    const eventHandler = (event: AgentEvent) => {
      this.handleAgentEvent(event);
    };

    const eventTypes: AgentEventType[] = [
      'initialized',
      'started',
      'completed',
      'error',
      'stateChanged',
      'messageReceived',
      'messageSent'
    ];

    eventTypes.forEach(type => {
      agent.on(type, eventHandler);
    });

    this.agents.set(agent.id, agent);
  }

  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} is not registered`);
    }

    // Clean up event listeners
    agent.removeAllListeners();
    this.agents.delete(agentId);
  }

  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  async executeWorkflow(workflow: AgentWorkflow): Promise<void> {
    if (this.activeWorkflows.has(workflow.id)) {
      throw new Error(`Workflow ${workflow.id} is already running`);
    }

    workflow.startTime = Date.now(); // Add start time
    this.activeWorkflows.set(workflow.id, workflow);
    this.workflowStatus.set(workflow.id, new Map());

    try {
      if (workflow.config?.parallel) {
        await this.executeParallelWorkflow(workflow);
      } else {
        await this.executeSequentialWorkflow(workflow);
      }
    } finally {
      this.activeWorkflows.delete(workflow.id);
      this.workflowStatus.delete(workflow.id);
    }
  }

  private async executeSequentialWorkflow(workflow: AgentWorkflow): Promise<void> {
    const { steps } = workflow;

    for (const step of steps) {
      await this.executeWorkflowStep(workflow.id, step);
    }
  }

  private async executeParallelWorkflow(workflow: AgentWorkflow): Promise<void> {
    const { steps, config } = workflow;
    const maxConcurrent = config?.maxConcurrent ?? this.config.maxConcurrentAgents;
    const stepGroups: WorkflowStep[][] = [];

    // Group steps by dependencies
    const remainingSteps = [...steps];
    while (remainingSteps.length > 0) {
      const executableSteps = remainingSteps.filter(step =>
        this.canExecuteStep(workflow.id, step)
      );

      if (executableSteps.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }

      // Take up to maxConcurrent steps
      const currentGroup = executableSteps.slice(0, maxConcurrent);
      stepGroups.push(currentGroup);

      // Remove executed steps from remaining
      currentGroup.forEach(step => {
        const index = remainingSteps.findIndex(s => s.id === step.id);
        if (index !== -1) {
          remainingSteps.splice(index, 1);
        }
      });
    }

    // Execute each group in parallel
    for (const group of stepGroups) {
      await Promise.all(
        group.map(step => this.executeWorkflowStep(workflow.id, step))
      );
    }
  }

  private async executeWorkflowStep(
    workflowId: string,
    step: WorkflowStep
  ): Promise<void> {
    const agent = this.getAgent(step.agentId);
    if (!agent) {
      throw new Error(`Agent ${step.agentId} not found for workflow step ${step.id}`);
    }

    if (!this.canExecuteStep(workflowId, step)) {
      throw new Error(
        `Cannot execute step ${step.id}: dependencies not satisfied`
      );
    }

    const input = typeof step.input === 'function' ? step.input() : step.input;
    const stepStartTime = Date.now();

    try {
      const operation = async () => {
        const [initResult, initTime] = await measureTime(async () => {
          await agent.initialize();
        });

        // Track initialization time
        const initTimes = this.performanceMetrics.agentInitTimes.get(agent.id) || [];
        initTimes.push(initTime);
        this.performanceMetrics.agentInitTimes.set(agent.id, initTimes.slice(-10)); // Keep last 10

        const [processResult] = await measureTime(async () => {
          return await agent.process(input ?? '');
        });

        return processResult;
      };

      await withTimeout(
        operation,
        step.timeout ?? this.config.defaultTimeout,
        `Step ${step.id} timed out`
      );

      // Track step execution time
      const stepTime = Date.now() - stepStartTime;
      const times = this.performanceMetrics.stepExecutionTimes.get(step.id) || [];
      times.push(stepTime);
      this.performanceMetrics.stepExecutionTimes.set(step.id, times.slice(-10)); // Keep last 10

      this.markStepComplete(workflowId, step.id);
    } catch (error) {
      // Track failed step time too
      const stepTime = Date.now() - stepStartTime;
      const times = this.performanceMetrics.stepExecutionTimes.get(step.id) || [];
      times.push(stepTime);
      this.performanceMetrics.stepExecutionTimes.set(step.id, times.slice(-10));

      this.emit('error', {
        workflowId,
        stepId: step.id,
        agentId: step.agentId,
        error,
        executionTime: stepTime
      });
      throw error;
    }
  }

  private canExecuteStep(workflowId: string, step: WorkflowStep): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }

    const status = this.workflowStatus.get(workflowId);
    if (!status) {
      return false;
    }

    return step.dependsOn.every(depId => status.get(depId));
  }

  private markStepComplete(workflowId: string, stepId: string): void {
    const status = this.workflowStatus.get(workflowId);
    if (status) {
      status.set(stepId, true);
    }
  }

  private handleAgentEvent(event: AgentEvent): void {
    // Forward agent events with additional context
    this.emit('agent:' + event.type, {
      ...event,
      timestamp: Date.now()
    });
  }
} 