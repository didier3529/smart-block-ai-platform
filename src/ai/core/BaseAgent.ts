import { AgentConfig, AgentState, AgentResponse, AgentError } from '../types';
import { PromptManager } from './PromptManager';
import { PromptVariables, PromptConfig } from '../types/prompts';
import { AgentMessage, TaskDistribution } from '../types/orchestration';
import { EventEmitter } from 'events';
import { PerformanceManager } from './PerformanceManager';

export abstract class BaseAgent<TConfig extends AgentConfig, TState extends AgentState> {
  protected config: TConfig;
  protected state: TState;
  protected events: EventEmitter;
  protected isInitialized: boolean = false;
  protected promptManager: PromptManager;
  protected performanceManager: PerformanceManager;

  constructor(config: TConfig, initialState: TState, promptManager: PromptManager) {
    this.config = config;
    this.state = initialState;
    this.events = new EventEmitter();
    this.promptManager = promptManager;
    this.performanceManager = PerformanceManager.getInstance();
  }

  public abstract initialize(): Promise<void>;
  
  protected abstract processTask(task: TaskDistribution): Promise<AgentResponse>;

  protected async renderPrompt(
    templateId: string,
    variables: PromptVariables,
    config?: PromptConfig
  ): Promise<string> {
    try {
      return await this.promptManager.render(templateId, variables);
    } catch (error) {
      throw new AgentError(
        `Failed to render prompt template: ${error.message}`,
        'PROMPT_RENDER_ERROR',
        error
      );
    }
  }

  public async process(task: TaskDistribution): Promise<AgentResponse> {
    if (!this.isInitialized) {
      throw new Error('Agent not initialized');
    }

    try {
      // Check rate limits
      const canProcess = await this.performanceManager.checkRateLimit(
        this.config.id,
        {
          maxRequests: this.config.maxRequestsPerMinute || 60,
          windowMs: 60000 // 1 minute
        }
      );

      if (!canProcess) {
        throw new AgentError('Rate limit exceeded', 'RATE_LIMIT_ERROR');
      }

      // Try to get cached response
      const cacheKey = this.getCacheKey(task);
      const cachedResponse = await this.performanceManager.getCachedResponse<AgentResponse>(cacheKey);
      
      if (cachedResponse) {
        this.events.emit('taskCompleted', { taskId: task.taskId, response: cachedResponse, cached: true });
        return cachedResponse;
      }

      // Batch similar requests
      const response = await this.performanceManager.batchRequest(
        this.config.id,
        task.message,
        this.config.batchWindow || 100
      );

      // Cache the response
      if (this.config.enableResponseCaching !== false) {
        this.performanceManager.setCachedResponse(cacheKey, response);
      }

      this.events.emit('taskCompleted', { taskId: task.taskId, response });
      return response;
    } catch (error) {
      const agentError: AgentError = {
        code: error.code || 'TASK_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
      this.events.emit('taskError', { taskId: task.taskId, error: agentError });
      throw agentError;
    }
  }

  protected getCacheKey(task: TaskDistribution): string {
    return JSON.stringify({
      type: task.message.type,
      data: task.message.data,
      agentId: this.config.id
    });
  }

  public async handleMessage(message: AgentMessage): Promise<any> {
    // Default implementation - can be overridden by specific agents
    this.events.emit('messageReceived', message);
    return null;
  }

  public getState(): TState {
    return this.state;
  }

  public getConfig(): TConfig {
    return { ...this.config };
  }

  protected setState(newState: Partial<TState>): void {
    this.state = { ...this.state, ...newState };
    this.events.emit('stateChanged', this.state);
  }

  protected updateConfig(newConfig: Partial<TConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
    this.events.emit('configUpdate', this.config);
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }

  public async cleanup(): Promise<void> {
    // Cleanup base resources
    this.events.removeAllListeners();
    
    // Allow derived classes to perform their cleanup
    if (this.onCleanup) {
      await this.onCleanup();
    }
  }

  protected abstract onCleanup?(): Promise<void>;
  protected abstract processMessage(message: AgentMessage): Promise<AgentResponse>;
} 