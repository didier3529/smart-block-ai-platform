import { useQuery, useQueryClient } from 'react-query';
import { nftService, supportedChains } from '@/lib/services/nft-service';
import { NFTCollection, NFTMarketOverview, NFTAsset, NFTCollectionStats, NFTFilter } from '@/lib/types/nft-types';

// Query keys for caching
export const nftQueryKeys = {
  collections: ['nft', 'collections'] as const,
  collection: (address: string, chainId: string = supportedChains.ethereum) => 
    ['nft', 'collection', chainId, address] as const,
  assetsByCollection: (address: string, chainId: string = supportedChains.ethereum) => 
    ['nft', 'assets', 'collection', chainId, address] as const,
  assetsByOwner: (ownerAddress: string, chainId: string = supportedChains.ethereum) => 
    ['nft', 'assets', 'owner', chainId, ownerAddress] as const,
  marketOverview: (chainId: string = supportedChains.ethereum) => 
    ['nft', 'market', 'overview', chainId] as const,
  collectionStats: (address: string, chainId: string = supportedChains.ethereum) => 
    ['nft', 'collection', 'stats', chainId, address] as const,
};

/**
 * Hook for fetching NFT collections with optional filtering
 */
export const useNFTCollections = (filters?: NFTFilter) => {
  return useQuery(
    [...nftQueryKeys.collections, filters],
    async () => {
      const response = await nftService.getNftCollections(filters);
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch NFT collections');
      }
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );
};

/**
 * Hook for fetching NFT market overview data
 */
export const useNFTMarketOverview = (chainId: string = supportedChains.ethereum) => {
  return useQuery(
    nftQueryKeys.marketOverview(chainId),
    async () => {
      const response = await nftService.getNftMarketOverview(chainId);
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch NFT market overview');
      }
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );
};

/**
 * Hook for fetching NFT assets by collection
 */
export const useNFTsByCollection = (
  contractAddress: string,
  chainId: string = supportedChains.ethereum,
  limit: number = 20,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();
  
  return useQuery(
    nftQueryKeys.assetsByCollection(contractAddress, chainId),
    async () => {
      const response = await nftService.getNftsByCollection(contractAddress, chainId, limit);
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch NFTs by collection');
      }
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: enabled && !!contractAddress,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        // Individual asset caching
        data.result.forEach((asset) => {
          queryClient.setQueryData(
            nftQueryKeys.collection(asset.tokenAddress, chainId),
            asset
          );
        });
      },
    }
  );
};

/**
 * Hook for fetching NFT assets by owner
 */
export const useNFTsByOwner = (
  ownerAddress: string,
  chainId: string = supportedChains.ethereum,
  limit: number = 20,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();
  
  return useQuery(
    nftQueryKeys.assetsByOwner(ownerAddress, chainId),
    async () => {
      const response = await nftService.getNftsByOwner(ownerAddress, chainId, limit);
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch NFTs by owner');
      }
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: enabled && !!ownerAddress,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        // Individual asset caching
        data.result.forEach((asset) => {
          queryClient.setQueryData(
            nftQueryKeys.collection(asset.tokenAddress, chainId),
            asset
          );
        });
      },
    }
  );
};

/**
 * Hook for fetching collection statistics
 */
export const useNFTCollectionStats = (
  contractAddress: string,
  chainId: string = supportedChains.ethereum,
  enabled: boolean = true
) => {
  return useQuery(
    nftQueryKeys.collectionStats(contractAddress, chainId),
    async () => {
      const response = await nftService.getCollectionStats(contractAddress, chainId);
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch collection stats');
      }
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: enabled && !!contractAddress,
      refetchOnWindowFocus: false,
    }
  );
};

export default {
  useNFTCollections,
  useNFTMarketOverview,
  useNFTsByCollection,
  useNFTsByOwner,
  useNFTCollectionStats,
  nftQueryKeys,
}; 