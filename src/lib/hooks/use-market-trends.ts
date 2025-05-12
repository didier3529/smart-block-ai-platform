import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface MarketTrend {
  name: string
  symbol: string
  price: string
  change: string
  volume: string
  marketCap: string
  supply: string
  isWatchlisted?: boolean
  sentiment?: "Very Bullish" | "Bullish" | "Neutral" | "Bearish" | "Very Bearish"
}

export interface MarketStats {
  totalMarketCap: string
  marketCapChange: string
  volume24h: string
  volumeChange: string
  btcDominance: string
  btcDominanceChange: string
  ethDominance: string
  ethDominanceChange: string
}

export interface TrendingCoin {
  name: string
  symbol: string
  price: string
  change: string
}

export interface MarketTrendsData {
  trends: MarketTrend[]
  trending: TrendingCoin[]
  stats: MarketStats
}

export interface TrendAnalysisParams {
  timeframe?: "short" | "medium" | "long"
  includeSocial?: boolean
  tokens?: string[]
}

export interface TrendAnalysis {
  sentiment: string
  sentimentScore: number
  insights: string[]
  signals: {
    technical: string[]
    fundamental: string[]
    social: string[]
  }
  recommendations: {
    action: "buy" | "sell" | "hold"
    confidence: number
    reasoning: string[]
  }
}

export function useMarketTrends(timeframe: "1d" | "1w" | "1m" | "3m" | "1y") {
  return useQuery<MarketTrendsData>({
    queryKey: ["market-trends", timeframe],
    queryFn: async () => {
      const { data } = await api.get(`/api/market/trends?timeframe=${timeframe}`)
      return data
    },
  })
}

export function useTrendAnalysis(params?: TrendAnalysisParams) {
  return useQuery<TrendAnalysis>({
    queryKey: ["trend-analysis", params],
    queryFn: async () => {
      const { data } = await api.post("/api/market/analyze", params)
      return data
    },
    staleTime: 1000 * 60 * 15 // 15 minutes
  })
} 