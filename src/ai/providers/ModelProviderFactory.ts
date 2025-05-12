import { ModelConfig, ModelProvider } from '../types/models';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAIProvider } from './OpenAIProvider';

export type ProviderType = 'anthropic' | 'openai';

export class ModelProviderFactory {
  private static providers: Map<string, ModelProvider> = new Map();

  static async createProvider(type: ProviderType, config: ModelConfig): Promise<ModelProvider> {
    const key = `${type}-${config.model}`;
    
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    let provider: ModelProvider;

    switch (type) {
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }

    await provider.initialize();
    this.providers.set(key, provider);
    return provider;
  }

  static async getProvider(type: ProviderType, config: ModelConfig): Promise<ModelProvider> {
    return this.createProvider(type, config);
  }

  static async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.providers.values()).map(provider => provider.cleanup());
    await Promise.all(cleanupPromises);
    this.providers.clear();
  }
} 