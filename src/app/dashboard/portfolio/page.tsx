"use client"

import { useState } from "react"
import { PortfolioOverview } from "@/components/dashboard/modules/portfolio-overview"
import { PortfolioAssets } from "@/components/dashboard/modules/portfolio-assets"
import { PortfolioAnalytics } from "@/components/dashboard/modules/portfolio-analytics"
import { usePortfolioContext } from "@/lib/providers/portfolio-provider"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorBoundary } from "@/components/error-boundary"

export default function PortfolioPage() {
  const { isLoading } = usePortfolioContext()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <ErrorBoundary variant="diagnostic">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="assets"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ErrorBoundary>
              <PortfolioOverview isLoading={isLoading} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <ErrorBoundary>
              <PortfolioAssets isLoading={isLoading} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ErrorBoundary>
              <PortfolioAnalytics isLoading={isLoading} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
} 