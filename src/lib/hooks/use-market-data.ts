import { useQuery } from "@tanstack/react-query"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import { MarketData } from "@/types/blockchain"

interface UseMarketDataOptions {
  timeframe: "1d" | "1w" | "1m" | "3m" | "1y"
}

export function useMarketData({ timeframe }: UseMarketDataOptions) {
  const { subscribe, unsubscribe } = useWebSocket()

  const { data, isLoading, error } = useQuery({
    queryKey: ["market-data", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/market/data?timeframe=${timeframe}`)
      if (!response.ok) {
        throw new Error("Failed to fetch market data")
      }
      return response.json() as Promise<MarketData>
    },
  })

  // Subscribe to real-time market data updates
  React.useEffect(() => {
    const channel = "market:data"
    subscribe(channel, (update) => {
      // Handle real-time market data updates
      // This will be implemented when we add WebSocket support
      console.log("Market data update:", update)
    })

    return () => {
      unsubscribe(channel)
    }
  }, [subscribe, unsubscribe])

  return {
    data,
    isLoading,
    error,
  }
} 