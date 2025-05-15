"use client"

import React, { createContext, useContext, useMemo, useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { PortfolioSummary, PortfolioToken } from "@/types/blockchain"
import { PriceFetcherConfig } from "@/config/price-fetcher-config"

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
const POLLING_INTERVAL = PriceFetcherConfig.pollingInterval // Use the same polling interval as price fetcher

async function fetchPortfolioData(): Promise<PortfolioSummary> {
  const response = await fetch("/api/portfolio/summary")
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio data")
  }
  return response.json()
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const {
    data: portfolioData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolioData,
    staleTime: POLLING_INTERVAL, // Consider data fresh for one polling interval
    cacheTime: POLLING_INTERVAL * 5, // Keep in cache for 5 polling intervals
    retry: PriceFetcherConfig.maxRetries,
    retryDelay: (attemptIndex) => Math.min(PriceFetcherConfig.retryInterval * 2 ** attemptIndex, 30000),
    refetchInterval: POLLING_INTERVAL, // Poll at the same interval as price fetcher
  })

  // Memoized update function
  const updatePortfolioData = useCallback((data: Partial<PortfolioSummary>) => {
    queryClient.setQueryData(PORTFOLIO_QUERY_KEY, (old: PortfolioSummary | undefined) => {
      if (!old) return data as PortfolioSummary
      return { ...old, ...data }
    })
  }, [queryClient])

  // Log status changes in development
  useEffect(() => {
    if (PriceFetcherConfig.verbose) {
      if (isLoading) {
        console.log('[PortfolioProvider] Loading portfolio data...');
      } else if (error) {
        console.error('[PortfolioProvider] Error loading portfolio data:', error);
      } else if (portfolioData) {
        console.log('[PortfolioProvider] Portfolio data updated:', portfolioData);
      }
    }
  }, [isLoading, error, portfolioData]);

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
    staleTime: POLLING_INTERVAL,
    cacheTime: POLLING_INTERVAL * 5,
    retry: PriceFetcherConfig.maxRetries,
    retryDelay: (attemptIndex) => Math.min(PriceFetcherConfig.retryInterval * 2 ** attemptIndex, 30000),
    refetchInterval: POLLING_INTERVAL,
  })
}

// Composite hook for portfolio overview usage
export function usePortfolio(options: { timeframe?: string; network?: string } = {}) {
  const { timeframe = "1d", network = "ethereum" } = options
  const summary = usePortfolioSummary()
  const tokens = usePortfolioTokens(network)
  
  return {
    summary: summary.data,
    tokens: tokens.data,
    isLoading: summary.isLoading || tokens.isLoading,
    error: summary.error || tokens.error,
  }
} 