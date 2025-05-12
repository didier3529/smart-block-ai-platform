import { ContractAnalysis, MarketTrend, NFTCollection, PortfolioSummary } from './blockchain';
import { AgentConfig, AgentResponse, ProcessingResult } from './common';

// Base interfaces with proper type definitions
export interface BaseAnalysis {
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface NFTAnalysis extends BaseAnalysis {
  collection: string;
  tokenId?: string;
  metrics: {
    rarity?: number;
    estimatedValue?: number;
    trendScore?: number;
  };
  recommendations?: string[];
}

export interface ContractAnalysis extends BaseAnalysis {
  address: string;
  chainId: number;
  securityScore?: number;
  findings: {
    severity: 'high' | 'medium' | 'low';
    description: string;
    location?: string;
  }[];
}

export interface MarketAnalysis extends BaseAnalysis {
  symbol: string;
  metrics: {
    price?: number;
    volume24h?: number;
    priceChange24h?: number;
  };
  signals: {
    type: string;
    strength: number;
    description: string;
  }[];
}

export interface PortfolioAnalysis extends BaseAnalysis {
  walletAddress: string;
  totalValue: number;
  assets: {
    type: 'token' | 'nft' | 'contract';
    address: string;
    value: number;
    share: number;
  }[];
  recommendations: string[];
}

// Base agent response type
export interface AgentResponse<T> {
  data: T;
  confidence: number;
  reasoning: string;
  sources?: string[];
  timestamp: number;
}

// Portfolio Analyst Agent types
export interface PortfolioAnalysis extends AgentResponse<{
  summary: string;
  recommendations: Array<{
    type: 'buy' | 'sell' | 'hold';
    token: string;
    reason: string;
    confidence: number;
    timeframe: 'short' | 'medium' | 'long';
  }>;
  risks: Array<{
    level: 'high' | 'medium' | 'low';
    description: string;
    mitigation?: string;
  }>;
  diversification: {
    score: number;
    analysis: string;
    suggestions: string[];
  };
  performance: {
    analysis: string;
    keyFactors: string[];
    outlook: string;
  };
}> {}

// Trend Spotter Agent types
export interface TrendAnalysis extends AgentResponse<{
  trends: MarketTrend[];
  analysis: {
    summary: string;
    keyDrivers: string[];
    sentiment: number;
    confidence: number;
  };
  opportunities: Array<{
    description: string;
    relevantTokens: string[];
    confidence: number;
    timeframe: 'short' | 'medium' | 'long';
  }>;
  risks: Array<{
    description: string;
    affectedSectors: string[];
    severity: 'high' | 'medium' | 'low';
  }>;
}> {}

// Smart Contract Analyzer Agent types
export interface ContractAnalyzerResponse extends AgentResponse<{
  analysis: ContractAnalysis;
  explanation: {
    summary: string;
    technicalDetails: string;
    recommendations: string[];
  };
  securityScore: number;
  auditHistory?: Array<{
    date: string;
    auditor: string;
    findings: number;
    status: 'passed' | 'failed' | 'pending';
  }>;
  similarContracts?: Array<{
    address: string;
    similarity: number;
    notes: string;
  }>;
}> {}

// NFT Advisor Agent types
export interface NFTAnalysis extends AgentResponse<{
  collection: NFTCollection;
  analysis: {
    summary: string;
    marketPosition: string;
    communityHealth: string;
    growthPotential: string;
  };
  valuation: {
    currentValue: number;
    projectedValue: number;
    confidence: number;
    factors: string[];
  };
  rarityAnalysis: {
    methodology: string;
    distribution: Record<string, number>;
    insights: string[];
  };
  recommendations: Array<{
    action: 'buy' | 'sell' | 'hold';
    reason: string;
    priceTarget?: number;
    timeframe: 'short' | 'medium' | 'long';
  }>;
}> {}

// Agent query parameters
export interface AgentQueryParams {
  maxResponseTime?: number;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  confidenceThreshold?: number;
  includeSources?: boolean;
  format?: 'simple' | 'detailed';
}

interface NFTAdvisorState extends BaseAgentState {
  nftAddress?: string;
}

interface SmartContractAnalyzerState extends BaseAgentState {
  contractAddress?: string;
}

interface TrendSpotterState extends BaseAgentState {
  marketId?: string;
}

interface PortfolioAnalystState extends BaseAgentState {
  walletAddress?: string;
} 