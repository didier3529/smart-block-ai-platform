import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  PortfolioAnalysis,
  TrendAnalysis,
  ContractAnalyzerResponse,
  NFTAnalysis,
  AgentResponse,
} from '@/types/ai';
import { NetworkType } from '@/types/blockchain';
import { SubscriptionType } from '@/ai/adapters/websocket/SubscriptionManager';

// Query keys for caching
const aiKeys = {
  all: ['ai'] as const,
  portfolio: (address?: string) => [...aiKeys.all, 'portfolio', address] as const,
  trends: (params?: object) => [...aiKeys.all, 'trends', params] as const,
  contract: (address: string, network: NetworkType) =>
    [...aiKeys.all, 'contract', network, address] as const,
  nft: (collection: string, network: NetworkType) =>
    [...aiKeys.all, 'nft', network, collection] as const,
};

// Portfolio Analyst Agent
export function usePortfolioAnalysis(address?: string) {
  return useMutation({
    mutationFn: async (options?: {
      timeframe?: 'short' | 'medium' | 'long';
      includeRecommendations?: boolean;
      detailedAnalysis?: boolean;
    }): Promise<AgentResponse<PortfolioAnalysis>> => {
      const { data } = await apiClient.post('/api/ai/analyze-portfolio', {
        address,
        ...options,
      });
      return data;
    },
  });
}

// Trend Spotter Agent
export function useTrendAnalysis() {
  return useMutation({
    mutationFn: async (params: {
      tokens?: string[];
      timeframe?: 'short' | 'medium' | 'long';
      includeSocial?: boolean;
      includeNews?: boolean;
    }): Promise<AgentResponse<TrendAnalysis>> => {
      const { data } = await apiClient.post('/api/ai/analyze-trends', params);
      return data;
    },
  });
}

// Smart Contract Analyzer Agent
export function useContractAnalysis() {
  return useMutation({
    mutationFn: async ({
      address,
      network,
      options,
    }: {
      address: string;
      network: NetworkType;
      options?: {
        detailed?: boolean;
        includeSimilar?: boolean;
        includeAuditHistory?: boolean;
      };
    }): Promise<AgentResponse<ContractAnalyzerResponse>> => {
      const { data } = await apiClient.post('/api/ai/analyze-contract', {
        address,
        network,
        ...options,
      });
      return data;
    },
  });
}

// NFT Advisor Agent
export function useNFTAdvice() {
  return useMutation({
    mutationFn: async ({
      collection,
      network,
      options,
    }: {
      collection: string;
      network: NetworkType;
      options?: {
        includeValuation?: boolean;
        includeRarity?: boolean;
        timeframe?: '24h' | '7d' | '30d';
      };
    }): Promise<AgentResponse<NFTAnalysis>> => {
      const { data } = await apiClient.post('/api/ai/analyze-nft', {
        collection,
        network,
        ...options,
      });
      return data;
    },
  });
}

// Get cached analysis results
export function useCachedAnalysis<T>(
  type: 'portfolio' | 'trends' | 'contract' | 'nft',
  params: {
    address?: string;
    network?: NetworkType;
    collection?: string;
  }
) {
  let queryKey;
  switch (type) {
    case 'portfolio':
      queryKey = aiKeys.portfolio(params.address);
      break;
    case 'trends':
      queryKey = aiKeys.trends(params);
      break;
    case 'contract':
      if (!params.address || !params.network) throw new Error('Missing parameters');
      queryKey = aiKeys.contract(params.address, params.network);
      break;
    case 'nft':
      if (!params.collection || !params.network) throw new Error('Missing parameters');
      queryKey = aiKeys.nft(params.collection, params.network);
      break;
  }

  return useQuery({
    queryKey,
    queryFn: async (): Promise<AgentResponse<T>> => {
      const { data } = await apiClient.get(`/api/ai/cached-analysis/${type}`, {
        params,
      });
      return data;
    },
    enabled: Boolean(
      type === 'portfolio'
        ? params.address
        : type === 'trends'
        ? true
        : params.address && params.network
    ),
  });
}

// Stream analysis updates
export function useStreamingAnalysis<T>(
  type: 'portfolio' | 'trends' | 'contract' | 'nft',
  params: {
    address?: string;
    network?: NetworkType;
    collection?: string;
  },
  onUpdate: (update: Partial<T>) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe({
      type: `${type}-analysis` as SubscriptionType,
      params,
      callback: onUpdate,
    });

    return unsubscribe;
  }, [type, params, onUpdate, subscribe]);
} 