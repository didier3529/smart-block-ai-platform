import { NextResponse } from "next/server"
import { MarketData, PortfolioToken } from "@/types/blockchain"
import { performanceMonitor } from "@/lib/performance/monitor"
import { twitterService } from "@/lib/services/twitter-service"
import { getTokenPrices } from "@/lib/services/price-service"

const CMC_API_KEY = '036951ad-f286-4863-819a-0f94fc8455b6';
const CMC_API_BASE = 'https://pro-api.coinmarketcap.com/v1';

// Cache market data for 30 seconds
const CACHE_TTL = 30 * 1000 // 30 seconds
let cachedData: { data: MarketData; timestamp: number } | null = null

// Default sentiment data when Twitter API fails
const DEFAULT_SENTIMENT_DATA = {
  sentiment: 0,
  volume24h: 0,
  engagement: 0,
  trending: false,
};

// Helper to transform hardcoded TokenPrice to PortfolioToken like structure for MarketData
function transformTokenPriceToMarketAsset(symbol: string, tokenPrice: any, balance: string = "1"): PortfolioToken {
  const value = parseFloat(balance) * tokenPrice.current;
  return {
    address: `${symbol.toLowerCase()}-mock-address`,
    symbol: symbol,
    name: tokenPrice.name,
    decimals: 18, // Assuming 18 for simplicity for market view
    type: "crypto",
    network: "mainnet", // Generic network for market view
    price: tokenPrice.current,
    priceChange24h: tokenPrice.historical !== 0 ? ((tokenPrice.current - tokenPrice.historical) / tokenPrice.historical) * 100 : 0,
    balance: balance,
    balanceUsd: value,
    quantity: balance,
    value: value,
    allocation: 0, // Allocation is not relevant for general market data here
    performance24h: tokenPrice.historical !== 0 ? ((tokenPrice.current - tokenPrice.historical) / tokenPrice.historical) * 100 : 0,
    performance7d: 0, // No 7d historical in this mock
    performance30d: 0, // No 30d historical in this mock
  };
}

