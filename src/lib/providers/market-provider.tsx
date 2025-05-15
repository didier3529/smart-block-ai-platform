"use client"

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
// import axios from "axios"
// import { MarketData as ApiMarketData } from "@/types/blockchain"
// import { marketDataAdapter } from "@/lib/services/market-data-adapter"
import { usePriceContext, TokenPrice } from "./price-provider" // Import context from PriceProvider

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
  error: Error | null // Error could come from calculation or underlying price fetch
  refetch: () => void // Allow manual recalculation
  isWebSocketConnected: boolean // Get from PriceProvider
}

// Market data cache key - recalculation key
const AGGREGATE_MARKET_DATA_KEY = ["aggregate-market-data"] as const

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

// List of tokens needed for aggregate calculations
const SUPPORTED_TOKENS_FOR_AGGREGATION = ["BTC", "ETH", "USDC", "SOL", "ADA", "DOT"]

export function MarketProvider({ children }: { children: React.ReactNode }) {
  // Consume the PriceProvider context to get underlying token prices
  const {
    prices: tokenPrices, 
    isLoading: pricesLoading, 
    error: pricesError, 
    isWebSocketConnected, 
    subscribeToPrices // Needed to ensure tokens are subscribed
  } = usePriceContext()

  // Ensure the necessary tokens are subscribed via PriceProvider
  useEffect(() => {
    if (SUPPORTED_TOKENS_FOR_AGGREGATION.length > 0) {
      const unsubscribe = subscribeToPrices(SUPPORTED_TOKENS_FOR_AGGREGATION);
      return unsubscribe;
    }
  }, [subscribeToPrices]); // Re-run if subscribe function changes

  // Memoized calculation function
  const calculateAggregateData = useCallback((): MarketData => {
    console.log("[MarketProvider] Recalculating aggregate data...");
    const relevantPrices = SUPPORTED_TOKENS_FOR_AGGREGATION
      .map(symbol => tokenPrices[symbol])
      .filter((price): price is TokenPrice => !!price); // Filter out undefined prices

    if (relevantPrices.length === 0) {
      console.warn("[MarketProvider] No price data available for aggregation.");
      return FALLBACK_MARKET_DATA; // Return fallback if no prices are available
    }

    // Calculate total market cap and BTC dominance
    const totalMarketCap = relevantPrices.reduce((sum, data) => sum + (data.marketCap || 0), 0) // Use 0 if marketCap is missing
    const btcData = relevantPrices.find(price => price.symbol === "BTC")
    const btcDominance = totalMarketCap > 0 && btcData && btcData.marketCap ? (btcData.marketCap / totalMarketCap) * 100 : 0

    // Calculate total 24h volume
    const totalVolume = relevantPrices.reduce((sum, data) => sum + (data.volume24h || 0), 0)

    // Calculate volatility index based on price changes
    const changes = relevantPrices.map(d => d.change24h).filter(c => typeof c === 'number');
    const avgChange = changes.length > 0 ? changes.reduce((sum, data) => sum + Math.abs(data), 0) / changes.length : 0;
    // Normalize volatility index (example normalization, adjust as needed)
    const volatilityIndex = Math.min(Math.max(avgChange / 10, 0), 2); // Scale avg % change into 0-2 range

    const aggregateData: MarketData = {
      marketCap: totalMarketCap,
      volume24h: totalVolume,
      btcDominance,
      volatilityIndex,
      sentiment: getSentimentFromChanges(changes), // Pass numeric changes only
      keyLevels: FALLBACK_MARKET_DATA.keyLevels, // Keep static for now
      lastUpdated: Date.now(),
    }

    console.log("[MarketProvider] Aggregate Data Calculated:", aggregateData);
    return aggregateData
  }, [tokenPrices]) // Recalculate whenever the underlying tokenPrices object changes

  // Use query hook primarily for caching the calculated result and providing a refetch mechanism.
  // The calculation itself is driven by the input tokenPrices.
  const { 
    data: aggregateMarketData, 
    isLoading: calculationIsLoading, // Reflects calculation time, not fetching
    error: calculationError, 
    refetch 
  } = useQuery({
    // Query key now depends on the actual prices to trigger recalculation
    // Note: Stringifying a large prices object might be inefficient. 
    // Consider a more stable key derived from timestamps or a simple counter if performance is an issue.
    queryKey: [...AGGREGATE_MARKET_DATA_KEY, JSON.stringify(tokenPrices)],
    queryFn: calculateAggregateData,
    staleTime: 5000, // Recalculated data is fresh for a short time
    cacheTime: 60000, // Cache the result for a minute
    enabled: !pricesLoading, // Only calculate when underlying prices are not loading
  })

  // Removed the WebSocket setup useEffect as MarketProvider no longer manages its own connection
  // useEffect(() => { ... marketDataAdapter interaction removed ... }, [queryClient])

  const value = useMemo(
    () => ({
      marketData: aggregateMarketData || FALLBACK_MARKET_DATA,
      // Loading is true if underlying prices are loading OR calculation is running
      isLoading: pricesLoading || calculationIsLoading, 
      error: pricesError || calculationError, // Combine errors
      refetch, // Expose refetch to manually trigger recalculation
      isWebSocketConnected // Pass through from PriceProvider
    }),
    [aggregateMarketData, pricesLoading, calculationIsLoading, pricesError, calculationError, refetch, isWebSocketConnected]
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