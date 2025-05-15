"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTokenPrices } from "@/lib/providers/price-provider"
import { formatCurrency } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { PriceFetcherConfig } from "@/config/price-fetcher-config"
import { CryptoIcon } from "@/components/ui/crypto-icon"

interface DirectPortfolioAssetsProps {
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

export function DirectPortfolioAssets({ isLoading: parentLoading = false, className = "" }: DirectPortfolioAssetsProps) {
  // Direct approach like market-trend-analysis - get prices directly
  const { prices, isLoading: pricesLoading, error } = useTokenPrices(Object.keys(PORTFOLIO_BALANCES))
  
  // Log received data similar to market-trend-analysis
  useEffect(() => {
    if (PriceFetcherConfig.verbose) {
      console.log('[DirectPortfolioAssets] Received prices:', prices);
      console.log('[DirectPortfolioAssets] Prices loading:', pricesLoading);
      console.log('[DirectPortfolioAssets] Prices error:', error);
    }
  }, [prices, pricesLoading, error]);
  
  const isLoading = parentLoading || pricesLoading

  const assets = useMemo(() => {
    if (!prices || Object.keys(prices).length === 0) return []

    // Create portfolio assets directly from prices (no API call)
    return Object.entries(PORTFOLIO_BALANCES)
      .map(([symbol, balance]) => {
        const price = prices[symbol]
        if (!price) return null
        
        const value = balance * price.current
        const change = price.historical !== 0 
          ? ((price.current - price.historical) / price.historical) * 100
          : 0

        return {
          symbol,
          name: SYMBOL_NAMES[symbol] || symbol,
          balance,
          price: price.current,
          value,
          change
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value) // Sort by value descending
  }, [prices])

  if (isLoading) {
    return (
      <Card className={`p-4 bg-black/30 backdrop-blur-md border-white/10 ${className}`}>
        <h3 className="text-md font-medium text-white mb-3">Portfolio Assets</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full animate-pulse bg-gray-700"></div>
                <div>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-700"></div>
                  <div className="mt-1 h-3 w-12 animate-pulse rounded bg-gray-700"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-700"></div>
                <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-4 bg-black/30 backdrop-blur-md border-white/10 ${className}`}>
      <h3 className="text-md font-medium text-white mb-3">Portfolio Assets</h3>
      
      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.symbol} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <CryptoIcon symbol={asset.symbol} size="md" />
              <div>
                <div className="font-medium text-white">{asset.symbol}</div>
                <div className="text-xs text-gray-400">{asset.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-white">{formatCurrency(asset.value)}</div>
              <div className="flex items-center justify-end gap-1">
                {asset.change >= 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-400" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-400" />
                )}
                <span
                  className={
                    asset.change >= 0 ? "text-xs text-green-400" : "text-xs text-red-400"
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