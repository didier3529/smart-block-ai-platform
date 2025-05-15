"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Filter, Search, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { NetworkType } from "@/types/blockchain"
import { NFTGrid } from "@/components/nft/nft-grid"
import { useNftMarketplaceStats, useNfts, useNftCollections } from "@/lib/hooks/use-nft-data"
import { NFT, NFTCollection } from "@/lib/types/nft-types"
import { NFTEvaluationModule } from "@/components/dashboard/modules/nft-evaluation-module"
import { useNFTContext } from "@/lib/providers/nft-provider"

// Next.js 15 PPR: Mark this page as dynamic for real-time/dynamic NFT data.
export const dynamic = "force-dynamic";

export default function NFTsPage() {
  const { isLoading: isContextLoading } = useNFTContext()
  
  const [nftTab, setNftTab] = useState<"collections" | "owned" | "watchlist">("collections")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("ethereum")

  const { data: nftCollectionsData, isLoading: isLoadingCollections } = useNftCollections();
  const { data: nftData, isLoading: isLoadingNfts, error: nftsError } = useNfts({ 
    searchQuery: searchQuery || undefined, 
    pageSize: 10 
  });

  const handleViewNftDetails = (nft: NFT) => {
    console.log("View details for NFT:", nft.contractAddress, nft.tokenId);
    // Here you would typically navigate to a detail page or open a modal
    // e.g., router.push(`/nfts/${nft.contractAddress}/${nft.tokenId}`);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">NFT Analysis</h1>
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

            {/* Navigation */}
      <div className="space-y-4">
        <div className="bg-background rounded-lg border border-[#333] p-1">
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
      </div>

      {/* NFT Evaluation Module from dashboard */}
      <div className="space-y-4">
        <NFTEvaluationModule isLoading={isContextLoading} />
      </div>

      {/* Featured NFTs Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-card-foreground mb-4">Featured NFTs</h2>
        <div className="flex items-center justify-center p-12 border border-dashed rounded-lg border-muted-foreground/50">
          <p className="text-2xl font-semibold text-muted-foreground">COMING SOON</p>
        </div>
      </div>

            {/* Featured NFTs Section (without table/market overview) */}
    </div>
  )
} 