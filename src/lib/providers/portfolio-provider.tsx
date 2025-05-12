"use client"

import React, { createContext, useContext, useMemo, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useWebSocket } from "@/hooks/use-websocket"
import type { PortfolioSummary, PortfolioToken } from "@/types/blockchain"

// Enhanced type definitions
interface PortfolioContextValue {
  isLoading: boolean
  portfolioData: PortfolioSummary | null
  error: Error | null
  refetch: () => Promise<void>
  updatePortfolioData: (data: Partial<PortfolioSummary>) => void
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined)

const PORTFOLIO_QUERY_KEY = ["portfolio"] as const

async function fetchPortfolioData(): Promise<PortfolioSummary> {
  const response = await fetch("/api/portfolio/summary")
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio data")
  }
  return response.json()
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { subscribe, unsubscribe } = useWebSocket()

  const {
    data: portfolioData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolioData,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    cacheTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Memoized update function
  const updatePortfolioData = useCallback((data: Partial<PortfolioSummary>) => {
    queryClient.setQueryData(PORTFOLIO_QUERY_KEY, (old: PortfolioSummary | undefined) => {
      if (!old) return data as PortfolioSummary
      return { ...old, ...data }
    })
  }, [queryClient])

  // WebSocket subscription for real-time updates
  React.useEffect(() => {
    const channel = "portfolio:updates"
    
    subscribe(channel, (update: Partial<PortfolioSummary>) => {
      updatePortfolioData(update)
    })

    return () => {
      unsubscribe(channel)
    }
  }, [subscribe, unsubscribe, updatePortfolioData])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isLoading,
      portfolioData: portfolioData ?? null,
      error: error as Error | null,
      refetch,
      updatePortfolioData,
    }),
    [isLoading, portfolioData, error, refetch, updatePortfolioData]
  )

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error("usePortfolioContext must be used within a PortfolioProvider")
  }
  return context
}

// Specialized hooks for different portfolio data needs
export function usePortfolioSummary() {
  const { portfolioData, isLoading, error } = usePortfolioContext()
  return { data: portfolioData, isLoading, error }
}

export function usePortfolioTokens(network?: string) {
  return useQuery({
    queryKey: ["portfolio", "tokens", network],
    queryFn: async (): Promise<PortfolioToken[]> => {
      const response = await fetch(`/api/portfolio/tokens${network ? `?network=${network}` : ""}`)
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio tokens")
      }
      return response.json()
    },
  })
}

// Composite hook for portfolio overview usage
export function usePortfolio(options: { timeframe?: string; network?: string } = {}) {
  const { timeframe = "1w", network = "ethereum" } = options
  const summary = usePortfolioSummary()
  const tokens = usePortfolioTokens(network)
  
  return {
    summary: summary.data,
    tokens: tokens.data,
    isLoading: summary.isLoading || tokens.isLoading,
    error: summary.error || tokens.error,
  }
} 