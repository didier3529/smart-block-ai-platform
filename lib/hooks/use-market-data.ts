import { useQuery } from '@tanstack/react-query';
import { useBlockchainWebSocket } from './use-blockchain-websocket';
import { MarketData } from '../types/market';

interface UseMarketDataOptions {
  chainId: number;
  timeframe: string;
  onUpdate?: (data: MarketData) => void;
}

export function useMarketData({ chainId, timeframe, onUpdate }: UseMarketDataOptions) {
  // Set up WebSocket connection for real-time updates
  useBlockchainWebSocket({
    chainId,
    eventTypes: ['market:price', 'market:volume', 'market:liquidity'],
    onMessage: (event) => {
      if (onUpdate && event.data) {
        onUpdate(event.data as MarketData);
      }
    },
    onError: (error) => {
      console.error('Market data WebSocket error:', error);
    }
  });

  // Fetch initial market data
  const { data, isLoading, error } = useQuery({
    queryKey: ['market-data', chainId, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/market/data?chainId=${chainId}&timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json() as Promise<MarketData>;
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