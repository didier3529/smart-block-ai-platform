import axios from 'axios';
import { PriceFetcherConfig } from '@/config/price-fetcher-config';

interface PriceData {
  symbol: string;
  price: number; // lastPrice
  historical: number; // openPrice
  priceChange: number; // lastPrice - openPrice
  priceChangePercent: number; // ( (lastPrice - openPrice) / openPrice ) * 100
  volume: number;
  lastUpdate: Date; // closeTime
}

export class PriceFetcher {
  private static instance: PriceFetcher;
  private baseUrl = 'https://api.binance.com/api/v3';
  private cache: Map<string, PriceData> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly updateInterval = 10000; // 10 seconds

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): PriceFetcher {
    if (!PriceFetcher.instance) {
      PriceFetcher.instance = new PriceFetcher();
    }
    return PriceFetcher.instance;
  }

  public startPolling(symbols: string[]) {
    if (symbols.length === 0) {
      this.stopPolling();
      return;
    }
    this.stopPolling(); // Clear any existing polling for different symbol sets
    console.log('[PriceFetcher] Starting polling for:', symbols);
    this.updatePrices(symbols); // Initial update
    
    this.pollingInterval = setInterval(() => {
      this.updatePrices(symbols);
    }, this.updateInterval);
  }

  public stopPolling() {
    if (this.pollingInterval) {
      console.log('[PriceFetcher] Stopping polling.');
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  public async getPrice(symbol: string): Promise<PriceData | null> {
    // This method now primarily serves to get from cache.
    // The polling mechanism is responsible for updating the cache.
    return this.cache.get(symbol) || null;
  }

  public async getPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const result = new Map<string, PriceData>();
    for (const symbol of symbols) {
      // Ensure symbol is in the format PriceFetcher expects for cache (e.g. BTCUSDT)
      const cacheKey = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
      const data = this.cache.get(cacheKey);
      if (data) {
        result.set(symbol, data); // Use original symbol as key for the result map as per MarketAdapter's expectation
      }
    }
    return result;
  }

  private async updatePrices(symbols: string[]) {
    if (symbols.length === 0) {
      return;
    }
    // Prepare symbols for API (e.g., ensure they are uppercase and end with USDT)
    const apiSymbols = symbols.map(s => s.toUpperCase().endsWith('USDT') ? s.toUpperCase() : `${s.toUpperCase()}USDT`);

    try {
      let responsesData: any[] = [];
      if (apiSymbols.length === 1) {
        const response = await axios.get(`${this.baseUrl}/ticker/24hr`, {
          params: { symbol: apiSymbols[0] }
        });
        responsesData = [response.data];
      } else if (apiSymbols.length > 1) {
        // Binance API for multiple symbols: /ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]
        const response = await axios.get(`${this.baseUrl}/ticker/24hr`, {
          // params: { symbols: apiSymbols } // This might work for some axios versions / APIs
          params: { symbols: JSON.stringify(apiSymbols) } // Standard way for Binance
        });
        responsesData = Array.isArray(response.data) ? response.data : [];
      }

      if (PriceFetcherConfig.verbose) {
         console.log('[PriceFetcher] API response data:', responsesData);
      }

      responsesData.forEach((data) => {
        if (!data || !data.symbol) {
          console.warn('[PriceFetcher] Received invalid data item from API:', data);
          return; // Skip this item
        }
        const originalSymbol = symbols.find(s => (s.toUpperCase().endsWith('USDT') ? s.toUpperCase() : `${s.toUpperCase()}USDT`) === data.symbol);
        if (!originalSymbol) {
            console.warn(`[PriceFetcher] Could not map API symbol ${data.symbol} back to an original requested symbol.`);
            return;
        }

        const lastPrice = parseFloat(data.lastPrice);
        const openPrice = parseFloat(data.openPrice);
        const priceChange = lastPrice - openPrice;
        const priceChangePercent = openPrice !== 0 ? (priceChange / openPrice) * 100 : 0;

        this.cache.set(data.symbol, { // Cache with the API symbol key (e.g. BTCUSDT)
          symbol: data.symbol, // Store the API symbol (e.g., BTCUSDT)
          price: lastPrice,
          historical: openPrice,
          priceChange: priceChange,
          priceChangePercent: priceChangePercent,
          volume: parseFloat(data.volume),
          lastUpdate: new Date(data.closeTime)
        });
         if (PriceFetcherConfig.verbose) {
            console.log(`[PriceFetcher] Cached data for ${data.symbol}:`, this.cache.get(data.symbol));
         }
      });
    } catch (error) {
      console.error(`[PriceFetcher] Error updating prices for symbols ${apiSymbols.join(',')}:`, error.response ? error.response.data : error.message);
      // Optionally, clear cache for these symbols or mark as error
      // For now, old data remains in cache until next successful fetch or TTL (if implemented)
    }
  }
} 