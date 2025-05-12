import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api/config';
import { toast } from '@/components/ui/use-toast';

export interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export function useMarketData(symbol = 'ETH', timeframe = '1d') {
  return useQuery({
    queryKey: ['market', symbol, timeframe],
    queryFn: async () => {
      try {
        const response = await apiClient.get<MarketData>(`/api/market/data?symbol=${symbol}&timeframe=${timeframe}`);
        return response.data;
      } catch (error) {
        const apiError = error as ApiError;
        
        // Show appropriate error message based on error type
        if (apiError.code === 'ECONNABORTED' || apiError.details?.timeout) {
          toast({
            title: "Request Timeout",
            description: "Market data is taking longer than expected to load. Retrying...",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error Loading Market Data",
            description: apiError.message || "Failed to load market data. Please try again.",
            variant: "destructive",
          });
        }
        
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
} 