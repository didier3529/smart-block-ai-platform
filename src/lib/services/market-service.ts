import type { MarketTrendsData } from "../hooks/use-market-trends"

const CMC_API_KEY = '036951ad-f286-4863-819a-0f94fc8455b6';
const CMC_API_BASE = 'https://pro-api.coinmarketcap.com/v1';

export async function getMarketTrends(timeframe: "1d" | "1w" | "1m" | "1y"): Promise<MarketTrendsData> {
  try {
    // Get top cryptocurrencies data with a single API call
    const response = await fetch(`${CMC_API_BASE}/cryptocurrency/listings/latest?limit=100&convert=USD`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('CoinMarketCap API Error:', errorData);
      throw new Error(`Failed to fetch market data: ${response.status}`);
    }

    const data = await response.json();
    
    // Sort by 24h percent change for trending coins
    const sortedByChange = [...data.data].sort((a: any, b: any) => 
      b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h
    );
    
    // Transform CoinMarketCap data to our format
    const trends = data.data.slice(0, 5).map((coin: any) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: `$${coin.quote.USD.price.toFixed(2)}`,
      change: `${coin.quote.USD.percent_change_24h > 0 ? '+' : ''}${coin.quote.USD.percent_change_24h.toFixed(1)}%`,
      volume: `$${(coin.quote.USD.volume_24h / 1e9).toFixed(1)}B`,
      marketCap: `$${(coin.quote.USD.market_cap / 1e9).toFixed(1)}B`,
      supply: `${(coin.total_supply / 1e6).toFixed(1)}M ${coin.symbol}`,
      sentiment: getSentiment(coin.quote.USD.percent_change_24h)
    }));

    // Get top gainers for trending
    const trending = sortedByChange.slice(0, 2).map((coin: any) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: `$${coin.quote.USD.price.toFixed(2)}`,
      change: `${coin.quote.USD.percent_change_24h > 0 ? '+' : ''}${coin.quote.USD.percent_change_24h.toFixed(1)}%`
    }));

    return {
      trends,
      trending
    };
  } catch (error) {
    console.error('Market Service Error:', error);
    throw new Error('Failed to fetch market trends');
  }
}

function getSentiment(change24h: number): string {
  if (change24h > 10) return 'Very Bullish';
  if (change24h > 0) return 'Bullish';
  if (change24h > -10) return 'Neutral';
  return 'Bearish';
}

export async function getMarketSentiment(): Promise<string> {
  try {
    const response = await fetch(`${CMC_API_BASE}/cryptocurrency/listings/latest?limit=10&convert=USD`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data = await response.json();
    const averageChange = data.data.reduce((sum: number, coin: any) => 
      sum + coin.quote.USD.percent_change_24h, 0
    ) / data.data.length;

    return getSentiment(averageChange);
  } catch (error) {
    console.error("Market Sentiment Error:", error);
    throw new Error("Failed to get market sentiment");
  }
}

export async function getMarketVolume(): Promise<string> {
  try {
    const response = await fetch(`${CMC_API_BASE}/cryptocurrency/listings/latest?limit=100&convert=USD`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data = await response.json();
    const totalVolume = data.data.reduce((sum: number, coin: any) => 
      sum + coin.quote.USD.volume_24h, 0
    );

    return `$${(totalVolume / 1e9).toFixed(1)}B`;
  } catch (error) {
    console.error("Market Volume Error:", error);
    throw new Error("Failed to get market volume");
  }
} 