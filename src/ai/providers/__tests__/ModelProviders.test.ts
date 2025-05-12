import { AnthropicProvider } from '../AnthropicProvider';
import { OpenAIProvider } from '../OpenAIProvider';
import { ModelProviderFactory } from '../ModelProviderFactory';
import { ModelConfig } from '../../types/models';

// Mock the external SDKs
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

describe('Model Providers', () => {
  const mockConfig: ModelConfig = {
    apiKey: 'test-key',
    model: 'test-model',
    temperature: 0.7,
    maxTokens: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AnthropicProvider', () => {
    let provider: AnthropicProvider;

    beforeEach(() => {
      provider = new AnthropicProvider(mockConfig);
    });

    it('should initialize correctly', async () => {
      await provider.initialize();
      expect(provider).toBeDefined();
    });

    it('should handle completion requests', async () => {
      await provider.initialize();
      const response = await provider.complete('test prompt');
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      await provider.initialize();
      // Mock a failure
      (provider as any).client.messages.create.mockRejectedValueOnce(new Error('API Error'));
      const response = await provider.complete('test prompt');
      expect(response.error).toBeDefined();
    });

    it('should cleanup resources', async () => {
      await provider.initialize();
      await provider.cleanup();
      expect((provider as any).client).toBeNull();
    });
  });

  describe('OpenAIProvider', () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider(mockConfig);
    });

    it('should initialize correctly', async () => {
      await provider.initialize();
      expect(provider).toBeDefined();
    });

    it('should handle completion requests', async () => {
      await provider.initialize();
      const response = await provider.complete('test prompt');
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      await provider.initialize();
      // Mock a failure
      (provider as any).client.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));
      const response = await provider.complete('test prompt');
      expect(response.error).toBeDefined();
    });

    it('should cleanup resources', async () => {
      await provider.initialize();
      await provider.cleanup();
      expect((provider as any).client).toBeNull();
    });
  });

  describe('ModelProviderFactory', () => {
    beforeEach(async () => {
      await ModelProviderFactory.cleanup();
    });

    it('should create Anthropic provider', async () => {
      const provider = await ModelProviderFactory.createProvider('anthropic', mockConfig);
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should create OpenAI provider', async () => {
      const provider = await ModelProviderFactory.createProvider('openai', mockConfig);
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should reuse existing providers', async () => {
      const provider1 = await ModelProviderFactory.getProvider('anthropic', mockConfig);
      const provider2 = await ModelProviderFactory.getProvider('anthropic', mockConfig);
      expect(provider1).toBe(provider2);
    });

    it('should create separate providers for different models', async () => {
      const provider1 = await ModelProviderFactory.getProvider('anthropic', { ...mockConfig, model: 'model1' });
      const provider2 = await ModelProviderFactory.getProvider('anthropic', { ...mockConfig, model: 'model2' });
      expect(provider1).not.toBe(provider2);
    });

    it('should throw error for unsupported provider type', async () => {
      await expect(ModelProviderFactory.createProvider('unsupported' as any, mockConfig))
        .rejects.toThrow('Unsupported provider type');
    });

    it('should cleanup all providers', async () => {
      await ModelProviderFactory.getProvider('anthropic', mockConfig);
      await ModelProviderFactory.getProvider('openai', mockConfig);
      await ModelProviderFactory.cleanup();
      // Create new provider to verify cache was cleared
      const newProvider = await ModelProviderFactory.getProvider('anthropic', mockConfig);
      expect(newProvider).toBeInstanceOf(AnthropicProvider);
    });
  });
}); 