"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePortfolio } from "@/hooks/use-portfolio"
import { formatCurrency } from "@/lib/utils"
import { useTokenPrices } from "@/lib/providers/price-provider"

interface PortfolioOverviewProps {
  isLoading?: boolean
}

export function PortfolioOverview({ isLoading: parentLoading = false }: PortfolioOverviewProps) {
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m" | "1y">("1w")
  const { summary, tokens, isLoading: portfolioLoading } = usePortfolio({ timeframe })
  const { prices, isLoading: pricesLoading } = useTokenPrices(tokens?.map(t => t.symbol) || [])
  
  const isLoading = parentLoading || portfolioLoading || pricesLoading

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-700"></div>
          <div className="h-6 w-6 animate-pulse rounded bg-gray-700"></div>
        </div>

        <div className="mb-4 flex space-x-2">
          {["1d", "1w", "1m", "1y"].map((t) => (
            <div key={t} className="h-6 w-12 animate-pulse rounded bg-gray-700"></div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-12 text-xs font-medium text-gray-400">
            <div className="col-span-5">Asset</div>
            <div className="col-span-3 text-right">Value</div>
            <div className="col-span-2 text-right">Change</div>
            <div className="col-span-2 text-right">Allocation</div>
          </div>

          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center py-1">
              <div className="col-span-5">
                <div className="flex items-center">
                  <div className="mr-2 h-6 w-6 rounded-full bg-gray-700"></div>
                  <div>
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-700"></div>
                    <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-700"></div>
                  </div>
                </div>
              </div>
              <div className="col-span-3">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-700 ml-auto"></div>
              </div>
              <div className="col-span-2">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-700 ml-auto"></div>
              </div>
              <div className="col-span-2">
                <div className="h-4 w-12 animate-pulse rounded bg-gray-700 ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Calculate total value and allocations
  const totalValue = tokens?.reduce((sum, token) => sum + token.value, 0) || 0
  const assets = tokens?.map(token => {
    const price = prices[token.symbol]
    const value = token.balance * (price?.current || 0)
    const allocation = (value / totalValue) * 100
    const change = price 
      ? ((price.current - price.historical) / price.historical) * 100
      : 0

    return {
      symbol: token.symbol,
      name: token.name,
      value: formatCurrency(value),
      change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
      allocation: allocation.toFixed(1)
    }
  }) || []

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Portfolio Overview</h2>
        <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex space-x-2">
        {(["1d", "1w", "1m", "1y"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              timeframe === t
                ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white",
            )}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-12 text-xs font-medium text-gray-400">
          <div className="col-span-5">Asset</div>
          <div className="col-span-3 text-right">Value</div>
          <div className="col-span-2 text-right">Change</div>
          <div className="col-span-2 text-right">Allocation</div>
        </div>

        {assets.map((asset) => (
          <div key={asset.symbol} className="grid grid-cols-12 items-center py-1">
            <div className="col-span-5">
              <div className="flex items-center">
                <div className="mr-2 h-6 w-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900"></div>
                <div>
                  <div className="text-sm font-medium text-white">{asset.symbol}</div>
                  <div className="text-xs text-gray-400">{asset.name}</div>
                </div>
              </div>
            </div>
            <div className="col-span-3 text-right text-sm font-medium text-white">{asset.value}</div>
            <div
              className={cn(
                "col-span-2 text-right text-sm font-medium",
                asset.change.startsWith("+") ? "text-green-400" : "text-red-400",
              )}
            >
              <span className="flex items-center justify-end">
                {asset.change.startsWith("+") ? (
                  <ArrowUp className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3" />
                )}
                {asset.change}
              </span>
            </div>
            <div className="col-span-2 text-right">
              <div className="text-sm font-medium text-white">{asset.allocation}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
