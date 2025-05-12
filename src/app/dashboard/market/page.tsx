"use client"

import { useMarketContext } from "@/lib/providers/market-provider"
import { MarketTrendAnalysis } from "@/components/dashboard/modules/market-trend-analysis"

export default function MarketPage() {
  const { isLoading } = useMarketContext()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Market Analysis</h1>
      <div className="space-y-6">
        <MarketTrendAnalysis isLoading={isLoading} />
        {/* Additional market analysis components will be added here */}
      </div>
    </div>
  )
} 