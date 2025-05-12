"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@tanstack/react-query"

interface NFTContextType {
  isLoading: boolean
  nftData: any // Replace with proper type
  error: Error | null
  refetch: () => void
}

const NFTContext = createContext<NFTContextType | undefined>(undefined)

export function NFTProvider({ children }: { children: React.ReactNode }) {
  const {
    data: nftData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["nft"],
    queryFn: async () => {
      try {
        // Safely implement NFT data fetching with proper error handling
        // For now, return mock data instead of empty object
        return {
          collections: [
            {
              name: "Bored Ape Yacht Club",
              symbol: "BAYC",
              floorPrice: 30.5,
              volume24h: 128.3,
              items: 10000,
              owners: 6452
            },
            {
              name: "CryptoPunks",
              symbol: "PUNK",
              floorPrice: 48.2,
              volume24h: 95.7,
              items: 10000,
              owners: 3725
            }
          ]
        }
      } catch (err) {
        console.error("Failed to fetch NFT data:", err);
        // Return fallback data instead of throwing error
        return { collections: [] };
      }
    },
    // Don't fail on error, handle gracefully
    retry: 2,
    retryDelay: 1000,
  })

  return (
    <NFTContext.Provider
      value={{
        isLoading,
        nftData: nftData || { collections: [] },
        error: error as Error | null,
        refetch,
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