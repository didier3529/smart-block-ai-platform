import { PriceFetcherConfig } from '@/config/price-fetcher-config';
import { Cache } from '@/lib/cache';
import { EventEmitter } from 'events';
import { PriceFetcher } from './price-fetcher';

export interface MarketPrice {
  current: number;
  historical: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
  symbol?: string;
  isMock?: boolean;
}

export interface MarketApiConfig {
  apiKey?: string;
  baseUrl: string;
  cacheTTL: number;
}

const formatSymbolForBinance = (symbol: string): string => {
  if (symbol.toUpperCase().endsWith('USDT')) {
    return symbol.toUpperCase();
  }
  return `${symbol.toUpperCase()}USDT`;
};

const parseBinanceSymbol = (binanceSymbol: string): string => {
  if (binanceSymbol.toUpperCase().endsWith('USDT')) {
    return binanceSymbol.toUpperCase().replace('USDT', '');
  }
  return binanceSymbol.toUpperCase();
};

class MarketDataAdapter extends EventEmitter {
  private static instance: MarketDataAdapter;
  private cache: Cache;
  private apiConfig: MarketApiConfig;
  private priceFetcher: PriceFetcher;
  private subscribedSymbols: Set<string> = new Set();
  private wsSendFunction: ((message: string) => void) | null = null;
  private currentWsId = 1;

  private mockPriceData: Record<string, MarketPrice> = {
    'BTC': {
      current: 102982.57,
      historical: 98567.34,
      change24h: 4.48,
      volume24h: 42391857384,
      marketCap: 1958293857493,
      lastUpdated: Date.now()
    },
    'ETH': {
      current: 6789.45, 
      historical: 6543.21,
      change24h: 3.76,
      volume24h: 21593748293,
      marketCap: 798123456789,
      lastUpdated: Date.now()
    },
    'SOL': {
      current: 320.87,
      historical: 298.45,
      change24h: 7.51,
      volume24h: 9876543210,
      marketCap: 123456789012,
      lastUpdated: Date.now()
    },
    'DOGE': {
      current: 0.42,
      historical: 0.39,
      change24h: 7.69,
      volume24h: 5432109876,
      marketCap: 54321098765,
      lastUpdated: Date.now()
    },
    'ADA': {
      current: 2.34,
      historical: 2.21,
      change24h: 5.88,
      volume24h: 3456789012,
      marketCap: 76543210987,
      lastUpdated: Date.now()
    },
    'DOT': {
      current: 42.67,
      historical: 40.12,
      change24h: 6.36,
      volume24h: 2345678901,
      marketCap: 45678901234,
      lastUpdated: Date.now()
    }
  };

  private constructor() {
    super();
    this.cache = new Cache({
      ttl: PriceFetcherConfig.cacheTTL,
      maxSize: 1000,
    });

    this.apiConfig = {
      baseUrl: PriceFetcherConfig.baseUrl,
      cacheTTL: PriceFetcherConfig.cacheTTL,
    };

    this.priceFetcher = PriceFetcher.getInstance();
  }

  public static getInstance(): MarketDataAdapter {
    if (!MarketDataAdapter.instance) {
      MarketDataAdapter.instance = new MarketDataAdapter();
    }
    return MarketDataAdapter.instance;
  }

  public setWsSendFunction(sendFunction: (message: string) => void): void {
    this.wsSendFunction = sendFunction;
  }

  private async fetchPriceData(symbol: string): Promise<MarketPrice> {
    try {
      if (PriceFetcherConfig.verbose) {
        console.log(`[MarketAdapter] fetchPriceData: Attempting to fetch for symbol: ${symbol}`);
      }

      const priceDataMap = await this.priceFetcher.getPrices([symbol]);
      const price = priceDataMap.get(symbol);

      if (PriceFetcherConfig.verbose) {
        console.log(`[MarketAdapter] fetchPriceData: Data received from priceFetcher.getPrices for API key '${symbol}':`, price);
      }

      if (!price || typeof price.current !== 'number' || price.current < 0) {
        if (PriceFetcherConfig.verbose) {
          console.warn(`[MarketAdapter] fetchPriceData: No valid price data (price object missing, current price not a non-negative number) for ${symbol}. Price object was:`, price, "Returning mock.");
        }
        return {
          symbol,
          current: 0,
          historical: 0,
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
          lastUpdated: Date.now(),
          isMock: true
        };
      }

      if (PriceFetcherConfig.verbose) {
        console.log(`[MarketAdapter] fetchPriceData: Valid price data found for ${symbol}. Current: ${price.current}, Historical: ${price.historical}`);
      }

      return {
        symbol,
        current: price.current,
        historical: price.historical,
        change24h: price.historical !== 0 ? ((price.current - price.historical) / price.historical) * 100 : 0,
        volume24h: price.volume || 0,
        marketCap: price.current * (price.volume || 0),
        lastUpdated: price.lastUpdate ? new Date(price.lastUpdate).getTime() : Date.now(),
        isMock: false
      };
    } catch (error) {
      if (PriceFetcherConfig.verbose) {
        console.error(`[MarketAdapter] Error fetching price for ${symbol}:`, error);
      }
      return {
        symbol,
        current: 0,
        historical: 0,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now(),
        isMock: true
      };
    }
  }

