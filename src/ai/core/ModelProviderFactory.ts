import { ModelProvider, ModelProviderType, ModelConfig, ModelProviderFactory } from '../types/models';
import { AnthropicProvider } from '../models/AnthropicProvider';

class DefaultModelProviderFactory implements ModelProviderFactory {
  private static instance: DefaultModelProviderFactory;
  private providers: Map<string, ModelProvider> = new Map();

  private constructor() {}

  public static getInstance(): DefaultModelProviderFactory {
    if (!DefaultModelProviderFactory.instance) {
      DefaultModelProviderFactory.instance = new DefaultModelProviderFactory();
    }
    return DefaultModelProviderFactory.instance;
  }

  public createProvider(type: ModelProviderType, config: ModelConfig): ModelProvider {
    const key = this.getProviderKey(type, config);
    
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    let provider: ModelProvider;

    switch (type) {
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      // TODO: Add other providers as they are implemented
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }

    this.providers.set(key, provider);
    return provider;
  }

  private getProviderKey(type: ModelProviderType, config: ModelConfig): string {
    return `${type}-${config.organizationId || 'default'}`;
  }

  public async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.providers.values()).map(provider => provider.cleanup());
    await Promise.all(cleanupPromises);
    this.providers.clear();
  }
}

export const modelProviderFactory = DefaultModelProviderFactory.getInstance(); 