import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, getErrorMessage } from '@/lib/api/config';
import { PortfolioSummary, PortfolioToken, NetworkType } from '@/types/blockchain';
import { portfolioKeys } from '@/lib/query-keys';
import { useTokenPrices } from '@/lib/providers/price-provider';

// Query keys
export const portfolioKeys = {
  all: ['portfolio'] as const,
  summary: () => [...portfolioKeys.all, 'summary'] as const,
  tokens: () => [...portfolioKeys.all, 'tokens'] as const,
  token: (address: string, network: NetworkType) =>
    [...portfolioKeys.tokens(), address, network] as const,
};

// Fetch portfolio summary
export function usePortfolioSummary() {
  const { prices } = useTokenPrices(['BTC', 'ETH', 'SOL', 'ADA', 'DOT']);
  
  return useQuery({
    queryKey: portfolioKeys.summary(),
    queryFn: async (): Promise<PortfolioSummary> => {
      const { data } = await apiClient.get('/api/portfolio/summary');
      
      // Update token values with real-time prices
      if (data.tokens) {
        data.tokens = data.tokens.map(token => {
          const price = prices[token.symbol];
          if (price) {
            return {
              ...token,
              price: price.current,
              value: token.balance * price.current,
              change24h: ((price.current - price.historical) / price.historical) * 100
            };
          }
          return token;
        });

        // Recalculate total value and changes
        data.totalValue = data.tokens.reduce((sum, token) => sum + token.value, 0);
        const totalHistorical = data.tokens.reduce((sum, token) => {
          const price = prices[token.symbol];
          return sum + (token.balance * (price?.historical || 0));
        }, 0);
        data.percentChange24h = ((data.totalValue - totalHistorical) / totalHistorical) * 100;
      }

      return data;
    },
    enabled: Object.keys(prices).length > 0 // Only fetch when we have prices
  });
}

// Fetch portfolio tokens for a specific network
export function usePortfolioTokens(network: NetworkType = 'ethereum') {
  const { prices } = useTokenPrices(['BTC', 'ETH', 'SOL', 'ADA', 'DOT']);
  
  return useQuery({
    queryKey: portfolioKeys.tokens(network),
    queryFn: async (): Promise<PortfolioToken[]> => {
      const { data } = await apiClient.get(`/api/portfolio/tokens?network=${network}`);
      
      // Update token values with real-time prices
      return data.map(token => {
        const price = prices[token.symbol];
        if (price) {
          return {
            ...token,
            price: price.current,
            value: token.balance * price.current,
            change24h: ((price.current - price.historical) / price.historical) * 100
          };
        }
        return token;
      });
    },
    enabled: Object.keys(prices).length > 0 // Only fetch when we have prices
  });
}

// Fetch single token details
export function usePortfolioToken(address: string, network: NetworkType) {
  return useQuery({
    queryKey: portfolioKeys.token(address, network),
    queryFn: async (): Promise<PortfolioToken> => {
      const { data } = await apiClient.get(
        `/api/portfolio/tokens/${network}/${address}`
      );
      return data;
    },
    enabled: Boolean(address && network),
  });
}

// Add token to portfolio
export function useAddToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      network,
    }: {
      address: string;
      network: NetworkType;
    }) => {
      const { data } = await apiClient.post('/api/portfolio/tokens', {
        address,
        network,
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

// Remove token from portfolio
export function useRemoveToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      network,
    }: {
      address: string;
      network: NetworkType;
    }) => {
      await apiClient.delete(`/api/portfolio/tokens/${network}/${address}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

// Update token settings
export function useUpdateTokenSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      network,
      settings,
    }: {
      address: string;
      network: NetworkType;
      settings: {
        alerts?: boolean;
        priceThreshold?: number;
        notes?: string;
      };
    }) => {
      const { data } = await apiClient.patch(
        `/api/portfolio/tokens/${network}/${address}`,
        settings
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: portfolioKeys.token(variables.address, variables.network),
      });
    },
  });
}

// Composite hook for portfolio overview usage
export function usePortfolio({ timeframe = '1w', network = 'ethereum' }: { timeframe?: string; network?: NetworkType }) {
  const summary = usePortfolioSummary();
  const tokens = usePortfolioTokens(network);
  
  return {
    summary: summary.data,
    tokens: tokens.data,
    isLoading: summary.isLoading || tokens.isLoading,
    error: summary.error || tokens.error,
  };
} 