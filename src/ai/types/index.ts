/**
 * Core type definitions for the AI agent system
 */

import { BaseError, Result } from '@/types/common';

// Agent Configuration
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  modelConfig: ModelConfig;
  maxRetries?: number;
  timeoutMs?: number;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  walletAddress?: string;
  apiKey?: string;
}

// Model Configuration
export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'perplexity';
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  apiKey?: string;
}

// Agent State
export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  memory: Record<string, any>;
  errors: AgentError[];
  metrics: AgentMetrics;
  lastUpdated: string;
}

// Agent Status
export type AgentStatus = 'idle' | 'initializing' | 'ready' | 'processing' | 'error';

// Agent Error interface
export interface IAgentError extends BaseError {
  originalError?: unknown;
  retryable?: boolean;
}

// Error class implementation
export class AgentError extends Error implements IAgentError {
  public code: string;
  public details?: Record<string, unknown>;
  public timestamp: number;
  public retryable: boolean;

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    this.retryable = false; // Default to non-retryable
  }

  setRetryable(retryable: boolean): this {
    this.retryable = retryable;
    return this;
  }
}

// Model Error interface
export interface IModelError extends BaseError {
  retryable: boolean;
}

// Agent Metrics
export interface AgentMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// Agent Message
export interface AgentMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Orchestrator Configuration
export interface OrchestratorConfig {
  maxConcurrentAgents: number;
  defaultTimeout: number;
  retryStrategy: RetryStrategy;
}

// Retry Strategy
export interface RetryStrategy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// Prompt Template
export interface PromptTemplate {
  id: string;
  version: string;
  template: string;
  variables: string[];
  description?: string;
  category?: string;
  tags?: string[];
}

// Model Response
export interface ModelResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

// Event System
export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  timestamp: number;
  data?: Record<string, any>;
}

export type AgentEventType =
  | 'initialized'
  | 'started'
  | 'completed'
  | 'error'
  | 'stateChanged'
  | 'messageReceived'
  | 'messageSent';

// Base interfaces for core components
export interface IAgent {
  readonly id: string;
  readonly config: AgentConfig;
  readonly state: AgentState;
  
  initialize(): Promise<void>;
  process(input: string): Promise<string>;
  getState(): AgentState;
  terminate(): Promise<void>;
  on(event: AgentEventType, listener: (event: AgentEvent) => void): void;
  removeAllListeners(): void;
}

export interface IOrchestrator {
  registerAgent(agent: IAgent): void;
  unregisterAgent(agentId: string): void;
  getAgent(agentId: string): IAgent | undefined;
  executeWorkflow(workflow: AgentWorkflow): Promise<void>;
}

export interface IPromptManager {
  getTemplate(id: string, version?: string): PromptTemplate;
  registerTemplate(template: PromptTemplate): void;
  renderPrompt(templateId: string, variables: Record<string, any>): string;
}

export interface IModelConnector {
  initialize(): Promise<void>;
  complete(prompt: string, config?: Partial<ModelConfig>): Promise<ModelResponse>;
  terminate(): Promise<void>;
}

// Workflow System
export interface WorkflowConfig {
  parallel: boolean;
  maxConcurrent: number;
  stopOnError: boolean;
  timeout: number;
  retryConfig: RetryStrategy;
}

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowEvent {
  workflowId: string;
  status: WorkflowStatus;
  timestamp: number;
  error?: Error;
}

export interface WorkflowStepResult {
  output: string;
  error?: Error;
  startTime: number;
  endTime: number;
  metrics?: AgentMetrics;
}

// Task Queue System
export interface TaskQueueConfig {
  maxConcurrent: number;
  queueTimeout: number;
  retryFailedTasks: boolean;
  maxRetries: number;
}

export type TaskQueueEventType =
  | 'workflowQueued'
  | 'workflowDequeued'
  | 'workflowStarted'
  | 'workflowCompleted'
  | 'workflowFailed'
  | 'workflowRetrying'
  | 'queuePaused'
  | 'queueResumed'
  | 'queueCleared';

export interface TaskQueueEvent {
  type: TaskQueueEventType;
  workflowId?: string;
  timestamp: number;
  queuePosition?: number;
  error?: Error;
  retryCount?: number;
  remainingTasks?: number;
  runningTasks?: number;
  results?: ReadonlyMap<string, WorkflowStepResult>;
}

// Workflow definitions
export interface AgentWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  config: WorkflowConfig;
  status: WorkflowStatus;
  results: ReadonlyMap<string, WorkflowStepResult>;
  execute(): Promise<void>;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  input?: string | (() => string);
  dependsOn?: string[];
  timeout?: number;
  retryStrategy?: RetryStrategy;
}

export type AgentType = 'portfolio-analyst' | 'trend-spotter' | 'contract-analyzer' | 'nft-advisor';

export interface AgentResponse {
  type: string;
  content: any;
  timestamp: string;
}

export interface TokenHolding {
  token: string;
  amount: string;
  symbol: string;
  decimals: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

export interface PriceData {
  timestamp: number;
  price: number;
}

export interface GasEstimate {
  slow: string;
  medium: string;
  fast: string;
}

// AI-specific error types
export class AgentInitializationError extends Error implements BaseError {
  readonly type = 'agent-initialization-error';
  readonly timestamp: number;

  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentInitializationError';
    this.timestamp = Date.now();
    this.retryable = true;
  }
}

export class AgentExecutionError extends Error implements BaseError {
  readonly type = 'agent-execution-error';
  readonly timestamp: number;

  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'AgentExecutionError';
    this.timestamp = Date.now();
  }
}

export class ModelError extends Error implements BaseError {
  readonly type = 'model-error';
  readonly timestamp: number;

  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ModelError';
    this.timestamp = Date.now();
  }
}

// Result types for AI operations
export type AgentResult<T> = Result<T, AgentExecutionError>;
export type ModelResult<T> = Result<T, ModelError>;
export type InitializationResult = Result<void, AgentInitializationError>;

// Helper functions for AI error handling
export function handleAgentError(error: unknown): AgentExecutionError {
  if (error instanceof AgentExecutionError) {
    return error;
  }
  return new AgentExecutionError(
    'UNKNOWN_ERROR',
    error instanceof Error ? error.message : 'An unknown error occurred',
    { originalError: error }
  );
}

export function handleModelError(error: unknown): ModelError {
  if (error instanceof ModelError) {
    return error;
  }
  return new ModelError(
    'MODEL_ERROR',
    error instanceof Error ? error.message : 'A model error occurred',
    { originalError: error }
  );
} 