export async function GET(request: Request) {
  const operationId = performanceMonitor.startOperation('market-data-api');
  console.log('🚀 MARKET_DATA_API: Forcing use of hardcoded prices from price-service.ts by removing cache logic.');

  try {
    const searchParams = new URL(request.url).searchParams;
    const timeframe = searchParams.get("timeframe") || "1d";

    // Fetch hardcoded prices directly - Caching logic removed to ensure this path is taken
    console.log('🚀 MARKET_DATA_API: Calling getTokenPrices for hardcoded values.');
    const hardcodedTokenSymbols = ["BTC", "ETH", "USDC", "SOL", "ADA", "DOT"];
    const currentPrices = await getTokenPrices(hardcodedTokenSymbols, timeframe);

    const assetsForMarketData: PortfolioToken[] = hardcodedTokenSymbols
      .filter(symbol => currentPrices[symbol])
      .map(symbol => transformTokenPriceToMarketAsset(symbol, currentPrices[symbol]));

    if (assetsForMarketData.length === 0) {
      console.error("🚀 MARKET_DATA_API: No hardcoded price data found after calling getTokenPrices.");
      throw new Error("No hardcoded price data found for market display.");
    }
    console.log(`🚀 MARKET_DATA_API: Successfully transformed ${assetsForMarketData.length} hardcoded assets.`);

    // Calculate some aggregate data based on our hardcoded assets
    const totalMarketCap = assetsForMarketData.reduce((sum, asset) => sum + (asset.price * (parseFloat(asset.quantity) || 1000000)), 0); 
    const btcData = assetsForMarketData.find(asset => asset.symbol === "BTC");
    const btcDominance = btcData && totalMarketCap !== 0 ? (btcData.price * (parseFloat(btcData.quantity) || 1000000) / totalMarketCap) * 100 : 0;
    const totalVolume24h = assetsForMarketData.reduce((sum, asset) => sum + (asset.priceChange24h !== 0 ? Math.abs(asset.price * (parseFloat(asset.quantity) || 1000000) * (asset.priceChange24h/100)) : 0 ), 0) /10;
    console.log(`🚀 MARKET_DATA_API: Calculated aggregates - TotalMCap: ${totalMarketCap}, BTCDom: ${btcDominance}, TotalVol: ${totalVolume24h}`);

    // Get Twitter sentiment for BTC with error handling
    let twitterMetrics;
    try {
      twitterMetrics = await twitterService.getSentimentMetrics('BTC');
    } catch (error) {
      console.warn('[DEBUG] Market API: Twitter API Error (fallback used):', error);
      twitterMetrics = DEFAULT_SENTIMENT_DATA;
    }

    // Sort by 24h percent change for gainers/losers from our hardcoded set
    const sortedByChange = [...assetsForMarketData].sort((a, b) => 
      b.priceChange24h - a.priceChange24h
    );

    const marketData: MarketData = {
      totalMarketCap: totalMarketCap / 1e9, 
      marketCapChange24h: assetsForMarketData.length > 0 && assetsForMarketData[0].priceChange24h !== undefined ? assetsForMarketData[0].priceChange24h : 0,
      volume24h: totalVolume24h / 1e9, 
      volumeChange24h: 0, 
      btcDominance: btcDominance,
      btcDominanceChange24h: 0, 
      trendData: {
        timestamps: Array.from({ length: 24 }, (_, i) => Date.now() - (23 - i) * 3600000),
        marketCap: Array.from({ length: 24 }, () => totalMarketCap / 1e9),
        volume: Array.from({ length: 24 }, () => totalVolume24h / 1e9),
      },
      sentimentData: {
        overall: getSentiment(twitterMetrics.sentiment),
        score: Math.min(100, Math.max(0, 50 + twitterMetrics.sentiment * 25)),
        socialMetrics: {
          twitter: {
            sentiment: getSentiment(twitterMetrics.sentiment),
            volume24h: twitterMetrics.volume24h,
            volumeChange24h: 0, 
          },
          reddit: { 
            sentiment: btcData && btcData.priceChange24h !== undefined ? getSentiment(btcData.priceChange24h /100) : "Neutral",
            volume24h: 12345, 
            volumeChange24h: btcData && btcData.priceChange24h !== undefined ? btcData.priceChange24h : 0,
          },
        },
        technicalIndicators: { 
          macd: btcData && btcData.priceChange24h !== undefined && btcData.priceChange24h > 0 ? "buy" : "sell",
          rsi: btcData && btcData.priceChange24h !== undefined ? Math.min(100, Math.max(0, 50 + btcData.priceChange24h)) : 50,
          movingAverages: btcData && btcData.priceChange24h !== undefined && btcData.priceChange24h > 0 ? "buy" : "sell",
        },
      },
      topGainers: sortedByChange.slice(0, 2),
      topLosers: sortedByChange.slice(-2).reverse(),
    };
    console.log(`🚀 MARKET_DATA_API: Constructed marketData. BTC Price in topGainers/Losers (example): ${marketData.topGainers[0]?.price}`);

    performanceMonitor.endOperation('market-data-api', operationId);
    return NextResponse.json(marketData, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    console.error("🚀 MARKET_DATA_API Error (forcing hardcoded prices path):", error);
    performanceMonitor.endOperation('market-data-api', operationId);
    return NextResponse.json(
      { error: "Failed to fetch market data using forced hardcoded prices", message: (error as Error).message },
      { status: 500 }
    );
  }
}

function getSentiment(value: number): string {
  if (value > 0.5) return 'Very Bullish';
  if (value > 0.1) return 'Bullish'; 
  if (value < -0.5) return 'Very Bearish';
  if (value < -0.1) return 'Bearish'; 
  return 'Neutral';
} 