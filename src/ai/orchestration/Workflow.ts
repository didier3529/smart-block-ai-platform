import { EventEmitter } from 'events';
import {
  AgentWorkflow,
  WorkflowStep,
  WorkflowConfig,
  WorkflowEvent,
  WorkflowStatus,
  WorkflowStepResult
} from '../types';
import { generateId } from '../utils/id';

export class Workflow extends EventEmitter implements AgentWorkflow {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly steps: WorkflowStep[];
  readonly config: WorkflowConfig;

  private _status: WorkflowStatus = 'pending';
  private _results: Map<string, WorkflowStepResult> = new Map();
  private _startTime?: number;
  private _endTime?: number;
  private _error?: Error;

  constructor(params: {
    name: string;
    description?: string;
    steps: WorkflowStep[];
    config?: Partial<WorkflowConfig>;
  }) {
    super();
    this.id = generateId('workflow');
    this.name = params.name;
    this.description = params.description;
    this.steps = this.validateSteps(params.steps);
    this.config = {
      parallel: false,
      maxConcurrent: 5,
      stopOnError: true,
      timeout: 300000, // 5 minutes default
      retryConfig: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2
      },
      ...params.config
    };
  }

  get status(): WorkflowStatus {
    return this._status;
  }

  get startTime(): number | undefined {
    return this._startTime;
  }

  get endTime(): number | undefined {
    return this._endTime;
  }

  get error(): Error | undefined {
    return this._error;
  }

  get results(): ReadonlyMap<string, WorkflowStepResult> {
    return this._results;
  }

  private validateSteps(steps: WorkflowStep[]): WorkflowStep[] {
    if (!steps.length) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate step IDs are unique
    const ids = new Set<string>();
    steps.forEach(step => {
      if (ids.has(step.id)) {
        throw new Error(`Duplicate step ID found: ${step.id}`);
      }
      ids.add(step.id);
    });

    // Validate dependencies exist
    steps.forEach(step => {
      if (step.dependsOn) {
        step.dependsOn.forEach(depId => {
          if (!ids.has(depId)) {
            throw new Error(
              `Step ${step.id} depends on non-existent step ${depId}`
            );
          }
        });
      }
    });

    // Check for circular dependencies
    this.checkCircularDependencies(steps);

    return steps;
  }

  private checkCircularDependencies(steps: WorkflowStep[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      if (!visited.has(stepId)) {
        visited.add(stepId);
        recursionStack.add(stepId);

        const step = steps.find(s => s.id === stepId);
        if (step?.dependsOn) {
          for (const depId of step.dependsOn) {
            if (
              !visited.has(depId) && hasCycle(depId) ||
              recursionStack.has(depId)
            ) {
              return true;
            }
          }
        }
      }
      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (hasCycle(step.id)) {
        throw new Error(`Circular dependency detected in workflow steps`);
      }
    }
  }

  setStepResult(stepId: string, result: WorkflowStepResult): void {
    if (!this.steps.some(step => step.id === stepId)) {
      throw new Error(`Invalid step ID: ${stepId}`);
    }
    this._results.set(stepId, result);
    this.emit('stepCompleted', { stepId, result });
  }

  updateStatus(status: WorkflowStatus, error?: Error): void {
    this._status = status;
    if (error) {
      this._error = error;
    }

    if (status === 'running' && !this._startTime) {
      this._startTime = Date.now();
    } else if (['completed', 'failed', 'cancelled'].includes(status)) {
      this._endTime = Date.now();
    }

    const event: WorkflowEvent = {
      workflowId: this.id,
      status,
      timestamp: Date.now(),
      error
    };

    this.emit('statusChanged', event);
  }

  reset(): void {
    this._status = 'pending';
    this._results.clear();
    this._startTime = undefined;
    this._endTime = undefined;
    this._error = undefined;
    this.emit('reset', { workflowId: this.id, timestamp: Date.now() });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this._status,
      steps: this.steps,
      config: this.config,
      results: Array.from(this._results.entries()),
      startTime: this._startTime,
      endTime: this._endTime,
      error: this._error?.message
    };
  }
} 