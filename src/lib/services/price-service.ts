import { marketDataAdapter, MarketPrice } from './market-data-adapter';

export interface TokenPrice {
  current: number; // USD price
  historical: number; // USD price
  name: string;
}

// Get real-time prices from CoinMarketCap through our adapter
export async function getTokenPrices(tokens: string[], timeframe: string): Promise<Record<string, TokenPrice>> {
  const result: Record<string, TokenPrice> = {};
  
  for (const symbol of tokens) {
    try {
      const marketPrice = await marketDataAdapter.getPrice(symbol);
      result[symbol] = {
        name: symbol, // We could maintain a mapping of full names if needed
        current: marketPrice.current,
        historical: marketPrice.historical,
      };
      console.log(`🚀 REAL_TIME_PRICE for ${symbol}: Current $${marketPrice.current}, Historical $${marketPrice.historical}`);
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      // Fallback for error cases - you might want to handle this differently
      result[symbol] = {
        name: symbol,
        current: 0,
        historical: 0,
      };
    }
  }
  
  return result;
} 