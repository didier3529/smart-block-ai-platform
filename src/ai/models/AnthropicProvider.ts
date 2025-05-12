import { BaseModelProvider } from '../core/BaseModelProvider';
import { ModelConfig, ModelRequestConfig, ModelResponse } from '../types/models';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider extends BaseModelProvider {
  private client: Anthropic | null = null;

  public async initialize(config: ModelConfig): Promise<void> {
    this.validateConfig(config);

    try {
      this.client = new Anthropic({
        apiKey: config.apiKey!,
        baseURL: config.baseUrl
      });

      this.isReady = true;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  public async complete(prompt: string, config: ModelRequestConfig): Promise<ModelResponse> {
    if (!this.isInitialized() || !this.client) {
      throw new Error('Provider not initialized');
    }

    this.validateRequestConfig(config);

    return this.withRetry(async () => {
      const response = await this.client!.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        text: response.content[0].text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        metadata: {
          model: response.model,
          finishReason: response.stop_reason
        }
      };
    });
  }

  public async cleanup(): Promise<void> {
    this.client = null;
    await super.cleanup();
  }
} 