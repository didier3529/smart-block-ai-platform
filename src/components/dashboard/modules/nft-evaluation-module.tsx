"use client"

import { useState } from "react"
import { MoreHorizontal, ArrowUp, ArrowDown, Image } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNFTContext } from "@/lib/providers/nft-provider"

interface NFTEvaluationModuleProps {
  isLoading?: boolean
}

export function NFTEvaluationModule({ isLoading = false }: NFTEvaluationModuleProps) {
  const { nftData, isLoading: dataLoading } = useNFTContext()
  
  console.log('[NFTEvaluationModule] nftData:', nftData);
  console.log('[NFTEvaluationModule] collections length:', nftData?.collections?.length);
  
  const moduleLoading = isLoading || dataLoading;

  // Format floor price with 2 decimal places
  const formatPrice = (price: string | undefined): string => {
    if (!price) return 'N/A';
    const parsedPrice = parseFloat(price);
    return isNaN(parsedPrice) ? price : parsedPrice.toFixed(2);
  };
  
  // Format large numbers with K, M suffix for better readability
  const formatLargeNumber = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  };

  // Use data from context and ensure we have at most 6 collections
  const nftCollections = (nftData?.collections || [])
    .slice(0, 6) // Ensure we have at most 6 collections even client-side
    .map(collection => ({
      name: collection.name || "Unknown Collection",
      // Clean up image URL - ensure it's a valid URL or empty string
      image: (collection.image && typeof collection.image === 'string' && 
              (collection.image.startsWith('http') || collection.image.startsWith('/'))) 
              ? collection.image 
              : "",
      floorPrice: collection.floorPrice ? `${formatPrice(collection.floorPrice)} ${collection.floorPriceCurrency || 'ETH'}` : 'N/A',
      // Use floorPriceChange for change if it's a percentage, otherwise show a fixed placeholder
      change: collection.floorPriceChange && !isNaN(parseFloat(collection.floorPriceChange)) 
        ? (parseFloat(collection.floorPriceChange) >= 0 ? `+${collection.floorPriceChange}%` : `${collection.floorPriceChange}%`)
        : "-1.50%", // Fixed placeholder instead of random values
      volume: collection.totalVolume ? `${formatLargeNumber(collection.totalVolume)} ETH` : 'N/A',
      items: collection.itemCount ? formatLargeNumber(collection.itemCount) : 'N/A',
      owners: collection.ownerCount ? formatLargeNumber(collection.ownerCount) : 'N/A',
    }));

  if (moduleLoading) {
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image className="h-6 w-6 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">NFT Market Overview</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {nftCollections.length === 0 ? (
        <div className="p-4 text-center text-gray-400">
          No NFT collections found. Check your API connection.
        </div>
      ) : (
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
              {nftCollections.map((collection, index) => (
                <tr key={`${collection.name}-${index}`} className="text-sm">
                  <td className="py-3">
                    <div className="flex items-center">
                      {collection.image ? (
                        <img 
                          src={collection.image} 
                          alt={collection.name}
                          className="mr-2 h-8 w-8 rounded-md object-cover"
                          loading="eager"
                          onError={(e) => {
                            console.log(`Image failed to load for ${collection.name}:`, collection.image);
                            // Replace with colorful gradient based on collection name for uniqueness
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            
                            // Create a new gradient element to replace the image
                            const placeholder = document.createElement('div');
                            placeholder.className = 'mr-2 h-8 w-8 rounded-md bg-gradient-to-br from-purple-500/30 to-blue-600/30';
                            target.parentElement?.insertBefore(placeholder, target);
                          }}
                        />
                      ) : (
                        <div className="mr-2 h-8 w-8 rounded-md bg-gradient-to-br from-purple-500/30 to-blue-600/30"></div>
                      )}
                      <div className="font-medium text-white">{collection.name}</div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium text-white">{collection.floorPrice}</td>
                  <td
                    className={cn(
                      "py-3 text-right font-medium",
                      collection.change.startsWith("+") ? "text-green-400" : 
                      collection.change === 'N/A' ? "text-gray-400" : "text-red-400",
                    )}
                  >
                    <span className="flex items-center justify-end">
                      {collection.change.startsWith("+") ? (
                        <ArrowUp className="mr-1 h-3 w-3" />
                      ) : collection.change !== 'N/A' ? (
                        <ArrowDown className="mr-1 h-3 w-3" />
                      ) : null}
                      {collection.change}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-white">{collection.volume}</td>
                  <td className="py-3 text-right font-medium text-white">{collection.items}</td>
                  <td className="py-3 text-right font-medium text-white">{collection.owners}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
