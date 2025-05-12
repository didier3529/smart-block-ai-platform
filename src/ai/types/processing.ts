import { AgentResponse, AgentError } from './agents';

export interface ProcessingStep<T = any, R = any> {
  name: string;
  process: (input: T) => Promise<R>;
  validate?: (input: T) => Promise<boolean>;
  onError?: (error: Error, input: T) => Promise<void>;
}

export interface ProcessingPipeline<T = any> {
  steps: ProcessingStep[];
  onComplete?: (result: T) => Promise<void>;
  onError?: (error: Error, step: ProcessingStep) => Promise<void>;
}

export interface ResponseValidationRule {
  name: string;
  validate: (response: AgentResponse) => Promise<boolean>;
  errorMessage: string;
  severity: 'error' | 'warning';
}

export interface ProcessedResponse extends AgentResponse {
  validations: {
    rule: string;
    passed: boolean;
    message?: string;
    severity?: 'error' | 'warning';
  }[];
  metadata: {
    processingTime: number;
    pipeline: string[];
    retryCount?: number;
    [key: string]: any;
  };
}

export interface ProcessingConfig {
  maxRetries?: number;
  retryDelay?: number;
  validationRules?: ResponseValidationRule[];
  enableCache?: boolean;
  cacheTimeout?: number;
  formatters?: {
    [key: string]: (input: any) => Promise<any>;
  };
} 