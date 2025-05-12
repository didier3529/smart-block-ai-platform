import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { MarketTrend } from '@/types/blockchain';
import { TrendAnalysis } from '@/types/ai';

// Query keys
export const trendKeys = {
  all: ['trends'] as const,
  list: (filters?: TrendFilters) => [...trendKeys.all, 'list', filters] as const,
  detail: (id: string) => [...trendKeys.all, 'detail', id] as const,
  analysis: (params?: TrendAnalysisParams) =>
    [...trendKeys.all, 'analysis', params] as const,
};

// Types
interface TrendFilters {
  timeframe?: 'short' | 'medium' | 'long';
  impact?: 'high' | 'medium' | 'low';
  confidence?: number;
  category?: string;
}

interface TrendAnalysisParams {
  tokens?: string[];
  timeframe?: 'short' | 'medium' | 'long';
  includeSocial?: boolean;
}

interface TrendResponse {
  trends: MarketTrend[];
  nextCursor?: string;
  total: number;
}

// Fetch trending market data
export function useMarketTrends(filters?: TrendFilters) {
  return useInfiniteQuery({
    queryKey: trendKeys.list(filters),
    queryFn: async ({ pageParam = undefined }): Promise<TrendResponse> => {
      const { data } = await apiClient.get('/api/trends', {
        params: {
          ...filters,
          cursor: pageParam,
        },
      });
      return data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage?.nextCursor,
  });
}

// Fetch single trend details
export function useMarketTrend(id: string) {
  return useQuery({
    queryKey: trendKeys.detail(id),
    queryFn: async (): Promise<MarketTrend> => {
      const { data } = await apiClient.get(`/api/trends/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

// Get AI analysis of market trends
export function useTrendAnalysis(params?: TrendAnalysisParams) {
  return useQuery({
    queryKey: trendKeys.analysis(params),
    queryFn: async (): Promise<TrendAnalysis> => {
      const { data } = await apiClient.post('/api/trends/analyze', params);
      return data;
    },
    // Longer stale time for AI analysis
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Get real-time trend updates via WebSocket
export function useRealtimeTrends() {
  return useQuery({
    queryKey: [...trendKeys.all, 'realtime'],
    queryFn: async (): Promise<MarketTrend[]> => {
      const { data } = await apiClient.get('/api/trends/realtime');
      return data;
    },
    // Shorter polling interval for real-time data
    refetchInterval: 1000 * 30, // 30 seconds
  });
} 