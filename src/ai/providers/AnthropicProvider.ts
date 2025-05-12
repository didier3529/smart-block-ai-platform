import { BaseModelProvider } from './BaseModelProvider';
import { ModelConfig, ModelResponse } from '../types/models';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider extends BaseModelProvider {
  private client: Anthropic | null = null;

  constructor(config: ModelConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    this.client = new Anthropic({
      apiKey: this.config.apiKey
    });
  }

  async complete(prompt: string): Promise<ModelResponse> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    return this.executeWithRetry(async () => {
      try {
        const response = await this.client!.messages.create({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [
            { role: 'user', content: prompt }
          ]
        });

        const result: ModelResponse = {
          content: response.content[0].text,
          usage: {
            promptTokens: response.usage?.input_tokens || 0,
            completionTokens: response.usage?.output_tokens || 0,
            totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
          }
        };

        this.validateResponse(result);
        return result;
      } catch (error: any) {
        return {
          content: '',
          error: error.message || 'Unknown error occurred',
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        };
      }
    });
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for Anthropic
    this.client = null;
  }
} 