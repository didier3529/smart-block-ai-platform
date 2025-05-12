// Common blockchain types
export type NetworkType = 
  | 'ethereum'
  | 'bitcoin'
  | 'bsc'
  | 'polygon'
  | 'avalanche'
  | 'solana'
  | 'arbitrum'
  | 'optimism';

export interface NetworkConfig {
  chainId: string;
  name: string;
  type: NetworkType;
  rpcUrl: string;
  explorerUrl: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export interface ContractAnalysisResult {
  name: string
  address: string
  chain: string
  status: "Secure" | "Warning" | "Critical"
  lastAudit: string
  riskLevel: "Low" | "Medium" | "High"
  issues: {
    critical: number
    high: number
    medium: number
    low: number
  }
  details?: {
    owner: string
    implementation?: string
    totalSupply?: string
    holders?: number
    transactions?: number
    verified: boolean
    proxy: boolean
    license: string
    compiler: string
    optimizationEnabled: boolean
  }
  securityScore?: number
  auditHistory?: {
    date: string
    auditor: string
    report: string
    findings: number
  }[]
  sourceCode?: {
    verified: boolean
    files: {
      name: string
      content: string
    }[]
  }
}

// Token data structures
export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  type: TokenType;
  network: NetworkType;
  price?: number;
  priceChange24h?: number;
  balance?: string;
  balanceUsd?: number;
}

// Portfolio data structures
export interface PortfolioToken extends TokenData {
  quantity: string;
  value: number | string;
  allocation: number;
  performance24h: number;
  performance7d: number;
  performance30d: number;
  price?: number;
  change?: number | string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalChange24h: number;
  totalChange7d: number;
  tokens: PortfolioToken[];
  topPerformers: PortfolioToken[];
  worstPerformers: PortfolioToken[];
  percentChange24h?: number;
  assetsCount?: number;
  networksCount?: number;
  change?: number | string;
  assets?: PortfolioToken[];
  riskScore?: number;
  diversificationScore?: number;
  volatility?: number;
  sharpeRatio?: number;
}

// Market trend data structures
export interface MarketTrend {
  id: string;
  name: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'short' | 'medium' | 'long';
  relatedTokens: TokenData[];
  sentiment: number;
  volume24h: number;
  priceAction: number;
  socialMetrics: {
    mentions: number;
    sentiment: number;
    engagement: number;
  };
}

// Smart contract analysis structures
export interface ContractAnalysis {
  address: string;
  network: NetworkType;
  name?: string;
  type: string;
  riskScore: number;
  securityIssues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  findings: Array<{
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    location: string;
    recommendation: string;
  }>;
  metrics: {
    complexity: number;
    testCoverage?: number;
    lastAudit?: string;
    totalSupply?: string;
    holders?: number;
  };
}

// NFT collection data structures
export interface NFTCollection {
  address: string;
  network: NetworkType;
  name: string;
  symbol: string;
  description?: string;
  totalSupply: number;
  floorPrice: number;
  floorPriceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  averagePrice: number;
  marketCap: number;
  holders: number;
  sales24h: number;
  verified: boolean;
  socialMetrics: {
    twitter?: string;
    discord?: string;
    website?: string;
    followers?: number;
    engagement?: number;
  };
}

export interface NFTToken {
  tokenId: string;
  collection: NFTCollection;
  name?: string;
  description?: string;
  image?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
  rarity?: {
    rank: number;
    score: number;
    total: number;
  };
  lastSale?: {
    price: number;
    date: string;
    currency: string;
  };
  owner: string;
}

// Transaction data structures
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  nonce: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  network: NetworkType;
}

// TokenType: common token standards
export type TokenType = 'ERC20' | 'ERC721' | 'ERC1155' | 'native' | 'other';

// MarketData: expanded structure for market metrics (matches mock data and UI usage)
export interface MarketData {
  totalMarketCap: number; // In trillions
  marketCapChange24h: number;
  volume24h: number; // In billions
  volumeChange24h: number;
  btcDominance: number;
  btcDominanceChange24h: number;
  trendData: {
    timestamps: number[];
    marketCap: number[];
    volume: number[];
  };
  sentimentData: {
    overall: string;
    score: number;
    socialMetrics: {
      twitter: {
        sentiment: string;
        volume24h: number;
        volumeChange24h: number;
      };
      reddit: {
        sentiment: string;
        volume24h: number;
        volumeChange24h: number;
      };
    };
    technicalIndicators: {
      macd: string;
      rsi: number;
      movingAverages: string;
    };
  };
  topGainers: Array<{
    symbol: string;
    name: string;
    price: number;
    change24h: number;
  }>;
  topLosers: Array<{
    symbol: string;
    name: string;
    price: number;
    change24h: number;
  }>;
}

// Token information
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  network: NetworkType;
}

// Wallet connection state
export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
} 