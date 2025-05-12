"use client"

import { useState } from "react"
import { PortfolioHeader } from "@/components/portfolio/portfolio-header"
import { PortfolioOverview } from "@/components/portfolio/portfolio-overview"
import { PortfolioAssets } from "@/components/portfolio/portfolio-assets"
import { PortfolioAnalytics } from "@/components/portfolio/portfolio-analytics"
import { PortfolioAllocation } from "@/components/portfolio/portfolio-allocation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorBoundary } from "@/components/error-boundary"

// Next.js 15 PPR: Mark this page as dynamic for real-time/user-specific portfolio content.
export const dynamic = "force-dynamic"

export default function PortfolioPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <ErrorBoundary>
        <PortfolioHeader />
      </ErrorBoundary>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <ErrorBoundary>
                <PortfolioOverview />
              </ErrorBoundary>
            </div>
            <div>
              <ErrorBoundary>
                <PortfolioAllocation />
              </ErrorBoundary>
            </div>
          </div>
          <ErrorBoundary>
            <PortfolioAssets />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ErrorBoundary>
            <PortfolioAnalytics />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <ErrorBoundary>
            <PortfolioAssets />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// PPR PLAN: The portfolio page is a candidate for Partial Pre-Rendering (PPR).
// - Static: Page metadata, headings, tab structure.
// - Dynamic: PortfolioAnalytics, PortfolioAssets (real-time/user data).
// Next step: Use Next.js 15 PPR API to statically render layout/headings/tabs, dynamically render analytics/assets modules. 