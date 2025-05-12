import { EventEmitter } from 'events';
import {
  IAgent,
  AgentConfig,
  AgentState,
  AgentStatus,
  AgentError,
  AgentEvent,
  AgentEventType,
  AgentMessage,
  ModelResponse
} from '../types';
import { generateId } from '../utils/id';
import { sleep } from '../utils/time';

export class Agent extends EventEmitter implements IAgent {
  readonly id: string;
  readonly config: AgentConfig;
  protected _state: AgentState;

  constructor(config: AgentConfig) {
    super();
    this.id = config.id;
    this.config = {
      ...config,
      maxRetries: config.maxRetries ?? 3,
      timeoutMs: config.timeoutMs ?? 30000
    };

    this._state = {
      id: this.id,
      status: 'idle',
      memory: {},
      errors: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        tokenUsage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      }
    };
  }

  get state(): AgentState {
    return { ...this._state };
  }

  protected setState(status: AgentStatus, currentTask?: string): void {
    this._state = {
      ...this._state,
      status,
      currentTask
    };

    this.emitEvent('stateChanged', { status, currentTask });
  }

  protected addError(error: AgentError): void {
    this._state.errors.push(error);
    this.emitEvent('error', error);
  }

  protected updateMetrics(response: ModelResponse, responseTime: number): void {
    const { metrics } = this._state;
    metrics.totalRequests++;
    metrics.successfulRequests++;
    
    // Update average response time
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;

    // Update token usage
    metrics.tokenUsage.prompt += response.usage.promptTokens;
    metrics.tokenUsage.completion += response.usage.completionTokens;
    metrics.tokenUsage.total += response.usage.totalTokens;
  }

  protected emitEvent(type: AgentEventType, data?: Record<string, any>): void {
    const event: AgentEvent = {
      type,
      agentId: this.id,
      timestamp: Date.now(),
      data
    };
    this.emit(type, event);
  }

  protected emitMessage(message: AgentMessage): void {
    this.emit('message', message);
    this.emitEvent(
      message.type === 'input' ? 'messageReceived' : 'messageSent',
      { messageId: message.id }
    );
  }

  protected async retry<T>(
    operation: () => Promise<T>,
    retries = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) {
          throw error;
        }

        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await sleep(delayMs);
      }
    }

    throw lastError!;
  }

  async initialize(): Promise<void> {
    try {
      this.setState('initializing');
      // Initialization logic will be implemented by derived classes
      this.setState('idle');
      this.emitEvent('initialized');
    } catch (error) {
      const agentError: AgentError = {
        code: 'INIT_FAILED',
        message: (error as Error).message,
        timestamp: Date.now()
      };
      this.addError(agentError);
      this.setState('error');
      throw error;
    }
  }

  async process(input: string): Promise<string> {
    try {
      this.setState('processing', input);

      const inputMessage: AgentMessage = {
        id: generateId(),
        type: 'input',
        content: input,
        timestamp: Date.now()
      };
      this.emitMessage(inputMessage);

      // Processing logic will be implemented by derived classes
      const result = 'Not implemented';

      const outputMessage: AgentMessage = {
        id: generateId(),
        type: 'output',
        content: result,
        timestamp: Date.now()
      };
      this.emitMessage(outputMessage);

      this.setState('idle');
      return result;
    } catch (error) {
      const agentError: AgentError = {
        code: 'PROCESS_FAILED',
        message: (error as Error).message,
        timestamp: Date.now()
      };
      this.addError(agentError);
      this.setState('error');
      throw error;
    }
  }

  getState(): AgentState {
    return this.state;
  }

  async terminate(): Promise<void> {
    try {
      this.setState('terminated');
      this.removeAllListeners();
    } catch (error) {
      const agentError: AgentError = {
        code: 'TERMINATE_FAILED',
        message: (error as Error).message,
        timestamp: Date.now()
      };
      this.addError(agentError);
      throw error;
    }
  }
} 