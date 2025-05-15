"use client"

import { useState } from "react"
import { DirectPortfolioOverview } from "./modules/direct-portfolio-overview"
import DirectPriceDisplay from "@/components/direct-price-display"
import { SmartContractAnalyzer } from "./modules/smart-contract-analyzer"
import { NFTEvaluationModule } from "./modules/nft-evaluation-module"

interface DashboardPageProps {
  authLoading: boolean;
}

export function DashboardPage({ authLoading }: DashboardPageProps) {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DirectPriceDisplay />
        <DirectPortfolioOverview isLoading={authLoading} />
        <NFTEvaluationModule isLoading={authLoading} />
        <SmartContractAnalyzer isLoading={authLoading} />
      </div>
    </div>
  )
}
