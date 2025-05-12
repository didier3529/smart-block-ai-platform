import { NextResponse } from "next/server"
import { PortfolioSummary, PortfolioToken } from "@/types/blockchain"

// Consistent mock tokens data with BTC at ~$100k
const MOCK_TOKENS_FOR_SUMMARY: PortfolioToken[] = [
  {
    address: "btc-address",
    symbol: "BTC",
    name: "Bitcoin",
    decimals: 8,
    type: "native",
    network: "bitcoin",
    price: 102982.57, // Desired BTC price
    priceChange24h: 2.78,
    balance: "0.5",
    balanceUsd: 51491.285, // 0.5 * 102982.57
    quantity: "0.5",
    value: 51491.285,
    allocation: 31.2,
    performance24h: 2.78,
    performance7d: 5.5,
    performance30d: 10.1,
  },
  {
    address: "eth-address",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    type: "native",
    network: "ethereum",
    price: 6789.45, // Projected ETH price
    priceChange24h: 3.45,
    balance: "10",
    balanceUsd: 67894.50, // 10 * 6789.45
    quantity: "10",
    value: 67894.50,
    allocation: 45.1,
    performance24h: 3.45,
    performance7d: 6.2,
    performance30d: 12.5,
  },
  {
    address: "sol-address",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    type: "native",
    network: "solana",
    price: 320.87, // Projected SOL price
    priceChange24h: 8.91,
    balance: "100",
    balanceUsd: 32087.00, // 100 * 320.87
    quantity: "100",
    value: 32087.00,
    allocation: 10.5,
    performance24h: 8.91,
    performance7d: 15.0,
    performance30d: 25.0,
  },
  // Add other tokens if needed to match portfolio overview expectations
]

export async function GET(request: Request) {
  const totalPortfolioValue = MOCK_TOKENS_FOR_SUMMARY.reduce((sum, token) => sum + token.value, 0)

  const mockPortfolioSummary: PortfolioSummary = {
    totalValue: totalPortfolioValue, // Calculated from mock tokens
    totalChange24h: 3.5, // Example overall change
    totalChange7d: 7.2,
    tokens: MOCK_TOKENS_FOR_SUMMARY,
    topPerformers: [MOCK_TOKENS_FOR_SUMMARY[2]], // SOL as top performer example
    worstPerformers: [], // Example
    percentChange24h: 3.5,
    assetsCount: MOCK_TOKENS_FOR_SUMMARY.length,
    networksCount: 3,
    riskScore: 50, // Example
    diversificationScore: 60, // Example
    volatility: 0.3, // Example
    sharpeRatio: 1.5, // Example
  }

  console.log("🚀 API_PORTFOLIO_SUMMARY: Returning mock summary data with BTC @ ~$100k values")
  return NextResponse.json(mockPortfolioSummary, {
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