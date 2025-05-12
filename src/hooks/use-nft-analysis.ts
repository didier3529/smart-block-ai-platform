import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { NFTCollection, NFTToken, NetworkType } from '@/types/blockchain';
import { NFTAnalysis } from '@/types/ai';

// Query keys
export const nftKeys = {
  all: ['nfts'] as const,
  collections: (filters?: CollectionFilters) =>
    [...nftKeys.all, 'collections', filters] as const,
  collection: (address: string, network: NetworkType) =>
    [...nftKeys.all, 'collection', network, address] as const,
  token: (collection: string, tokenId: string, network: NetworkType) =>
    [...nftKeys.all, 'token', network, collection, tokenId] as const,
  analysis: (collection: string, network: NetworkType) =>
    [...nftKeys.all, 'analysis', network, collection] as const,
};

// Types
interface CollectionFilters {
  category?: string;
  sortBy?: 'volume' | 'floor' | 'marketCap' | 'holders';
  timeframe?: '24h' | '7d' | '30d';
  minVolume?: number;
  verified?: boolean;
}

interface CollectionResponse {
  collections: NFTCollection[];
  nextCursor?: string;
  total: number;
}

// Fetch NFT collections
export function useNFTCollections(filters?: CollectionFilters) {
  return useInfiniteQuery({
    queryKey: nftKeys.collections(filters),
    queryFn: async ({ pageParam = undefined }): Promise<CollectionResponse> => {
      const { data } = await apiClient.get('/api/nfts/collections', {
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

// Fetch single collection details
export function useNFTCollection(address: string, network: NetworkType) {
  return useQuery({
    queryKey: nftKeys.collection(address, network),
    queryFn: async (): Promise<NFTCollection> => {
      const { data } = await apiClient.get(
        `/api/nfts/collections/${network}/${address}`
      );
      return data;
    },
    enabled: Boolean(address && network),
  });
}

// Fetch single token details
export function useNFTToken(
  collection: string,
  tokenId: string,
  network: NetworkType
) {
  return useQuery({
    queryKey: nftKeys.token(collection, tokenId, network),
    queryFn: async (): Promise<NFTToken> => {
      const { data } = await apiClient.get(
        `/api/nfts/tokens/${network}/${collection}/${tokenId}`
      );
      return data;
    },
    enabled: Boolean(collection && tokenId && network),
  });
}

// Get AI analysis of NFT collection
export function useNFTAnalysis(
  collection: string,
  network: NetworkType,
  options?: {
    includeValuation?: boolean;
    includeRarity?: boolean;
    timeframe?: '24h' | '7d' | '30d';
  }
) {
  return useQuery({
    queryKey: nftKeys.analysis(collection, network),
    queryFn: async (): Promise<NFTAnalysis> => {
      const { data } = await apiClient.get(
        `/api/nfts/collections/${network}/${collection}/analyze`,
        {
          params: options,
        }
      );
      return data;
    },
    enabled: Boolean(collection && network),
    // Longer stale time for AI analysis
    staleTime: 1000 * 60 * 15 // 15 minutes
  });
}

// Get real-time collection updates
export function useRealtimeCollection(address: string, network: NetworkType) {
  return useQuery({
    queryKey: [...nftKeys.collection(address, network), 'realtime'],
    queryFn: async (): Promise<{
      floorPrice: number;
      volume24h: number;
      recentSales: Array<{
        tokenId: string;
        price: number;
        timestamp: number;
      }>;
    }> => {
      const { data } = await apiClient.get(
        `/api/nfts/collections/${network}/${address}/realtime`
      );
      return data;
    },
    enabled: Boolean(address && network),
    // Shorter polling interval for real-time data
    refetchInterval: 1000 * 30, // 30 seconds
  });
}

// Get collection activity feed
export function useCollectionActivity(
  address: string,
  network: NetworkType,
  options?: {
    type?: 'sales' | 'listings' | 'transfers' | 'all';
    from?: number;
    to?: number;
  }
) {
  return useInfiniteQuery({
    queryKey: [...nftKeys.collection(address, network), 'activity', options],
    queryFn: async ({ pageParam = undefined }) => {
      const { data } = await apiClient.get(
        `/api/nfts/collections/${network}/${address}/activity`,
        {
          params: {
            ...options,
            cursor: pageParam,
          },
        }
      );
      return data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage?.nextCursor,
    enabled: Boolean(address && network),
  });
} 