import { BaseModelProvider } from './BaseModelProvider';
import { ModelConfig, ModelResponse } from '../types/models';
import OpenAI from 'openai';

export class OpenAIProvider extends BaseModelProvider {
  private client: OpenAI | null = null;

  constructor(config: ModelConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    this.client = new OpenAI({
      apiKey: this.config.apiKey
    });
  }

  async complete(prompt: string): Promise<ModelResponse> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    return this.executeWithRetry(async () => {
      try {
        const response = await this.client!.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          top_p: this.config.topP,
          frequency_penalty: this.config.frequencyPenalty,
          presence_penalty: this.config.presencePenalty
        });

        const result: ModelResponse = {
          content: response.choices[0]?.message?.content || '',
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
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
    // No cleanup needed for OpenAI
    this.client = null;
  }
} 