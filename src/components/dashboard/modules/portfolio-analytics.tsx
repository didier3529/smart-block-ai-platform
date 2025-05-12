"use client"

import { useMemo } from "react"
import { usePortfolio } from "@/hooks/use-portfolio"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Activity, BarChart2, PieChart, Zap } from "lucide-react"
import { useTokenPrices } from "@/lib/providers/price-provider"

interface PortfolioAnalyticsProps {
  isLoading?: boolean
  className?: string
}

function AnalyticsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-gray-700"></div>
          <div className="mt-4 h-8 w-32 animate-pulse rounded bg-gray-700"></div>
          <div className="mt-2 h-4 w-20 animate-pulse rounded bg-gray-700"></div>
        </div>
      ))}
    </div>
  )
}

export function PortfolioAnalytics({ isLoading: parentLoading = false, className = "" }: PortfolioAnalyticsProps) {
  const { summary, tokens, isLoading: portfolioLoading } = usePortfolio({ timeframe: "1w" })
  const { prices, isLoading: pricesLoading } = useTokenPrices(tokens?.map(t => t.symbol) || [])
  
  const isLoading = parentLoading || portfolioLoading || pricesLoading

  const analytics = useMemo(() => {
    if (!tokens || !prices || tokens.length === 0) return null

    // Calculate total value and historical value
    const totalValue = tokens.reduce((sum, token) => {
      const price = prices[token.symbol]
      return sum + (token.balance * (price?.current || 0))
    }, 0)

    const totalHistorical = tokens.reduce((sum, token) => {
      const price = prices[token.symbol]
      return sum + (token.balance * (price?.historical || 0))
    }, 0)

    // Calculate profit/loss
    const unrealizedPL = totalValue - totalHistorical
    const realizedPL = summary?.profitLoss?.realized || 0
    const totalPL = unrealizedPL + realizedPL

    // Calculate performance metrics
    const monthlyPerformance = ((totalValue - totalHistorical) / totalHistorical) * 100
    const yearlyPerformance = monthlyPerformance * 12 // Simple annualization

    // Calculate risk metrics
    const priceChanges = tokens.map(token => {
      const price = prices[token.symbol]
      if (!price) return 0
      return ((price.current - price.historical) / price.historical) * 100
    })

    const volatility = calculateVolatility(priceChanges)
    const sharpeRatio = calculateSharpeRatio(monthlyPerformance, volatility)

    return {
      totalValue,
      profitLoss: {
        total: totalPL,
        realized: realizedPL,
        unrealized: unrealizedPL
      },
      performance: {
        monthly: monthlyPerformance,
        yearly: yearlyPerformance
      },
      riskMetrics: {
        volatility,
        sharpeRatio
      }
    }
  }, [tokens, prices, summary])

  if (isLoading) {
    return <AnalyticsLoading />
  }

  if (!analytics) {
    return null
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">Total Value</h3>
          <BarChart2 className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-white">
            {formatCurrency(analytics.totalValue)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">Profit/Loss</h3>
          <PieChart className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-white">
            {formatCurrency(analytics.profitLoss.total)}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            Realized: {formatCurrency(analytics.profitLoss.realized)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">Performance</h3>
          <Activity className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-white">
            {formatPercentage(analytics.performance.monthly)}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            YTD: {formatPercentage(analytics.performance.yearly)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">Risk Metrics</h3>
          <Zap className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-white">
            {formatPercentage(analytics.riskMetrics.volatility)}
          </div>
          <div className="mt-1 text-sm text-gray-400">
            Sharpe: {analytics.riskMetrics.sharpeRatio.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for risk calculations
function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length
  return Math.sqrt(variance)
}

function calculateSharpeRatio(return_: number, volatility: number, riskFreeRate: number = 2): number {
  if (volatility === 0) return 0
  return (return_ - riskFreeRate) / volatility
} 