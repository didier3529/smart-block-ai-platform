"use client"

import { useState } from "react"
import { PortfolioOverview } from "./modules/portfolio-overview"
import { MarketTrendAnalysis } from "./modules/market-trend-analysis"
import { SmartContractAnalyzer } from "./modules/smart-contract-analyzer"
import { NFTEvaluationModule } from "./modules/nft-evaluation-module"

interface DashboardPageProps {
  authLoading: boolean;
}

export function DashboardPage({ authLoading }: DashboardPageProps) {
  // We can use authLoading here if needed for a top-level spinner for the dashboard page itself,
  // or pass it down to modules that might need it before they themselves call useAuth().
  // For now, we will pass it to the modules as they might be making initial data calls.

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard Overview</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PortfolioOverview isLoading={authLoading} />
        <MarketTrendAnalysis isLoading={authLoading} />
        <SmartContractAnalyzer isLoading={authLoading} />
        <NFTEvaluationModule isLoading={authLoading} />
      </div>
    </div>
  )
}
