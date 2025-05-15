"use client"

import * as React from "react"
import { useMarketContext } from "@/lib/providers/market-provider"
import DirectPriceDisplay from "@/components/direct-price-display"

// PPR PLAN: The market page is a candidate for Partial Pre-Rendering (PPR).
// - Static: Page metadata, headings, tab structure, timeframe buttons.
// - Dynamic: MarketMetrics, MarketTrendChart, MarketSentiment (real-time market data).
// Next step: Use Next.js 15 PPR API to statically render layout/headings/tabs, dynamically render market modules.

export default function MarketPage() {
  const { isLoading } = useMarketContext()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Market Analysis</h1>
      <div className="space-y-6">
        <DirectPriceDisplay />
        {/* Additional market analysis components will be added here */}
      </div>
    </div>
  )
} 