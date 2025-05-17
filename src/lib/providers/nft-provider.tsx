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
        // Use our service to fetch real collection data
        const response = await getNftCollections();
        console.log("[NFTProvider] Fetched collections:", response);
        
        // Extra validation check - make sure we have collections
        if (response && (!response.collections || response.collections.length === 0)) {
          console.warn("[NFTProvider] No collections found in response, using fallback data");
          
          // Return default fallback data
          return {
            collections: fallbackCollections(),
          };
        }
        
        return response;
      } catch (err) {
        console.error("Failed to fetch NFT collections:", err);
        console.warn("[NFTProvider] Using fallback collections due to error");
        
        // Always return fallback data on error
        return {
          collections: fallbackCollections(),
        };
      }
    },
    retry: 1, // Reduce retries since we have fallback
    retryDelay: 1000,
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid extra API calls
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        // Use our service to fetch market stats
        const response = await getNftMarketplaceStats();
        console.log("[NFTProvider] Fetched stats:", response);
        return response;
      } catch (err) {
        console.error("Failed to fetch NFT stats:", err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = isLoadingCollections || isLoadingStats;
  const error = collectionsError || statsError;

  // Combine the data
  const nftData = {
    collections: collectionsData?.collections || fallbackCollections(),
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

// Fallback collections to guarantee data is available
function fallbackCollections(): NFTCollection[] {
  return [
    {
      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'Bored Ape Yacht Club',
      symbol: "BAYC",
      contractType: "ERC721",
      description: "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs",
      floorPrice: 12.5,
      floorPriceChange: -2.21,
      totalVolume: 1108635,
      ownerCount: 6400,
      itemCount: 10000,
      image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
      name: 'CryptoPunks',
      symbol: "PUNK",
      contractType: "ERC721",
      description: "CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard.",
      floorPrice: 46.99,
      floorPriceChange: -3.85,
      totalVolume: 256318,
      ownerCount: 3500,
      itemCount: 10000,
      image: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
      name: 'Doodles',
      symbol: "DOODLE",
      contractType: "ERC721",
      description: "A community-driven collectibles project featuring art by Burnt Toast.",
      floorPrice: 1.25,
      floorPriceChange: -4.66,
      totalVolume: 354672,
      ownerCount: 5200,
      itemCount: 10000,
      image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      symbol: "MAYC",
      contractType: "ERC721",
      description: "The Mutant Ape Yacht Club is a collection of Mutant Apes",
      floorPrice: 2.27,
      floorPriceChange: -0.45,
      totalVolume: 218829,
      ownerCount: 12800,
      itemCount: 19423,
      image: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
      name: 'Clone X',
      symbol: "CLONEX",
      contractType: "ERC721",
      description: "CLONE X IS A COLLECTION OF 20,000 NEXT-GEN AVATARS",
      floorPrice: 1.14,
      floorPriceChange: -5.5,
      totalVolume: 220982,
      ownerCount: 9600,
      itemCount: 20000,
      image: 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    }
  ];
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