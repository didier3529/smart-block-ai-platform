export interface ModelConfig {
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  maxRetries?: number;
  timeout?: number;
  defaultModel?: string;
}

export interface ModelRequestConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface ModelResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    model: string;
    finishReason?: string;
    [key: string]: any;
  };
}

export interface ModelError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export interface ModelProvider {
  initialize(config: ModelConfig): Promise<void>;
  complete(prompt: string, config: ModelRequestConfig): Promise<ModelResponse>;
  isInitialized(): boolean;
  cleanup(): Promise<void>;
}

export interface ModelProviderFactory {
  createProvider(type: ModelProviderType, config: ModelConfig): ModelProvider;
}

export type ModelProviderType = 'openai' | 'anthropic' | 'perplexity'; 