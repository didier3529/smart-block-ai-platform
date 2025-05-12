import { BaseAgent } from '../../core/BaseAgent';
import { AgentMessage, AgentResponse } from '../../types';
import { PortfolioAnalystConfig, PortfolioAnalystState } from '../../types/agents';
import { createMockAgentResponse, simulateError } from '../../core/__tests__/test-helpers';

export class MockPortfolioAnalyst extends BaseAgent<PortfolioAnalystConfig, PortfolioAnalystState> {
  constructor(config: PortfolioAnalystConfig) {
    super(config);
    this.state = {
      status: 'idle',
      lastAnalysis: null,
      errors: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      }
    };
  }

  public async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.analysisThresholds?.riskTolerance) {
        throw new Error('Risk tolerance threshold not configured');
      }

      this.state.status = 'ready';
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  public async processMessage(message: AgentMessage): Promise<AgentResponse> {
    this.state.metrics.totalRequests++;

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate random errors
      if (simulateError(0.2)) {
        this.state.metrics.failedRequests++;
        throw new Error('Simulated processing error');
      }

      if (message.data.invalid) {
        this.state.metrics.failedRequests++;
        throw new Error('Invalid message data');
      }

      const response = this.generateMockResponse(message);
      this.state.metrics.successfulRequests++;
      this.state.lastAnalysis = response.data;

      return response;
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  private generateMockResponse(message: AgentMessage): AgentResponse {
    const holdings = message.data.holdings || [];
    const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.value), 0);
    
    return createMockAgentResponse({
      holdings,
      totalValue: totalValue.toString(),
      riskScore: this.calculateMockRiskScore(holdings),
      recommendations: this.generateMockRecommendations(holdings)
    });
  }

  private calculateMockRiskScore(holdings: any[]): number {
    // Simple mock risk calculation
    const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.value), 0);
    const numHoldings = holdings.length;
    return Math.min(totalValue / (numHoldings * 1000), 1);
  }

  private generateMockRecommendations(holdings: any[]): string[] {
    const recommendations = [];
    
    if (holdings.length < 3) {
      recommendations.push('Consider diversifying your portfolio');
    }

    if (holdings.some(h => parseFloat(h.value) > 1500)) {
      recommendations.push('Consider rebalancing large positions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Portfolio appears well balanced');
    }

    return recommendations;
  }

  public async cleanup(): Promise<void> {
    this.state = {
      status: 'idle',
      lastAnalysis: null,
      errors: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      }
    };
  }
} 