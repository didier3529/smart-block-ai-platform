"use client"

import { DirectPortfolioOverview } from "@/components/dashboard/modules/direct-portfolio-overview"

export default function PortfolioPage() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold text-white">Portfolio</h1>
      <DirectPortfolioOverview />
    </div>
  )
} 