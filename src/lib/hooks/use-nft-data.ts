import { useQuery, useInfiniteQuery, QueryKey } from '@tanstack/react-query';
import {
  getNftMarketplaceStats,
  getNftCollections,
  getNftCollectionById,
  getNfts,
  getNftDetails,
  getNftsByCollectionId // We can add a hook for this too if needed
} from '../services/nft-service';
import type {
  NFTMarketplaceStats,
  NFTCollection,
  NFT,
  NFTQueryFilters,
  PaginatedCollectionResponse,
  PaginatedNFTResponse
} from '../types/nft-types';

const NFT_QUERY_KEYS = {
  all: ['nfts'] as const,
  marketplaceStats: () => [...NFT_QUERY_KEYS.all, 'marketplaceStats'] as const,
  collections: (filters?: NFTQueryFilters) => [...NFT_QUERY_KEYS.all, 'collections', filters || {}] as const,
  collectionById: (id?: string) => [...NFT_QUERY_KEYS.all, 'collection', id] as const,
  nftsList: (filters?: NFTQueryFilters) => [...NFT_QUERY_KEYS.all, 'list', filters || {}] as const,
  nftById: (contractAddress?: string, tokenId?: string) => [...NFT_QUERY_KEYS.all, 'detail', contractAddress, tokenId] as const,
  nftsByCollectionId: (collectionId?: string, filters?: NFTQueryFilters) => [...NFT_QUERY_KEYS.all, 'byCollection', collectionId, filters || {}] as const,
};

/**
 * Hook to fetch overall NFT marketplace statistics.
 */
export const useNftMarketplaceStats = () => {
  return useQuery<NFTMarketplaceStats, Error>({
    queryKey: NFT_QUERY_KEYS.marketplaceStats(),
    queryFn: getNftMarketplaceStats,
  });
};

/**
 * Hook to fetch a paginated list of NFT collections.
 * Supports filtering.
 */
export const useNftCollections = (filters?: NFTQueryFilters) => {
  console.log("<<<<<< useNftCollections HOOK IS BEING CALLED >>>>>> With filters:", filters);

  return useQuery<
    PaginatedCollectionResponse, // TQueryFnData: Type of data returned by queryFn
    Error,                       // TError
    PaginatedCollectionResponse, // TData: Type of data returned by the hook (after select)
    ReturnType<typeof NFT_QUERY_KEYS.collections> // TQueryKey: Explicitly using the type of the generated key
  >({
    queryKey: NFT_QUERY_KEYS.collections(filters),
    queryFn: () => getNftCollections(filters), // Use the actual service function
    select: (data: PaginatedCollectionResponse) => data,
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch details for a specific NFT collection by its ID.
 */
export const useNftCollectionDetails = (collectionId?: string) => {
  return useQuery<NFTCollection | undefined, Error>({
    queryKey: NFT_QUERY_KEYS.collectionById(collectionId),
    queryFn: () => collectionId ? getNftCollectionById(collectionId) : Promise.resolve(undefined),
    enabled: !!collectionId, // Only run query if collectionId is provided
  });
};

/**
 * Hook to fetch a paginated list of NFTs.
 * Supports filtering.
 */
export const useNfts = (filters?: NFTQueryFilters) => {
  return useQuery<
    PaginatedNFTResponse, // TQueryFnData: Data type from queryFn
    Error,                // TError
    PaginatedNFTResponse, // TData: Data type returned by the hook (after select)
    ReturnType<typeof NFT_QUERY_KEYS.nftsList> // TQueryKey: Explicitly using the type of the generated key
  >({
    queryKey: NFT_QUERY_KEYS.nftsList(filters),
    queryFn: () => getNfts(filters),
    // The select function confirms the shape of the data returned by the hook.
    // It receives TQueryFnData and should return TData.
    select: (data: PaginatedNFTResponse) => data,
    keepPreviousData: true, // Useful for pagination
  });
};

/**
 * Hook to fetch details for a specific NFT by its contract address and token ID.
 */
export const useNftDetails = (contractAddress?: string, tokenId?: string) => {
  return useQuery<NFT | undefined, Error>({
    queryKey: NFT_QUERY_KEYS.nftById(contractAddress, tokenId),
    queryFn: () => (contractAddress && tokenId) ? getNftDetails(contractAddress, tokenId) : Promise.resolve(undefined),
    enabled: !!contractAddress && !!tokenId, // Only run if both params are provided
  });
};

/**
 * Hook to fetch NFTs for a specific collection ID.
 * This is an example of a more specific hook using one of the service's convenience functions.
 */
export const useNftsByCollection = (collectionId?: string, page: number = 1, pageSize: number = 10) => {
  const filters: NFTQueryFilters = { collectionIds: collectionId ? [collectionId] : undefined, page, pageSize };
  return useQuery<PaginatedNFTResponse, Error>({
    queryKey: NFT_QUERY_KEYS.nftsByCollectionId(collectionId, filters),
    queryFn: () => collectionId ? getNftsByCollectionId(collectionId, page, pageSize) : Promise.reject(new Error('Collection ID is required')),
    enabled: !!collectionId,
    keepPreviousData: true,
  });
};

// Example for infinite scrolling, if desired for a particular list
// export const useInfiniteNfts = (filters?: NFTQueryFilters) => {
//   return useInfiniteQuery<
//     PaginatedNFTResponse,
//     Error,
//     PaginatedNFTResponse,
//     QueryKey,
//     number // Page parameter type
//   >(
//     NFT_QUERY_KEYS.nftsList(filters), // Base key
//     async ({ pageParam = 1 }) => {
//       const currentFilters = { ...filters, page: pageParam };
//       return getNfts(currentFilters);
//     },
//     {
//       getNextPageParam: (lastPage) => {
//         if (lastPage.currentPage < lastPage.totalPages) {
//           return lastPage.currentPage + 1;
//         }
//         return undefined;
//       },
//       keepPreviousData: true,
//     }
//   );
// }; 