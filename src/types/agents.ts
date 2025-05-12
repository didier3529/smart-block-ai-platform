export type AgentStatus = 'active' | 'inactive' | 'error' | 'processing';
export type AgentType = 'TrendSpotter' | 'SmartContractAnalyzer' | 'NFTAdvisor';

export interface AgentMetrics {
  requestCount: number;
  averageResponseTime: number;
  successRate: number;
  lastUpdated: string;
}

export interface AgentHistoryItem {
  id: string;
  timestamp: string;
  type: string;
  status: 'success' | 'error';
  details: string;
}

export interface AgentConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  enableStreaming: boolean;
  responseFormat: 'json' | 'text' | 'markdown';
  customPromptTemplate?: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  capabilities: string[];
  performance: number;
  metrics: AgentMetrics;
  history: AgentHistoryItem[];
  config: AgentConfig;
}

// TrendSpotter specific types
export interface PriceDataPoint {
  timestamp: string;
  price: number;
  movingAverage: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'hold';
}

export interface MarketSentiment {
  score: number;
  factors: string[];
}

export interface TrendSpotterResult {
  trendDirection: 'up' | 'down';
  confidence: number;
  priceHistory: PriceDataPoint[];
  indicators: TechnicalIndicator[];
  sentiment: MarketSentiment;
  prediction: {
    timeframe: string;
    direction: string;
    targetPrice: number;
  };
}

// SmartContractAnalyzer specific types
export interface SecurityVulnerability {
  severity: 'high' | 'medium' | 'low';
  type: string;
  location: string;
  description: string;
  recommendation: string;
}

export interface GasOptimization {
  impact: 'high' | 'medium' | 'low';
  location: string;
  currentGas: number;
  potentialSaving: number;
  suggestion: string;
}

export interface SmartContractAnalysis {
  vulnerabilities: SecurityVulnerability[];
  gasOptimizations: GasOptimization[];
  codeQuality: {
    score: number;
    issues: Array<{
      type: string;
      description: string;
      location: string;
    }>;
  };
}

// NFTAdvisor specific types
export interface NFTCollectionMetrics {
  floorPrice: number;
  volume24h: number;
  holders: number;
  totalSupply: number;
  uniqueHolders: number;
}

export interface NFTValuePrediction {
  timeframe: string;
  predictedFloor: number;
  confidence: number;
  factors: string[];
}

export interface NFTAnalysis {
  collection: NFTCollectionMetrics;
  marketTrends: {
    priceHistory: PriceDataPoint[];
    trendDirection: 'up' | 'down';
    sentiment: MarketSentiment;
  };
  valuePrediction: NFTValuePrediction;
  recommendations: Array<{
    type: 'buy' | 'sell' | 'hold';
    reason: string;
    confidence: number;
  }>;
} 