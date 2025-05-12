import { BaseError, Result } from '@/types/common';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  version: string;
  metadata?: Record<string, unknown>;
}

export interface PromptVariables {
  [key: string]: string | number | boolean | object;
}

export interface PromptConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface PromptResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export class PromptError extends Error implements BaseError {
  readonly type = 'prompt-error';
  readonly timestamp: number;

  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PromptError';
    this.timestamp = Date.now();
  }
}

export type PromptExecutionResult = Result<PromptResult, PromptError>;

export type PromptFunction = (
  variables: PromptVariables,
  config?: PromptConfig
) => Promise<PromptExecutionResult>;

export interface PromptRepository {
  get(id: string): Promise<Result<PromptTemplate | null, PromptError>>;
  list(): Promise<Result<PromptTemplate[], PromptError>>;
  add(template: PromptTemplate): Promise<Result<void, PromptError>>;
  update(id: string, template: Partial<PromptTemplate>): Promise<Result<void, PromptError>>;
  delete(id: string): Promise<Result<void, PromptError>>;
} 