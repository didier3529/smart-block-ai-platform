"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Filter, Search, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useNFTCollections, useNFTAnalysis } from "@/hooks/use-nft-analysis"
import { NFTOverview } from "@/components/nft/nft-overview"
import { NFTAdvisorViz } from "@/components/agents/visualization/NFTAdvisorViz"
import { Skeleton } from "@/components/ui/skeleton"
import { NetworkType } from "@/types/blockchain"

// PPR PLAN: The NFT page is a candidate for Partial Pre-Rendering (PPR).
// - Static: Page metadata, headings, tab structure, timeframe buttons.
// - Dynamic: NFTOverview, collections table (real-time NFT data).
// Next step: Use Next.js 15 PPR API to statically render layout/headings/tabs, dynamically render NFT modules.

// Next.js 15 PPR: Mark this page as dynamic for real-time/dynamic NFT data.
export const dynamic = "force-dynamic";

export default function NFTPage() {
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m" | "3m" | "1y">("1d")
  const [nftTab, setNftTab] = useState<"collections" | "owned" | "watchlist">("collections")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("ethereum")

  const { data: collections, isLoading: isLoadingCollections } = useNFTCollections()

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">NFT Analytics</h1>
          <p className="text-muted-foreground">Track and analyze NFT collection performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search collections..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid-cols-auto-fill">
        <NFTOverview />
      </div>

      {/* Navigation */}
      <div className="space-y-4">
        <div className="card p-1">
          <div className="flex space-x-1">
            <Button
              variant={nftTab === "collections" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setNftTab("collections")}
            >
              Collections
            </Button>
            <Button
              variant={nftTab === "owned" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setNftTab("owned")}
            >
              My NFTs
            </Button>
            <Button
              variant={nftTab === "watchlist" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setNftTab("watchlist")}
            >
              Watchlist
            </Button>
          </div>
        </div>

        <div className="card p-1">
          <div className="flex space-x-1">
            {["1d", "1w", "1m", "3m", "1y"].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setTimeframe(tf as typeof timeframe)}
              >
                {tf.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-row">
              <th className="table-cell text-left">#</th>
              <th className="table-cell text-left">Collection</th>
              <th className="table-cell text-right">Floor Price</th>
              <th className="table-cell text-right">{timeframe.toUpperCase()} Change</th>
              <th className="table-cell text-right">Volume</th>
              <th className="table-cell text-right">Items</th>
              <th className="table-cell text-right">Owners</th>
              <th className="table-cell text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingCollections ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell"><Skeleton className="h-6 w-6" /></td>
                  <td className="table-cell"><Skeleton className="h-10 w-40" /></td>
                  <td className="table-cell text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  <td className="table-cell text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  <td className="table-cell text-right"><Skeleton className="h-6 w-24 ml-auto" /></td>
                  <td className="table-cell text-right"><Skeleton className="h-6 w-16 ml-auto" /></td>
                  <td className="table-cell text-right"><Skeleton className="h-6 w-16 ml-auto" /></td>
                  <td className="table-cell text-right"><Skeleton className="h-6 w-8 ml-auto" /></td>
                </tr>
              ))
            ) : collections?.pages?.flatMap(page => page.collections).map((collection, index) => (
              <tr key={collection.address} className="table-row">
                <td className="table-cell">{index + 1}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">NFT</span>
                    </div>
                    <div>
                      <div className="font-medium">{collection.name}</div>
                      <div className="text-sm text-muted-foreground">{collection.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-right font-medium">{collection.floorPrice} ETH</td>
                <td className={cn(
                  "table-cell text-right font-medium",
                  collection.floorPriceChange24h >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  <span className="flex items-center justify-end">
                    {collection.floorPriceChange24h >= 0 ? (
                      <ArrowUp className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDown className="mr-1 h-3 w-3" />
                    )}
                    {Math.abs(collection.floorPriceChange24h).toFixed(2)}%
                  </span>
                </td>
                <td className="table-cell text-right font-medium">{collection.volume24h} ETH</td>
                <td className="table-cell text-right text-muted-foreground">{collection.totalSupply}</td>
                <td className="table-cell text-right text-muted-foreground">{collection.holders}</td>
                <td className="table-cell text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted"
                    onClick={() => {
                      // Toggle watchlist
                    }}
                  >
                    <StarOff className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 