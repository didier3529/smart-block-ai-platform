import { ModelConfig, ModelProvider, ModelRequestConfig, ModelResponse, ModelError } from '../types/models';

export abstract class BaseModelProvider implements ModelProvider {
  protected config: ModelConfig;
  protected isReady: boolean = false;
  protected retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  constructor(config: ModelConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 30000,
      ...config
    };
  }

  public abstract initialize(config: ModelConfig): Promise<void>;
  
  public abstract complete(prompt: string, config: ModelRequestConfig): Promise<ModelResponse>;

  public isInitialized(): boolean {
    return this.isReady;
  }

  public async cleanup(): Promise<void> {
    this.isReady = false;
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const modelError = this.normalizeError(error);
      
      if (!modelError.retryable || retryCount >= (this.config.maxRetries || 3)) {
        throw modelError;
      }

      const delay = this.retryDelays[retryCount] || this.retryDelays[this.retryDelays.length - 1];
      await this.sleep(delay);
      
      return this.withRetry(operation, retryCount + 1);
    }
  }

  protected normalizeError(error: any): ModelError {
    if (error?.code && error?.message) {
      return error as ModelError;
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred',
      details: error,
      retryable: this.isRetryableError(error)
    };
  }

  protected isRetryableError(error: any): boolean {
    // Common retryable error patterns
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableErrorCodes = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'RATE_LIMIT_EXCEEDED'
    ];

    return (
      retryableStatusCodes.includes(error?.status || error?.statusCode) ||
      retryableErrorCodes.includes(error?.code) ||
      error?.message?.toLowerCase().includes('timeout') ||
      error?.message?.toLowerCase().includes('rate limit')
    );
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected validateConfig(config: ModelConfig): void {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
  }

  protected validateRequestConfig(config: ModelRequestConfig): void {
    if (!config.model) {
      throw new Error('Model name is required');
    }
  }
} 