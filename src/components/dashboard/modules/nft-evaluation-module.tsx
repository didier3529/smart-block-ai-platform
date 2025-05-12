"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNFTContext } from "@/lib/providers/nft-provider"

interface NFTEvaluationModuleProps {
  isLoading?: boolean
}

export function NFTEvaluationModule({ isLoading = false }: NFTEvaluationModuleProps) {
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m" | "1y">("1w")
  const { nftData } = useNFTContext()

  // Mock data - use as fallback if context data is missing
  const fallbackCollections = [
    {
      name: "Bored Ape Yacht Club",
      floorPrice: "68.5 ETH",
      change: "+2.3%",
      volume: "1,245 ETH",
      items: "10,000",
      owners: "6,314",
    },
    {
      name: "CryptoPunks",
      floorPrice: "54.2 ETH",
      change: "-1.8%",
      volume: "987 ETH",
      items: "10,000",
      owners: "3,562",
    },
    {
      name: "Azuki",
      floorPrice: "12.8 ETH",
      change: "+5.6%",
      volume: "654 ETH",
      items: "10,000",
      owners: "5,123",
    },
    {
      name: "Doodles",
      floorPrice: "8.2 ETH",
      change: "+3.1%",
      volume: "432 ETH",
      items: "10,000",
      owners: "4,876",
    },
  ]

  // Use data from context or fallback to mock data
  const nftCollections = nftData?.collections?.length ? 
    nftData.collections.map(collection => ({
      name: collection.name,
      floorPrice: `${collection.floorPrice} ETH`,
      change: "+2.3%", // Mock change as it's not in the provider data
      volume: `${collection.volume24h} ETH`,
      items: collection.items?.toString() || "10,000",
      owners: collection.owners?.toString() || "6,000+",
    })) : fallbackCollections;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex animate-pulse flex-col space-y-4">
          <div className="h-6 w-48 rounded bg-gray-700"></div>
          <div className="h-4 w-24 rounded bg-gray-700"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-gray-700"></div>
                <div className="h-4 w-20 rounded bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">NFT Market Overview</h2>
        <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex space-x-2">
        {(["1d", "1w", "1m", "1y"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              timeframe === t
                ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white",
            )}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium text-gray-400">
              <th className="pb-2">Collection</th>
              <th className="pb-2 text-right">Floor Price</th>
              <th className="pb-2 text-right">Change</th>
              <th className="pb-2 text-right">Volume</th>
              <th className="pb-2 text-right">Items</th>
              <th className="pb-2 text-right">Owners</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {nftCollections.map((collection) => (
              <tr key={collection.name} className="text-sm">
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="mr-2 h-8 w-8 rounded-md bg-gradient-to-br from-purple-500/30 to-blue-500/30"></div>
                    <div className="font-medium text-white">{collection.name}</div>
                  </div>
                </td>
                <td className="py-3 text-right font-medium text-white">{collection.floorPrice}</td>
                <td
                  className={cn(
                    "py-3 text-right font-medium",
                    collection.change.startsWith("+") ? "text-green-400" : "text-red-400",
                  )}
                >
                  {collection.change}
                </td>
                <td className="py-3 text-right font-medium text-white">{collection.volume}</td>
                <td className="py-3 text-right font-medium text-white">{collection.items}</td>
                <td className="py-3 text-right font-medium text-white">{collection.owners}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
