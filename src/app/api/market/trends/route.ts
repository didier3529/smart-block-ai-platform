import { NextResponse } from "next/server"
import { MarketTrendsData } from "@/lib/hooks/use-market-trends"

// Mock data for development - replace with real API calls in production
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const timeframe = searchParams.get("timeframe") || "1d"

  // In production, fetch this data from your market data provider
  const mockData: MarketTrendsData = {
    trends: [
      {
        name: "Bitcoin",
        symbol: "BTC",
        price: "$49,873.37",
        change: "+2.78%",
        marketCap: "$967.2B",
        volume: "$28.5B",
        supply: "19.4M BTC",
        isWatchlisted: true,
        sentiment: "Bullish",
      },
      {
        name: "Ethereum",
        symbol: "ETH",
        price: "$3,670.59",
        change: "+3.45%",
        marketCap: "$441.4B",
        volume: "$15.7B",
        supply: "120.2M ETH",
        isWatchlisted: true,
        sentiment: "Very Bullish",
      },
      {
        name: "Solana",
        symbol: "SOL",
        price: "$78.74",
        change: "+8.91%",
        marketCap: "$38.1B",
        volume: "$5.2B",
        supply: "484.2M SOL",
        isWatchlisted: false,
        sentiment: "Very Bullish",
      },
      {
        name: "BNB",
        symbol: "BNB",
        price: "$345.67",
        change: "+1.23%",
        marketCap: "$53.2B",
        volume: "$2.1B",
        supply: "153.8M BNB",
        isWatchlisted: false,
        sentiment: "Neutral",
      },
      {
        name: "XRP",
        symbol: "XRP",
        price: "$0.54",
        change: "-1.23%",
        marketCap: "$29.1B",
        volume: "$1.8B",
        supply: "53.9B XRP",
        isWatchlisted: false,
        sentiment: "Bearish",
      },
    ],
    trending: [
      { name: "Solana", symbol: "SOL", price: "$78.74", change: "+8.91%" },
      { name: "Arbitrum", symbol: "ARB", price: "$1.23", change: "+15.4%" },
      { name: "Sui", symbol: "SUI", price: "$0.87", change: "+12.3%" },
      { name: "Aptos", symbol: "APT", price: "$8.45", change: "+7.8%" },
    ],
    stats: {
      totalMarketCap: "$1.24T",
      marketCapChange: "+2.3%",
      volume24h: "$78.5B",
      volumeChange: "+5.6%",
      btcDominance: "42.3%",
      btcDominanceChange: "-0.5%",
      ethDominance: "18.7%",
      ethDominanceChange: "+0.3%",
    },
  }

  return NextResponse.json(mockData, {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  })
} 