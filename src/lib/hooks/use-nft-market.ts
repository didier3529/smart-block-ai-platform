import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface NFTCollection {
  name: string
  floorPrice: string
  change: string
  volume: string
  items: string
  owners: string
}

export interface NFTMarketData {
  collections: NFTCollection[]
}

export function useNFTMarket(timeframe: "1d" | "1w" | "1m" | "1y") {
  return useQuery<NFTMarketData>({
    queryKey: ["nft-market", timeframe],
    queryFn: async () => {
      const { data } = await api.get(`/api/nft/market?timeframe=${timeframe}`)
      return data
    },
  })
} 