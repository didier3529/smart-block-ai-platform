'use client';

import { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTokenPrices, TokenPrice } from '@/lib/services/price-service'
import { toast } from '@/components/ui/use-toast'
import { marketDataAdapter } from '@/lib/services/market-data-adapter'

interface PriceContextType {
  prices: Record<string, TokenPrice>
  isLoading: boolean
  error: Error | null
  refetch: () => void
  subscribe: (symbol: string) => () => void
  unsubscribe: (symbol: string) => void
  isWebSocketConnected: boolean
  isPolling: boolean
}

const PriceContext = createContext<PriceContextType | undefined>(undefined)

// Constants
const POLLING_INTERVAL = 10000; // 10 seconds
const RETRY_COUNT = 3;
const MAX_RETRY_DELAY = 30000; // 30 seconds

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const subscriptionsRef = useRef(new Set<string>())
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const wsConnectedRef = useRef(false)

  const {
    data: prices,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['prices', Array.from(subscriptionsRef.current)],
    queryFn: async () => {
      console.log('🚀 Fetching prices for tokens:', Array.from(subscriptionsRef.current))
      return getTokenPrices(Array.from(subscriptionsRef.current), '1d')
    },
    enabled: subscriptionsRef.current.size > 0,
    refetchInterval: !isWebSocketConnected ? POLLING_INTERVAL : false,
    retry: RETRY_COUNT,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY),
  })

  useEffect(() => {
    const handleConnect = () => {
      setIsWebSocketConnected(true)
      setIsPolling(false)
      wsConnectedRef.current = true
      console.log('🌐 WebSocket connected')
    }

    const handleDisconnect = () => {
      setIsWebSocketConnected(false)
      setIsPolling(true)
      wsConnectedRef.current = false
      console.log('🔌 WebSocket disconnected, falling back to polling')
    }

    const handlePriceUpdate = ({ symbol, data }: any) => {
      if (subscriptionsRef.current.has(symbol)) {
        refetch()
      }
    }

    // Initialize WebSocket connection
    marketDataAdapter.connect()

    // Subscribe to events
    marketDataAdapter.on('connected', handleConnect)
    marketDataAdapter.on('disconnected', handleDisconnect)
    marketDataAdapter.on('priceUpdate', handlePriceUpdate)

    // Cleanup function
    return () => {
      marketDataAdapter.removeListener('connected', handleConnect)
      marketDataAdapter.removeListener('disconnected', handleDisconnect)
      marketDataAdapter.removeListener('priceUpdate', handlePriceUpdate)
      marketDataAdapter.disconnect()
    }
  }, [refetch])

  const subscribe = useMemo(() => (symbol: string) => {
    subscriptionsRef.current.add(symbol)
    if (wsConnectedRef.current) {
      marketDataAdapter.subscribe(symbol)
    }
    refetch()
    return () => unsubscribe(symbol)
  }, [refetch])

  const unsubscribe = useMemo(() => (symbol: string) => {
    subscriptionsRef.current.delete(symbol)
    if (wsConnectedRef.current) {
      marketDataAdapter.unsubscribe(symbol)
    }
  }, [])

  useEffect(() => {
    if (isPolling) {
      toast({
        title: 'WebSocket Disconnected',
        description: 'Falling back to polling for price updates',
        variant: 'default',
      })
    }
  }, [isPolling])

  const contextValue = useMemo(() => ({
    prices: prices || {},
    isLoading,
    error: queryError as Error | null,
    refetch,
    subscribe,
    unsubscribe,
    isWebSocketConnected,
    isPolling,
  }), [prices, isLoading, queryError, refetch, subscribe, unsubscribe, isWebSocketConnected, isPolling])

  return (
    <PriceContext.Provider value={contextValue}>
      {children}
    </PriceContext.Provider>
  )
}

export function usePriceContext() {
  const context = useContext(PriceContext)
  if (!context) {
    throw new Error('usePriceContext must be used within a PriceProvider')
  }
  return context
}

// Hook for subscribing to specific token prices
export function useTokenPrice(symbol: string) {
  const { prices, subscribe, isLoading, error } = usePriceContext()
  
  useEffect(() => {
    const unsubscribe = subscribe(symbol)
    return unsubscribe
  }, [symbol, subscribe])

  return {
    price: prices[symbol],
    isLoading,
    error
  }
}

// Hook for subscribing to multiple token prices
export function useTokenPrices(symbols: string[]) {
  const { prices, subscribe, isLoading, error } = usePriceContext()
  
  useEffect(() => {
    const unsubscribers = symbols.map(symbol => subscribe(symbol))
    return () => unsubscribers.forEach(unsubscribe => unsubscribe())
  }, [symbols.join(','), subscribe]) // Join symbols to avoid array dependency issues

  return {
    prices: symbols.reduce((acc, symbol) => {
      acc[symbol] = prices[symbol]
      return acc
    }, {} as Record<string, TokenPrice>),
    isLoading,
    error
  }
} 