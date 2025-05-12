import { useQuery } from "@tanstack/react-query"
import { TokenAdapter, TokenBalance } from "@/lib/adapters/TokenAdapter"
import { formatCurrency } from "@/lib/utils"
import { NetworkType, PortfolioSummary } from "@/types/blockchain"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import React from "react"
import { apiClient, ApiError } from '@/lib/api/config'
import { toast } from '@/components/ui/use-toast'

const tokenAdapter = new TokenAdapter()

export interface PortfolioAsset {
  name: string
  symbol: string
  value: string
  balance: string
  price: string
  change: string
  allocation: number
}

export interface PortfolioData {
  totalValue: string
  change: string
  assets: PortfolioAsset[]
}

function calculatePortfolioData(balances: TokenBalance[]): PortfolioData {
  const totalValue = balances.reduce((sum, balance) => sum + balance.value, 0)
  
  const assets = balances.map((balance) => ({
    name: balance.token.name,
    symbol: balance.token.symbol,
    value: formatCurrency(balance.value),
    balance: balance.balance,
    price: formatCurrency(balance.token.price),
    change: `${balance.token.priceChange24h >= 0 ? "+" : ""}${balance.token.priceChange24h.toFixed(2)}%`,
    allocation: (balance.value / totalValue) * 100,
  }))

  // Sort assets by value
  assets.sort((a, b) => parseFloat(b.value.replace(/[^0-9.-]+/g, "")) - parseFloat(a.value.replace(/[^0-9.-]+/g, "")))

  // Calculate total portfolio change
  const weightedChange = balances.reduce((sum, balance) => {
    const weight = balance.value / totalValue
    return sum + (balance.token.priceChange24h * weight)
  }, 0)

  return {
    totalValue: formatCurrency(totalValue),
    change: `${weightedChange >= 0 ? "+" : ""}${weightedChange.toFixed(2)}%`,
    assets,
  }
}

interface UsePortfolioOptions {
  timeframe: "1d" | "1w" | "1m" | "3m" | "1y"
  network: NetworkType
}

export function usePortfolio({ timeframe, network }: UsePortfolioOptions) {
  const { subscribe, unsubscribe } = useWebSocket()

  // Fetch initial portfolio data
  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolio", timeframe, network],
    queryFn: async () => {
      try {
        const response = await apiClient.get<PortfolioSummary>(`/api/portfolio/summary?timeframe=${timeframe}&network=${network}`)
        return response.data
      } catch (error) {
        const apiError = error as ApiError
        
        // Show appropriate error message based on error type
        if (apiError.code === 'ECONNABORTED' || apiError.details?.timeout) {
          toast({
            title: "Request Timeout",
            description: "Portfolio data is taking longer than expected to load. Retrying...",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error Loading Portfolio",
            description: apiError.message || "Failed to load portfolio data. Please try again.",
            variant: "destructive",
          })
        }
        
        throw error
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })

  // Subscribe to real-time updates
  React.useEffect(() => {
    const channel = `portfolio:${network}`
    subscribe(channel, (update) => {
      // Handle real-time portfolio updates
      // This will be implemented when we add WebSocket support
    })

    return () => {
      unsubscribe(channel)
    }
  }, [network, subscribe, unsubscribe])

  return {
    data,
    isLoading,
    error,
  }
} 