  public async getPrice(symbol: string): Promise<MarketPrice> {
    const cacheKey = `price:${symbol}`;
    // const cachedData = this.cache.get(cacheKey) as MarketPrice | undefined; // Temporarily bypass cache

    // Temporarily bypass cache check to force re-fetch from PriceFetcher via fetchPriceData
    // if (cachedData && Date.now() - cachedData.lastUpdated < (this.apiConfig.cacheTTL)) {
    //   if (PriceFetcherConfig.verbose) {
    //     console.log(`[MarketAdapter] Returning cached price for ${symbol}`);
    //   }
    //   return cachedData;
    // }

    if (PriceFetcherConfig.verbose) {
      console.log(`[MarketAdapter] getPrice: Cache miss or forced re-fetch for ${symbol}. Fetching new price.`);
    }
    const priceData = await this.fetchPriceData(symbol);
    this.cache.set(cacheKey, priceData); // Still update the cache after fetching
    return priceData;
  }

  public handleWebSocketMessage(jsonData: any): void {
    if (jsonData.e === '24hrTicker') {
      const symbol = parseBinanceSymbol(jsonData.s);
      const marketPrice: MarketPrice = {
        symbol: symbol,
        current: parseFloat(jsonData.c),
        historical: parseFloat(jsonData.o),
        change24h: parseFloat(jsonData.P),
        volume24h: parseFloat(jsonData.v),
        marketCap: parseFloat(jsonData.c) * parseFloat(jsonData.v),
        lastUpdated: jsonData.E,
      };
      
      const cacheKey = `price:${symbol}`;
      this.cache.set(cacheKey, marketPrice);
      
      this.emit('priceUpdate', { symbol, data: marketPrice });
      console.log(`[MarketAdapter] WS Price update for ${symbol}:`, marketPrice.current);
    } else if (jsonData.result === null && jsonData.id) {
      console.log(`[MarketAdapter] Received WS acknowledgment for ID ${jsonData.id}:`, jsonData);
    } else {
    }
  }

  public subscribe(symbols: string[]): void {
    if (!this.wsSendFunction) {
      console.warn('[MarketAdapter] wsSendFunction not set. Cannot subscribe.');
      return;
    }
    const streams = symbols.map(s => `${formatSymbolForBinance(s).toLowerCase()}@ticker`);
    const subMessage = {
      method: "SUBSCRIBE",
      params: streams,
      id: this.currentWsId++
    };
    this.wsSendFunction(JSON.stringify(subMessage));
    streams.forEach(s => this.subscribedSymbols.add(s));
    console.log(`[MarketAdapter] Sent WS subscribe for: ${streams.join(', ')}`);
  }

  public unsubscribe(symbols: string[]): void {
    if (!this.wsSendFunction) {
      console.warn('[MarketAdapter] wsSendFunction not set. Cannot unsubscribe.');
      return;
    }
    const streams = symbols.map(s => `${formatSymbolForBinance(s).toLowerCase()}@ticker`);
    const unsubMessage = {
      method: "UNSUBSCRIBE",
      params: streams,
      id: this.currentWsId++
    };
    this.wsSendFunction(JSON.stringify(unsubMessage));
    streams.forEach(s => this.subscribedSymbols.delete(s));
    console.log(`[MarketAdapter] Sent WS unsubscribe for: ${streams.join(', ')}`);
  }

  public resubscribeToAll(): void {
    if (this.subscribedSymbols.size > 0) {
      if (!this.wsSendFunction) {
        console.warn('[MarketAdapter] wsSendFunction not set. Cannot resubscribe.');
        return;
      }
      const symbolsToResubscribe = Array.from(this.subscribedSymbols).map(streamName => {
        return streamName.split('@')[0].toUpperCase().replace('USDT','');
      });

      if(symbolsToResubscribe.length > 0 ){
         console.log('[MarketAdapter] Resubscribing to streams:', symbolsToResubscribe);
         this.subscribe(symbolsToResubscribe);
      } else {
        console.log('[MarketAdapter] No symbols to resubscribe to.');
      }
    } else {
      console.log('[MarketAdapter] No symbols to resubscribe to.');
    }
  }

  public disconnect(): void {
    console.log('[MarketAdapter] Disconnect called, clearing subscribed symbols.');
    if (this.subscribedSymbols.size > 0 && this.wsSendFunction) {
        const streamsToUnsub = Array.from(this.subscribedSymbols);
        const symbolsToUnsub = streamsToUnsub.map(streamName => streamName.split('@')[0].toUpperCase().replace('USDT', ''));
        if (symbolsToUnsub.length > 0) this.unsubscribe(symbolsToUnsub);
    }
    this.subscribedSymbols.clear();
  }

  public removeAllListeners(event?: string | symbol | undefined): this {
    return super.removeAllListeners(event);
  }
}

export default MarketDataAdapter.getInstance(); 