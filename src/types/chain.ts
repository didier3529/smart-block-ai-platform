export interface ChainData {
  chainId: string;
  type: string;
  timestamp: Date | string;
  value: string | number;
  metadata: Record<string, any>;
}

export interface AggregatedData {
  timestamp: Date;
  chains: string[];
  metrics: Record<string, any>;
  summary: Record<string, any>;
}

export interface AggregationConfig {
  decimals: number;
  metadataNormalizers?: Record<string, (value: any) => any>;
  aggregators?: Record<string, (data: ChainData[]) => any>;
  crossChainAnalysis?: (metrics: Record<string, any>) => Record<string, any>;
}

export interface ChainMetrics {
  transactionCount: number;
  totalValue: number;
  averageGasPrice: number;
  blockTime: number;
  activeAddresses: number;
}

export interface CrossChainMetrics {
  totalTransactions: number;
  totalValueLocked: number;
  crossChainVolume: number;
  chainActivity: Record<string, number>;
  performanceMetrics: Record<string, number>;
}

export type MetadataNormalizer = (value: any) => any;
export type DataAggregator = (data: ChainData[]) => any;
export type CrossChainAnalyzer = (metrics: Record<string, any>) => Record<string, any>; 