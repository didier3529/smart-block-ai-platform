"use client"

import React, { useMemo, useState } from "react"
import { usePortfolio } from "@/hooks/use-portfolio"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Search } from "lucide-react"
import { useTokenPrices } from "@/lib/providers/price-provider"

interface PortfolioAssetsProps {
  isLoading?: boolean
  className?: string
}

export function PortfolioAssets({ isLoading: parentLoading = false, className = "" }: PortfolioAssetsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"value" | "change" | "name">("value")
  const [network, setNetwork] = useState("ethereum")
  
  const { tokens, isLoading: portfolioLoading } = usePortfolio({ network })
  const { prices, isLoading: pricesLoading } = useTokenPrices(tokens?.map(t => t.symbol) || [])
  
  const isLoading = parentLoading || portfolioLoading || pricesLoading

  const filteredAndSortedAssets = useMemo(() => {
    if (!tokens || !prices) return []

    const filtered = tokens.filter(token => {
      const searchLower = searchQuery.toLowerCase()
      return (
        token.symbol.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower)
      )
    })

    const withPrices = filtered.map(token => {
      const price = prices[token.symbol]
      const value = token.balance * (price?.current || 0)
      const change = price 
        ? ((price.current - price.historical) / price.historical) * 100
        : 0

      return {
        ...token,
        value,
        change
      }
    })

    return withPrices.sort((a, b) => {
      switch (sortBy) {
        case "value":
          return b.value - a.value
        case "change":
          return b.change - a.change
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [tokens, prices, searchQuery, sortBy])

  if (isLoading) {
    return (
      <Card className={`p-6 bg-black/30 backdrop-blur-md border-white/10 ${className}`}>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-1 h-4 w-16" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 bg-black/30 backdrop-blur-md border-white/10 ${className}`}>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: "value" | "change" | "name") => setSortBy(value)}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="change">Change</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedAssets.map((asset) => (
          <div key={asset.symbol} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900"></div>
              <div>
                <div className="font-medium text-white">{asset.symbol}</div>
                <div className="text-sm text-gray-400">{asset.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-white">{formatCurrency(asset.value)}</div>
              <div className="flex items-center justify-end gap-1">
                {asset.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span
                  className={
                    asset.change >= 0 ? "text-sm text-green-400" : "text-sm text-red-400"
                  }
                >
                  {asset.change >= 0 ? "+" : ""}
                  {asset.change.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 