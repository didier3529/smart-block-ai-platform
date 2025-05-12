import { EventEmitter } from 'events';
import { AgentResponse, AgentError } from '../types/agents';
import {
  ProcessingStep,
  ProcessingPipeline,
  ResponseValidationRule,
  ProcessedResponse,
  ProcessingConfig
} from '../types/processing';
import { PerformanceOptimizer } from './PerformanceOptimizer';

export class ResponseProcessor {
  private static instance: ResponseProcessor;
  private config: ProcessingConfig;
  private events: EventEmitter;
  private cache: Map<string, { response: ProcessedResponse; timestamp: number }>;
  private optimizer: PerformanceOptimizer;

  private constructor(config: ProcessingConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      validationRules: [],
      enableCache: true,
      cacheTimeout: 300000, // 5 minutes
      formatters: {},
      ...config
    };
    this.events = new EventEmitter();
    this.cache = new Map();
    this.optimizer = PerformanceOptimizer.getInstance({
      slowOperationThreshold: 2000, // Consider response processing slow after 2s
      maxConcurrentOperations: 20
    });

    // Forward performance events
    this.optimizer.on('slow_operation', (event) => {
      this.events.emit('slow_processing', event);
    });
    this.optimizer.on('warning', (warning) => {
      this.events.emit('performance_warning', warning);
    });
  }

  public static getInstance(config?: ProcessingConfig): ResponseProcessor {
    if (!ResponseProcessor.instance) {
      ResponseProcessor.instance = new ResponseProcessor(config);
    }
    return ResponseProcessor.instance;
  }

  public async processResponse(
    response: AgentResponse,
    pipeline: ProcessingPipeline
  ): Promise<ProcessedResponse> {
    const operationId = this.optimizer.startOperation('process_response', {
      pipelineSteps: pipeline.steps.length,
      responseType: response.type
    });

    try {
      const startTime = Date.now();
      const cacheKey = this.getCacheKey(response, pipeline);

      if (this.config.enableCache) {
        const cached = this.getCachedResponse(cacheKey);
        if (cached) {
          this.optimizer.endOperation('process_response', operationId);
          return cached;
        }
      }

      let currentValue: any = response;
      const processedSteps: string[] = [];

      for (const step of pipeline.steps) {
        const stepId = this.optimizer.startOperation(`step_${step.name}`);
        this.events.emit('stepStart', { step: step.name, input: currentValue });

        try {
          if (step.validate) {
            const isValid = await step.validate(currentValue);
            if (!isValid) {
              throw new Error(`Validation failed at step: ${step.name}`);
            }
          }

          currentValue = await step.process(currentValue);
          processedSteps.push(step.name);
          this.events.emit('stepComplete', { step: step.name, output: currentValue });
          this.optimizer.endOperation(`step_${step.name}`, stepId);
        } catch (error) {
          this.optimizer.endOperation(`step_${step.name}`, stepId, error);
          if (step.onError) {
            await step.onError(error, currentValue);
          }
          throw error;
        }
      }

      const validationResults = await this.validateResponse(currentValue as AgentResponse);
      const processedResponse: ProcessedResponse = {
        ...(currentValue as AgentResponse),
        validations: validationResults,
        metadata: {
          processingTime: Date.now() - startTime,
          pipeline: processedSteps
        }
      };

      if (pipeline.onComplete) {
        await pipeline.onComplete(processedResponse);
      }

      if (this.config.enableCache) {
        this.cacheResponse(cacheKey, processedResponse);
      }

      this.optimizer.endOperation('process_response', operationId);
      return processedResponse;
    } catch (error) {
      this.optimizer.endOperation('process_response', operationId, error);
      if (pipeline.onError) {
        await pipeline.onError(error, pipeline.steps[processedSteps.length]);
      }
      throw new AgentError(
        `Processing pipeline failed: ${error.message}`,
        'PROCESSING_ERROR',
        error
      );
    }
  }

  private async validateResponse(
    response: AgentResponse
  ): Promise<ProcessedResponse['validations']> {
    const operationId = this.optimizer.startOperation('validate_response');
    const validations = [];

    try {
      for (const rule of this.config.validationRules || []) {
        const ruleId = this.optimizer.startOperation(`validation_rule_${rule.name}`);
        try {
          const passed = await rule.validate(response);
          validations.push({
            rule: rule.name,
            passed,
            message: passed ? undefined : rule.errorMessage,
            severity: rule.severity
          });
          this.optimizer.endOperation(`validation_rule_${rule.name}`, ruleId);
        } catch (error) {
          this.optimizer.endOperation(`validation_rule_${rule.name}`, ruleId, error);
          validations.push({
            rule: rule.name,
            passed: false,
            message: `Validation error: ${error.message}`,
            severity: 'error'
          });
        }
      }

      this.optimizer.endOperation('validate_response', operationId);
      return validations;
    } catch (error) {
      this.optimizer.endOperation('validate_response', operationId, error);
      throw error;
    }
  }

  private getCacheKey(response: AgentResponse, pipeline: ProcessingPipeline): string {
    return JSON.stringify({
      response: response,
      steps: pipeline.steps.map(step => step.name)
    });
  }

  private getCachedResponse(key: string): ProcessedResponse | null {
    const operationId = this.optimizer.startOperation('cache_lookup');
    try {
      const cached = this.cache.get(key);
      if (!cached) {
        this.optimizer.endOperation('cache_lookup', operationId);
        return null;
      }

      if (Date.now() - cached.timestamp > this.config.cacheTimeout!) {
        this.cache.delete(key);
        this.optimizer.endOperation('cache_lookup', operationId);
        return null;
      }

      this.optimizer.endOperation('cache_lookup', operationId);
      return cached.response;
    } catch (error) {
      this.optimizer.endOperation('cache_lookup', operationId, error);
      throw error;
    }
  }

  private cacheResponse(key: string, response: ProcessedResponse): void {
    const operationId = this.optimizer.startOperation('cache_store');
    try {
      this.cache.set(key, {
        response,
        timestamp: Date.now()
      });
      this.optimizer.endOperation('cache_store', operationId);
    } catch (error) {
      this.optimizer.endOperation('cache_store', operationId, error);
      throw error;
    }
  }

  public addValidationRule(rule: ResponseValidationRule): void {
    this.config.validationRules = [...(this.config.validationRules || []), rule];
  }

  public addFormatter(name: string, formatter: (input: any) => Promise<any>): void {
    this.config.formatters = {
      ...(this.config.formatters || {}),
      [name]: formatter
    };
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  public clearCache(): void {
    const operationId = this.optimizer.startOperation('clear_cache');
    try {
      this.cache.clear();
      this.optimizer.endOperation('clear_cache', operationId);
    } catch (error) {
      this.optimizer.endOperation('clear_cache', operationId, error);
      throw error;
    }
  }

  public async cleanup(): Promise<void> {
    const operationId = this.optimizer.startOperation('cleanup');
    try {
      this.events.removeAllListeners();
      this.clearCache();
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