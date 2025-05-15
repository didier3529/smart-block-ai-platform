"use client"

import { useEffect, useMemo } from "react"
import { ArrowDown, ArrowUp, Brain, ChartLine, Globe, Lightbulb, Wallet, BarChart2, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTokenPrices } from "@/lib/providers/price-provider"
import { formatCurrency } from "@/lib/utils"
import { PriceFetcherConfig } from "@/config/price-fetcher-config"
import { CryptoIcon } from "@/components/ui/crypto-icon"

interface DirectPortfolioOverviewProps {
  isLoading?: boolean
  className?: string
}

// Hard-coded portfolio balances (no API fetching)
const PORTFOLIO_BALANCES: Record<string, number> = {
  "BTC": 0.5,
  "ETH": 4.2,
  "SOL": 25,
  "ADA": 1000,
  "DOT": 150
}

// Symbol to name mapping for better display
const SYMBOL_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'ADA': 'Cardano',
  'DOT': 'Polkadot',
};

export function DirectPortfolioOverview({ isLoading: parentLoading = false, className = "" }: DirectPortfolioOverviewProps) {
  // Direct approach like market-trend-analysis - get prices directly
  const { prices, isLoading: pricesLoading, error } = useTokenPrices(Object.keys(PORTFOLIO_BALANCES))
  
  // Log received data similar to market-trend-analysis
  useEffect(() => {
    if (PriceFetcherConfig.verbose) {
      console.log('[DirectPortfolioOverview] Received prices:', prices);
      console.log('[DirectPortfolioOverview] Prices loading:', pricesLoading);
      console.log('[DirectPortfolioOverview] Prices error:', error);
    }
  }, [prices, pricesLoading, error]);
  
  const isLoading = parentLoading || pricesLoading

  // Transform prices into portfolio data
  const portfolioData = useMemo(() => {
    if (!prices || Object.keys(prices).length === 0) return { assets: [], totalValue: 0 }

    const assets = Object.entries(PORTFOLIO_BALANCES).map(([symbol, balance]) => {
      const price = prices[symbol]
      if (!price) return null
      
      const value = balance * price.current
      const change = price.historical !== 0 
        ? ((price.current - price.historical) / price.historical) * 100
        : 0
      const allocation = 0 // Will calculate after we have total value

      return {
        symbol,
        name: SYMBOL_NAMES[symbol] || symbol,
        balance,
        value,
        change,
        allocation
      }
    }).filter(Boolean)
    
    // Calculate total value
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)
    
    // Calculate allocations
    const assetsWithAllocation = assets.map(asset => ({
      ...asset,
      allocation: totalValue > 0 ? (asset.value / totalValue) * 100 : 0
    }))
    
    return { 
      assets: assetsWithAllocation.sort((a, b) => b.value - a.value), // Sort by value descending 
      totalValue 
    }
  }, [prices])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex animate-pulse flex-col space-y-4">
          <div className="h-6 w-48 rounded bg-gray-700"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="h-24 rounded bg-gray-700"></div>
            <div className="h-24 rounded bg-gray-700"></div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate overall portfolio change
  const overallChange = portfolioData.assets.reduce((sum, asset) => sum + (asset.value * asset.change), 0) / portfolioData.totalValue

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="flex items-center gap-4 mb-6">
        <Wallet className="h-6 w-6 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Portfolio Overview</h2>
        <div
          className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
            overallChange >= 0 ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
          )}
        >
          {overallChange >= 0 ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {overallChange >= 0 ? '+' : ''}{overallChange.toFixed(2)}%
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Portfolio Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <BarChart2 className="h-4 w-4 text-blue-400" />
            Portfolio Stats
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Value</span>
              <span className="font-medium text-white">{formatCurrency(portfolioData.totalValue)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Assets</span>
              <span className="font-medium text-white">{portfolioData.assets.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Top Asset</span>
              <span className="font-medium text-white">{portfolioData.assets[0]?.symbol || '-'}</span>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <ChartLine className="h-4 w-4 text-yellow-400" />
            Performance
          </div>
          <div className="space-y-2">
            {portfolioData.assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CryptoIcon symbol={asset.symbol} size="sm" />
                  <span className="text-gray-400">{asset.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        asset.change >= 0 ? "bg-green-400" : "bg-red-400"
                      )}
                      style={{ width: `${Math.min(Math.abs(asset.change), 100)}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    asset.change >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Globe className="h-4 w-4 text-purple-400" />
            Holdings
          </div>
          <div className="space-y-3">
            {portfolioData.assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CryptoIcon symbol={asset.symbol} size="sm" />
                  <span className="text-gray-400">{asset.symbol}</span>
                </div>
                <span className="font-medium text-white">{formatCurrency(asset.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <PieChart className="h-4 w-4 text-green-400" />
            Allocation
          </div>
          <div className="space-y-2">
            {portfolioData.assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CryptoIcon symbol={asset.symbol} size="sm" />
                  <span className="text-gray-400">{asset.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-green-400"
                      style={{ width: `${asset.allocation}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-white">
                    {asset.allocation.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 