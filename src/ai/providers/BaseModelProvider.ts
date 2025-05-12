import { ModelConfig, ModelResponse, ModelProvider } from '../types/models';

export abstract class BaseModelProvider implements ModelProvider {
  protected config: ModelConfig;
  protected retryCount: number = 3;
  protected retryDelay: number = 1000; // ms

  constructor(config: ModelConfig) {
    this.config = this.validateConfig(config);
  }

  abstract initialize(): Promise<void>;
  abstract complete(prompt: string): Promise<ModelResponse>;
  abstract cleanup(): Promise<void>;

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.retryCount) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      return this.executeWithRetry(operation, attempt + 1);
    }
  }

  protected validateConfig(config: ModelConfig): ModelConfig {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    if (!config.model) {
      throw new Error('Model name is required');
    }

    return {
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 1000,
      topP: config.topP ?? 1,
      frequencyPenalty: config.frequencyPenalty ?? 0,
      presencePenalty: config.presencePenalty ?? 0
    };
  }

  protected validateResponse(response: ModelResponse): void {
    if (!response.content) {
      throw new Error('Empty response from model');
    }

    if (response.error) {
      throw new Error(`Model error: ${response.error}`);
    }
  }
} 