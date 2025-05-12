import { BaseAgent } from '../core/BaseAgent';
import { AgentResponse } from '../types';
import { PortfolioAnalystConfig, PortfolioAnalystState, PortfolioAnalysis } from '../types/agents';
import { fetchTokenPrices, getWalletHoldings, getMarketConditions } from '../utils/blockchain';
import { PromptManager } from '../core/PromptManager';

export class PortfolioAnalyst extends BaseAgent<PortfolioAnalystConfig, PortfolioAnalystState> {
  constructor(config: PortfolioAnalystConfig, promptManager: PromptManager) {
    const initialState: PortfolioAnalystState = {
      status: 'idle',
      lastUpdated: new Date().toISOString(),
      watchedTokens: [],
    };
    super(config, initialState, promptManager);
  }

  public async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.analysisThresholds?.riskTolerance) {
        throw new Error('Risk tolerance threshold not configured');
      }

      // Initialize blockchain connections and other resources
      await this.setupBlockchainConnections();
      
      this.isInitialized = true;
      this.setState({ status: 'ready' });
    } catch (error) {
      this.setState({ status: 'error' });
      throw error;
    }
  }

  protected async processQuery(query: string): Promise<AgentResponse> {
    this.setState({ status: 'processing' });

    try {
      // Parse the query to determine the type of analysis needed
      const analysisType = this.parseQueryType(query);
      
      // Fetch current portfolio data
      const holdings = await this.getCurrentHoldings();
      const marketConditions = await getMarketConditions();
      
      // Format holdings for prompt
      const holdingsText = holdings.map(h => 
        `${h.token}: ${h.amount} (Value: $${parseFloat(h.value).toFixed(2)})`
      ).join('\n');

      // Prepare variables for prompt
      const promptVariables = {
        portfolioValue: holdings.reduce((sum, h) => sum + parseFloat(h.value), 0).toFixed(2),
        holdings: holdingsText,
        marketConditions: this.formatMarketConditions(marketConditions),
        riskTolerance: this.config.analysisThresholds.riskTolerance,
        investmentHorizon: this.config.analysisThresholds.investmentHorizon || 'medium-term'
      };

      // Get AI analysis using prompt template
      const analysisPrompt = await this.renderPrompt(
        'portfolio-analyst-analyze',
        promptVariables,
        {
          temperature: 0.7,
          maxTokens: 1000
        }
      );

      // TODO: Send prompt to AI model and get response
      const aiResponse = "Placeholder AI response"; // Replace with actual AI call

      // Parse AI response and create analysis object
      const analysis = this.parseAIResponse(aiResponse, holdings);
      
      // Update state with latest analysis
      this.setState({
        lastAnalysis: analysis,
        status: 'ready'
      });

      return {
        type: 'portfolio_analysis',
        content: analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.setState({ status: 'error' });
      throw error;
    }
  }

  private parseQueryType(query: string): 'full' | 'risk' | 'opportunities' {
    if (query.toLowerCase().includes('risk')) return 'risk';
    if (query.toLowerCase().includes('opportunities')) return 'opportunities';
    return 'full';
  }

  private async getCurrentHoldings() {
    const walletHoldings = await getWalletHoldings(this.config.walletAddress);
    const tokenPrices = await fetchTokenPrices(walletHoldings.map(h => h.token));
    
    return walletHoldings.map(holding => ({
      ...holding,
      value: this.calculateValue(holding.amount, tokenPrices[holding.token])
    }));
  }

  private formatMarketConditions(conditions: any): string {
    // Format market conditions into a readable string
    return Object.entries(conditions)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  private parseAIResponse(response: string, holdings: any[]): PortfolioAnalysis {
    // TODO: Implement proper parsing of AI response
    // For now, return a placeholder analysis
    return {
      holdings,
      totalValue: holdings.reduce((sum, h) => sum + parseFloat(h.value), 0).toString(),
      riskScore: this.calculateRiskScore(holdings),
      recommendations: ['Placeholder recommendation']
    };
  }

  private calculateRiskScore(holdings: Array<{ token: string; amount: string; value: string }>): number {
    // Implement risk scoring logic based on:
    // - Portfolio concentration
    // - Token volatility
    // - Market cap distribution
    // - Historical performance
    return Math.random() * 10; // Placeholder implementation
  }

  private calculateValue(amount: string, price: number): string {
    return (parseFloat(amount) * price).toString();
  }

  private async setupBlockchainConnections(): Promise<void> {
    // Initialize blockchain connections
    // This would typically involve setting up Web3 providers
    // and any necessary authentication
  }

  async analyzePortfolio(holdings: Array<{ token: string; amount: string; value: string }>): Promise<PortfolioAnalysis> {
    try {
      // Calculate basic metrics
      const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.value.replace(/[^0-9.-]+/g, "")), 0)
      const riskScore = this.calculateRiskScore(holdings)
      
      // Generate AI-powered recommendations
      const recommendations = await this.generateRecommendations(holdings, totalValue, riskScore)

      return {
        holdings,
        totalValue: this.formatCurrency(totalValue),
        riskScore,
        recommendations
      }
    } catch (error) {
      console.error("Portfolio Analysis Error:", error)
      throw new Error("Failed to analyze portfolio")
    }
  }

  private async generateRecommendations(
    holdings: Array<{ token: string; amount: string; value: string }>,
    totalValue: number,
    riskScore: number
  ): Promise<string[]> {
    const prompt = this.promptManager.getPrompt("portfolio_analysis", {
      holdings: JSON.stringify(holdings),
      totalValue: this.formatCurrency(totalValue),
      riskScore: riskScore.toString(),
      riskTolerance: this.config.analysisThresholds.riskTolerance.toString(),
      minimumHoldingValue: this.config.analysisThresholds.minimumHoldingValue
    })

    const response = await this.llm.complete(prompt)
    return this.parseRecommendations(response)
  }

  private calculateRiskScore(holdings: Array<{ token: string; amount: string; value: string }>): number {
    const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.value.replace(/[^0-9.-]+/g, "")), 0)
    
    // Risk factors:
    let riskScore = 5 // Base score

    // 1. Portfolio concentration
    const concentrationRisk = this.calculateConcentrationRisk(holdings, totalValue)
    riskScore += concentrationRisk

    // 2. Asset type risk
    const assetTypeRisk = this.calculateAssetTypeRisk(holdings)
    riskScore += assetTypeRisk

    // 3. Volatility risk (simplified)
    const volatilityRisk = this.calculateVolatilityRisk(holdings)
    riskScore += volatilityRisk

    // Normalize score to 0-10 range
    return Math.min(Math.max(riskScore, 0), 10)
  }

  private calculateConcentrationRisk(
    holdings: Array<{ token: string; amount: string; value: string }>,
    totalValue: number
  ): number {
    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = holdings.reduce((sum, holding) => {
      const value = parseFloat(holding.value.replace(/[^0-9.-]+/g, ""))
      const percentage = (value / totalValue) * 100
      return sum + Math.pow(percentage, 2)
    }, 0)

    // HHI ranges from 0 (perfectly diversified) to 10000 (single asset)
    // Convert to 0-2 risk score range
    return (hhi / 10000) * 2
  }

  private calculateAssetTypeRisk(holdings: Array<{ token: string; amount: string; value: string }>): number {
    // Simplified risk scoring based on token types
    const riskWeights: { [key: string]: number } = {
      "BTC": 0.8,  // Lower risk major assets
      "ETH": 0.8,
      "USDC": 0.2, // Stablecoins
      "USDT": 0.2,
      "DAI": 0.2,
      "default": 1.2 // Higher risk for other tokens
    }

    const weightedRisk = holdings.reduce((sum, holding) => {
      const value = parseFloat(holding.value.replace(/[^0-9.-]+/g, ""))
      const weight = riskWeights[holding.token] || riskWeights.default
      return sum + (value * weight)
    }, 0)

    // Normalize to 0-2 range
    return Math.min((weightedRisk / 1000), 2)
  }

  private calculateVolatilityRisk(holdings: Array<{ token: string; amount: string; value: string }>): number {
    // Simplified volatility scoring
    // In a real implementation, this would use historical price data
    const volatilityWeights: { [key: string]: number } = {
      "BTC": 0.7,
      "ETH": 0.8,
      "USDC": 0.1,
      "USDT": 0.1,
      "DAI": 0.1,
      "default": 1.0
    }

    const avgVolatility = holdings.reduce((sum, holding) => {
      return sum + (volatilityWeights[holding.token] || volatilityWeights.default)
    }, 0) / holdings.length

    // Convert to 0-2 range
    return avgVolatility
  }

  private parseRecommendations(response: string): string[] {
    try {
      // Extract recommendations from AI response
      // This is a simplified implementation
      const recommendations = response
        .split("\n")
        .filter(line => line.trim().length > 0)
        .map(line => line.trim())
        .slice(0, 5) // Limit to top 5 recommendations

      return recommendations
    } catch (error) {
      console.error("Error parsing recommendations:", error)
      return ["Diversify your portfolio to reduce risk"]
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }
} 