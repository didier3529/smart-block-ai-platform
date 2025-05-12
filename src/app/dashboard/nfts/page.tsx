"use client"

import { NFTEvaluationModule } from "@/components/dashboard/modules/nft-evaluation-module"
import { useNFTContext } from "@/lib/providers/nft-provider"

export default function NFTsPage() {
  const { isLoading } = useNFTContext()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">NFT Analytics</h1>
      <div className="space-y-6">
        <NFTEvaluationModule isLoading={isLoading} />
        {/* Additional NFT analytics components will be added here */}
      </div>
    </div>
  )
} 