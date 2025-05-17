"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@tanstack/react-query"
import { getNftCollections, getNftMarketplaceStats } from "@/lib/services/nft-service"
import { NFTCollection } from "@/lib/types/nft-types"

interface NFTContextType {
  isLoading: boolean
  nftData: {
    collections: NFTCollection[];
    stats?: {
      totalVolume24h?: string;
      totalSales24h?: number;
      activeCollections?: number;
      uniqueTraders24h?: number;
      averageNftPrice24h?: string;
    }
  }
  error: Error | null
  refetch: () => void
}

const NFTContext = createContext<NFTContextType | undefined>(undefined)

export function NFTProvider({ children }: { children: React.ReactNode }) {
  // Fetch collections
  const {
    data: collectionsData,
    isLoading: isLoadingCollections,
    error: collectionsError,
    refetch: refetchCollections,
  } = useQuery({
    queryKey: ["nft", "collections"],
    queryFn: async () => {
      try {
        // Use our Alchemy-based service to fetch real collection data
        const response = await getNftCollections();
        console.log("[NFTProvider] Fetched collections:", response);
        return response;
      } catch (err) {
        console.error("Failed to fetch NFT collections:", err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch market stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["nft", "stats"],
    queryFn: async () => {
      try {
        // Use our Alchemy-based service to fetch market stats
        const response = await getNftMarketplaceStats();
        console.log("[NFTProvider] Fetched stats:", response);
        return response;
      } catch (err) {
        console.error("Failed to fetch NFT stats:", err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const isLoading = isLoadingCollections || isLoadingStats;
  const error = collectionsError || statsError;

  // Combine the data
  const nftData = {
    collections: collectionsData?.collections || [],
    stats: statsData ? {
      totalVolume24h: statsData.totalVolume24h,
      totalSales24h: statsData.totalSales24h,
      activeCollections: statsData.activeCollections,
      uniqueTraders24h: statsData.uniqueTraders24h,
      averageNftPrice24h: statsData.averageNftPrice24h,
    } : undefined
  };

  return (
    <NFTContext.Provider
      value={{
        isLoading,
        nftData,
        error: error as Error | null,
        refetch: refetchCollections,
      }}
    >
      {children}
    </NFTContext.Provider>
  )
}

export function useNFTContext() {
  const context = useContext(NFTContext)
  if (context === undefined) {
    throw new Error("useNFTContext must be used within a NFTProvider")
  }
  return context
}

export function useNFT() {
  return useNFTContext();
} 