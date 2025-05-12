import { AI_CONFIG } from '@/config/ai-config';

export interface AIAnalysisRequest {
  type: 'portfolio' | 'market' | 'contract' | 'nft';
  data: any;
}

export interface AIAnalysisResponse {
  analysis: string;
  recommendations: string[];
  riskScore?: number;
  confidence: number;
  isError?: boolean;
  errorMessage?: string;
  isMockData?: boolean;
}

export class AIService {
  private static instance: AIService;
  private messageHistory: Map<string, Array<{ role: 'user' | 'assistant'; content: string }>> = new Map();
  private openaiConfig = AI_CONFIG.openai;
  private anthropicConfig = AI_CONFIG.anthropic;
  private perplexityConfig = AI_CONFIG.perplexity;
  private isMockEnabled: boolean;

  private constructor() {
    // Initialize with environment variables with proper defaults
    this.isMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_AI === 'true' || 
      (process.env.NODE_ENV === 'development' && !this.openaiConfig.apiKey);
    
    // Log appropriate warnings
    if (!this.openaiConfig.apiKey) {
      console.warn('OpenAI API key not configured. AI analysis features will use mock data in development mode.');
    }
    
    if (this.isMockEnabled && process.env.NODE_ENV === 'development') {
      console.info('AI service is using mock data for development. Set NEXT_PUBLIC_USE_MOCK_AI=false to disable.');
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Method to check if service is using mock data
  public isUsingMockData(): boolean {
    return this.isMockEnabled || (!this.openaiConfig.apiKey && process.env.NODE_ENV === 'development');
  }

  async analyzeData(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    // Check for undefined or malformed request data
    if (!request || !request.type || !request.data) {
      console.error('Invalid AI analysis request');
      return {
        analysis: 'Error: Invalid request format',
        recommendations: ['Please provide valid data for analysis'],
        confidence: 0,
        isError: true,
        errorMessage: 'Invalid request format'
      };
    }

    // Enhanced error handling and mock support
    // In development mode, if we're configured to use mock data or have no API key, return mocks
    if (this.isUsingMockData()) {
      console.log(`Using mock AI data for ${request.type} analysis (development mode)`);
      return {
        ...this.getMockAnalysisResult(request),
        isMockData: true
      };
    }

    // Check for API key in production
    if (!this.openaiConfig.apiKey) {
      const error = new Error('AI API key not configured');
      console.error(error.message);
      if (process.env.NODE_ENV === 'development') {
        return {
          ...this.getMockAnalysisResult(request),
          isMockData: true,
          isError: true,
          errorMessage: error.message
        };
      }
      throw error;
    }

    try {
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${this.openaiConfig.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: this.openaiConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI analyst specializing in blockchain and cryptocurrency analysis.'
            },
            {
              role: 'user',
              content: JSON.stringify(request)
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        analysis: data.choices[0].message.content,
        recommendations: this.extractRecommendations(data.choices[0].message.content),
        confidence: 0.85,
        isError: false
      };
    } catch (error: any) {
      console.error('AI analysis error:', error);
      return {
        analysis: 'Error processing request',
        recommendations: ['Please try again later'],
        confidence: 0,
        isError: true,
        errorMessage: error.message
      };
    }
  }

  private getMockAnalysisResult(request: AIAnalysisRequest): AIAnalysisResponse {
    // Return appropriate mock data based on request type
    switch (request.type) {
      case 'portfolio':
        return {
          analysis: 'Mock portfolio analysis: Your portfolio shows a healthy diversification across major cryptocurrencies.',
          recommendations: [
            'Consider increasing exposure to DeFi tokens',
            'Monitor Bitcoin dominance trends',
            'Review stablecoin allocation'
          ],
          confidence: 0.85
        };
      case 'market':
        return {
          analysis: 'Mock market analysis: Current market conditions indicate a bullish trend with increasing volume.',
          recommendations: [
            'Watch for key resistance levels',
            'Monitor market sentiment indicators',
            'Track institutional inflows'
          ],
          confidence: 0.8
        };
      default:
        return {
          analysis: 'Mock analysis: Generic analysis for unknown request type.',
          recommendations: ['Please specify a valid analysis type'],
          confidence: 0.5
        };
    }
  }

  private extractRecommendations(analysis: string): string[] {
    // Simple extraction of recommendations from analysis text
    // In a real implementation, this would be more sophisticated
    const recommendations = analysis.split('\n')
      .filter(line => line.includes('recommend') || line.includes('suggest'))
      .map(line => line.trim());

    return recommendations.length > 0 ? recommendations : ['No specific recommendations found'];
  }
}

// Export singleton instance
export const aiService = AIService.getInstance(); 