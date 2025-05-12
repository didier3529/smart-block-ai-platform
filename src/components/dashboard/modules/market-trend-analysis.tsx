"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTokenPrices } from "@/lib/providers/price-provider"

interface MarketTrendAnalysisProps {
  isLoading?: boolean
}

// List of tokens we want to track
const TRACKED_TOKENS = ["BTC", "ETH", "SOL", "ADA", "DOT"]

export function MarketTrendAnalysis({ isLoading: parentLoading = false }: MarketTrendAnalysisProps) {
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m" | "1y">("1w")
  
  // Use our new price context
  const { prices, isLoading: pricesLoading } = useTokenPrices(TRACKED_TOKENS)
  
  // Combine loading states
  const isLoading = parentLoading || pricesLoading

  // Transform prices into market data
  const marketData = TRACKED_TOKENS.map(symbol => {
    const price = prices[symbol]
    if (!price) return null

    // Calculate change percentage
    const changeValue = ((price.current - price.historical) / price.historical) * 100
    const change = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`

    // Determine sentiment based on price change
    let sentiment = "Neutral"
    if (changeValue > 5) sentiment = "Very Bullish"
    else if (changeValue > 0) sentiment = "Bullish"
    else if (changeValue < -5) sentiment = "Very Bearish"
    else if (changeValue < 0) sentiment = "Bearish"

    return {
      name: price.name,
      symbol,
      price: `$${price.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change,
      volume: "$0.00B", // We'll need to add volume data to our price service
      marketCap: "$0.00B", // We'll need to add market cap data to our price service
      sentiment,
    }
  }).filter(Boolean) // Remove any null values

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex animate-pulse flex-col space-y-4">
          <div className="h-6 w-48 rounded bg-gray-700"></div>
          <div className="h-4 w-24 rounded bg-gray-700"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-gray-700"></div>
                <div className="h-4 w-20 rounded bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Market Trend Analysis</h2>
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium text-gray-400">
              <th className="pb-2">Asset</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">24h Change</th>
              <th className="pb-2 text-right">Volume</th>
              <th className="pb-2 text-right">Market Cap</th>
              <th className="pb-2 text-right">Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {marketData.map((coin) => (
              <tr key={coin.symbol} className="text-sm">
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="mr-2 h-6 w-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900"></div>
                    <div>
                      <div className="font-medium text-white">{coin.symbol}</div>
                      <div className="text-xs text-gray-400">{coin.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right font-medium text-white">{coin.price}</td>
                <td
                  className={cn(
                    "py-3 text-right font-medium",
                    coin.change.startsWith("+") ? "text-green-400" : "text-red-400",
                  )}
                >
                  <span className="flex items-center justify-end">
                    {coin.change.startsWith("+") ? (
                      <ArrowUp className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDown className="mr-1 h-3 w-3" />
                    )}
                    {coin.change}
                  </span>
                </td>
                <td className="py-3 text-right font-medium text-white">{coin.volume}</td>
                <td className="py-3 text-right font-medium text-white">{coin.marketCap}</td>
                <td className="py-3 text-right">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      coin.sentiment === "Bullish"
                        ? "bg-green-400/10 text-green-400"
                        : coin.sentiment === "Very Bullish"
                          ? "bg-green-500/10 text-green-500"
                          : coin.sentiment === "Bearish"
                            ? "bg-red-400/10 text-red-400"
                            : "bg-gray-400/10 text-gray-400",
                    )}
                  >
                    {coin.sentiment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
