import { EventEmitter } from 'events';
import { AgentState, AgentConfig } from './index';

export interface PortfolioAnalysis {
  holdings: {
    token: string;
    amount: string;
    value: string;
  }[];
  totalValue: string;
  riskScore: number;
  recommendations: string[];
}

export interface MarketTrend {
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signals: {
    indicator: string;
    value: string;
    interpretation: string;
  }[];
  predictions: string[];
}

export interface ContractAnalysis {
  vulnerabilities: {
    severity: 'high' | 'medium' | 'low';
    description: string;
    location: string;
  }[];
  gasOptimizations: string[];
  codeQuality: {
    score: number;
    findings: string[];
  };
}

export interface NFTEvaluation {
  rarity: {
    score: number;
    traits: Record<string, number>;
  };
  priceEstimate: {
    low: string;
    high: string;
    confidence: number;
  };
  marketTrends: string[];
}

// Agent-specific configs
export interface PortfolioAnalystConfig extends AgentConfig {
  capabilities: ['portfolio analysis', 'risk assessment', 'investment recommendations'];
  analysisThresholds: {
    riskTolerance: number;
    minimumHoldingValue: string;
  };
}

export interface TrendSpotterConfig extends AgentConfig {
  capabilities: ['market trend analysis', 'sentiment analysis', 'pattern recognition'];
  trendParameters: {
    timeframe: string;
    confidenceThreshold: number;
  };
}

export interface ContractAnalyzerConfig extends AgentConfig {
  capabilities: ['code analysis', 'vulnerability detection', 'gas optimization'];
  scanParameters: {
    maxDepth: number;
    severityThreshold: string;
  };
}

export interface NFTAdvisorConfig extends AgentConfig {
  capabilities: ['NFT valuation', 'rarity analysis', 'market opportunity detection'];
  evaluationParameters: {
    priceHistory: number;
    similarityThreshold: number;
  };
}

// Agent-specific states
export interface PortfolioAnalystState extends AgentState {
  lastAnalysis?: PortfolioAnalysis;
  watchedTokens: string[];
}

export interface TrendSpotterState extends AgentState {
  lastTrend?: MarketTrend;
  monitoredPatterns: string[];
}

export interface ContractAnalyzerState extends AgentState {
  lastAnalysis?: ContractAnalysis;
  scannedContracts: string[];
}

export interface NFTAdvisorState extends AgentState {
  lastEvaluation?: NFTEvaluation;
  trackedCollections: string[];
}

export interface AgentResponse {
  type: string;
  data: any;
  metadata?: {
    timestamp?: number;
    batched?: boolean;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
    performance?: {
      processingTime?: number;
      batchSize?: number;
      cacheHit?: boolean;
      retryCount?: number;
    };
  };
}

export interface AgentMessage {
  type: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface Agent {
  type: string;
  processMessage(message: AgentMessage): Promise<AgentResponse>;
  getState(): AgentState;
  setState(newState: Partial<AgentState>): void;
  on(event: string, listener: (...args: any[]) => void): void;
  cleanup(): Promise<void>;
}

export interface AgentError extends Error {
  code: string;
  details?: any;
  retryable: boolean;
}

export class BaseAgent implements Agent {
  type: string;
  protected state: AgentState;
  protected eventEmitter: EventEmitter;

  constructor(type: string) {
    this.type = type;
    this.state = {
      id: 'base-agent',
      status: 'idle',
      memory: {},
      errors: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        tokenUsage: { prompt: 0, completion: 0, total: 0 }
      },
      lastUpdated: new Date().toISOString()
    };
    this.eventEmitter = new EventEmitter();
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    throw new Error('Method not implemented');
  }

  getState(): AgentState {
    return this.state;
  }

  setState(newState: Partial<AgentState>): void {
    this.state = { ...this.state, ...newState, lastUpdated: new Date().toISOString() };
    this.eventEmitter.emit('stateChanged', this.state);
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  async cleanup(): Promise<void> {
    this.eventEmitter.removeAllListeners();
  }
} 