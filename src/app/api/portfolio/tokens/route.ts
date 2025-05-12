import { NextResponse } from 'next/server';

// Mock data for portfolio tokens, including BTC at ~$100k
const MOCK_PORTFOLIO_TOKENS = [
  {
    address: "btc-address",
    symbol: "BTC",
    name: "Bitcoin",
    decimals: 8,
    type: "native", // Or appropriate type
    network: "bitcoin", // Or appropriate network
    price: 102982.57, // Desired BTC price
    priceChange24h: 2.78, // Example change
    balance: "0.5", // Example balance
    balanceUsd: 51491.285,
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
    balanceUsd: 67894.50,
    quantity: "10",
    value: 67894.50,
    allocation: 45.1,
    performance24h: 3.45,
    performance7d: 6.2,
    performance30d: 12.5,
  },
  // Add other tokens as needed (SOL, ADA, DOT from your hardcoded price list)
  {
    address: "sol-address",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    type: "native",
    network: "solana",
    price: 320.87,
    priceChange24h: 8.91,
    balance: "100",
    balanceUsd: 32087.00,
    quantity: "100",
    value: 32087.00,
    allocation: 10.5,
    performance24h: 8.91,
    performance7d: 15.0,
    performance30d: 25.0,
  },
];

export async function GET(request: Request) {
  console.log("🚀 API_PORTFOLIO_TOKENS: Returning mock token data with BTC @ ~$100k");
  return NextResponse.json(MOCK_PORTFOLIO_TOKENS, {
    headers: {
      'Cache-Control': 'no-store',
    }
  });
} 