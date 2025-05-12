import { useQuery } from '@tanstack/react-query';
import { useBlockchainWebSocket } from './use-blockchain-websocket';
import { PortfolioSummary } from '../types/portfolio';

interface UsePortfolioOptions {
  chainId: number;
  timeframe: string;
  onUpdate?: (data: PortfolioSummary) => void;
}

export function usePortfolio({ chainId, timeframe, onUpdate }: UsePortfolioOptions) {
  // Set up WebSocket connection for real-time updates
  useBlockchainWebSocket({
    chainId,
    eventTypes: [
      'portfolio:balance',
      'portfolio:transactions',
      'portfolio:tokens',
      'portfolio:nfts'
    ],
    onMessage: (event) => {
      if (onUpdate && event.data) {
        onUpdate(event.data as PortfolioSummary);
      }
    },
    onError: (error) => {
      console.error('Portfolio WebSocket error:', error);
    }
  });

  // Fetch initial portfolio data
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', chainId, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/summary?chainId=${chainId}&timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      return response.json() as Promise<PortfolioSummary>;
    },
    // Configure stale time and caching
    staleTime: 1000 * 60, // Consider data stale after 1 minute
    cacheTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    // Disable background refetching since we use WebSocket for updates
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    data,
    isLoading,
    error,
  };
} 