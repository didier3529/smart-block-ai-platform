"use client"

import React, { createContext, useContext, useCallback, useMemo, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "@/components/ui/use-toast"
import { MarketData as ApiMarketData } from "@/types/blockchain"
import { marketDataAdapter } from "@/lib/services/market-data-adapter"

// Define proper types for market data
interface MarketData {
  marketCap: number
  volume24h: number
  btcDominance: number
  volatilityIndex: number
  sentiment: string
  keyLevels: {
    btc: { support: number[]; resistance: number[] }
    eth: { support: number[]; resistance: number[] }
  }
  lastUpdated: number
}

interface MarketContextType {
  marketData: MarketData | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
  isWebSocketConnected: boolean
}

// Market data cache key
const MARKET_DATA_KEY = ["market-data"] as const

// Default fallback data
const FALLBACK_MARKET_DATA: MarketData = {
  marketCap: 0,
  volume24h: 0,
  btcDominance: 0,
  volatilityIndex: 1.0,
  sentiment: "neutral",
  keyLevels: {
    btc: {
      support: [35000, 32000, 30000],
      resistance: [40000, 42000, 45000],
    },
    eth: {
      support: [1800, 1650, 1500],
      resistance: [2000, 2200, 2500],
    },
  },
  lastUpdated: Date.now(),
}

const MarketContext = createContext<MarketContextType | undefined>(undefined)

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [isWebSocketConnected, setIsWebSocketConnected] = React.useState(false)
  const supportedTokens = ["BTC", "ETH", "USDC", "SOL", "ADA", "DOT"]

  // Memoized fetch function
  const fetchMarketData = useCallback(async () => {
    try {
      console.log("Fetching market data from adapter")
      
      // Fetch data for all supported tokens
      const tokenData = await Promise.all(
        supportedTokens.map(symbol => marketDataAdapter.getPrice(symbol))
      )

      // Calculate total market cap and BTC dominance
      const totalMarketCap = tokenData.reduce((sum, data) => sum + data.marketCap, 0)
      const btcData = tokenData.find((_, index) => supportedTokens[index] === "BTC")
      const btcDominance = btcData ? (btcData.marketCap / totalMarketCap) * 100 : 0

      // Calculate total 24h volume
      const totalVolume = tokenData.reduce((sum, data) => sum + data.volume24h, 0)

      // Calculate volatility index based on price changes
      const avgChange = tokenData.reduce((sum, data) => sum + Math.abs(data.change24h), 0) / tokenData.length
      const volatilityIndex = avgChange / 50 // Normalize to 0-2 range

      const marketData: MarketData = {
        marketCap: totalMarketCap,
        volume24h: totalVolume,
        btcDominance,
        volatilityIndex,
        sentiment: getSentimentFromChanges(tokenData.map(d => d.change24h)),
        keyLevels: FALLBACK_MARKET_DATA.keyLevels, // Keep static for now
        lastUpdated: Date.now(),
      }

      return marketData
    } catch (error) {
      console.error("Market data fetch error:", error)
      throw error
    }
  }, [])

  // Query hook for market data
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: MARKET_DATA_KEY,
    queryFn: fetchMarketData,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
  })

  // WebSocket setup
  useEffect(() => {
    // Subscribe to all supported tokens
    supportedTokens.forEach(symbol => marketDataAdapter.subscribe(symbol))

    // Handle WebSocket events
    const handleConnect = () => setIsWebSocketConnected(true)
    const handleDisconnect = () => setIsWebSocketConnected(false)
    const handlePriceUpdate = ({ symbol, data }: any) => {
      queryClient.setQueryData(MARKET_DATA_KEY, (old: MarketData | undefined) => {
        if (!old) return old
        // Update market data based on new price
        return {
          ...old,
          lastUpdated: Date.now(),
        }
      })
    }

    marketDataAdapter.on('connected', handleConnect)
    marketDataAdapter.on('disconnected', handleDisconnect)
    marketDataAdapter.on('priceUpdate', handlePriceUpdate)

    return () => {
      supportedTokens.forEach(symbol => marketDataAdapter.unsubscribe(symbol))
      marketDataAdapter.removeListener('connected', handleConnect)
      marketDataAdapter.removeListener('disconnected', handleDisconnect)
      marketDataAdapter.removeListener('priceUpdate', handlePriceUpdate)
    }
  }, [queryClient])

  const value = useMemo(
    () => ({
      marketData: marketData || FALLBACK_MARKET_DATA,
      isLoading,
      error,
      refetch,
      isWebSocketConnected
    }),
    [marketData, isLoading, error, refetch, isWebSocketConnected]
  )

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

// Helper function to determine market sentiment
function getSentimentFromChanges(changes: number[]): string {
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  if (avgChange > 5) return "bullish"
  if (avgChange > 2) return "slightly_bullish"
  if (avgChange < -5) return "bearish"
  if (avgChange < -2) return "slightly_bearish"
  return "neutral"
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider")
  }
  return context
}

// Add the correctly named hook for compatibility
export function useMarketContext() {
  return useMarket();
} 