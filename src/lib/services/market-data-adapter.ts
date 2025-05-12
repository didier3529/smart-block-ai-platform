import { CMC_API_KEY } from '@/config/api-keys';
import { WebSocketConfig } from '@/config/websocket-config';
import { Cache } from '@/lib/cache';
import { EventEmitter } from 'events';
import { MockWebSocket } from './mock-websocket';

export interface MarketPrice {
  current: number;
  historical: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

export interface MarketDataConfig {
  apiKey: string;
  baseUrl: string;
  wsUrl: string;
  cacheTTL: number;
}

class MarketDataAdapter extends EventEmitter {
  private static instance: MarketDataAdapter;
  private cache: Cache;
  private wsConnection: WebSocket | null = null;
  private config: MarketDataConfig;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 5000;

  // Mock data for fallback when API calls fail
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
      ttl: 30000, // 30 seconds default TTL
      maxSize: 1000,
    });

    this.config = {
      apiKey: CMC_API_KEY,
      baseUrl: 'https://pro-api.coinmarketcap.com/v1',
      wsUrl: 'wss://stream.coinmarketcap.com/price/latest',
      cacheTTL: 30000,
    };

    this.initializeWebSocket();
  }

  public static getInstance(): MarketDataAdapter {
    if (!MarketDataAdapter.instance) {
      MarketDataAdapter.instance = new MarketDataAdapter();
    }
    return MarketDataAdapter.instance;
  }

  private async fetchPriceData(symbol: string): Promise<MarketPrice> {
    try {
      // Always use mock data in development or when mock mode is enabled
      if (process.env.NODE_ENV === 'development' || WebSocketConfig.useMock) {
        console.log(`🚀 Using MOCK price data for ${symbol}`);
        // Return mock data if available for this symbol
        if (this.mockPriceData[symbol]) {
          // Update the lastUpdated timestamp
          this.mockPriceData[symbol].lastUpdated = Date.now();
          return this.mockPriceData[symbol];
        }
        
        // Generate random mock data for unknown symbols
        return {
          current: Math.random() * 1000,
          historical: Math.random() * 900,
          change24h: Math.random() * 10,
          volume24h: Math.random() * 10000000000,
          marketCap: Math.random() * 100000000000,
          lastUpdated: Date.now()
        };
      }
      
      // Try the real API call
      const response = await fetch(
        `${this.config.baseUrl}/cryptocurrency/quotes/latest?symbol=${symbol}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.config.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch price data for ${symbol}`);
      }

      const data = await response.json();
      const quote = data.data[symbol].quote.USD;

      return {
        current: quote.price,
        historical: quote.price / (1 + quote.percent_change_24h / 100),
        change24h: quote.percent_change_24h,
        volume24h: quote.volume_24h,
        marketCap: quote.market_cap,
        lastUpdated: new Date(quote.last_updated).getTime(),
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      
      // Fallback to mock data on error
      console.log(`🚀 Falling back to MOCK price data for ${symbol} due to fetch error`);
      
      // Return mock data if available for this symbol
      if (this.mockPriceData[symbol]) {
        // Update the lastUpdated timestamp
        this.mockPriceData[symbol].lastUpdated = Date.now();
        return this.mockPriceData[symbol];
      }
      
      // Generate random mock data for unknown symbols
      return {
        current: Math.random() * 1000,
        historical: Math.random() * 900,
        change24h: Math.random() * 10,
        volume24h: Math.random() * 10000000000,
        marketCap: Math.random() * 100000000000,
        lastUpdated: Date.now()
      };
    }
  }

  public async getPrice(symbol: string): Promise<MarketPrice> {
    const cacheKey = `price:${symbol}`;
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.lastUpdated < this.config.cacheTTL) {
      return cachedData;
    }

    const priceData = await this.fetchPriceData(symbol);
    this.cache.set(cacheKey, priceData);
    return priceData;
  }

  private initializeWebSocket(): void {
    if (typeof window === 'undefined') return; // Don't initialize WS on server-side

    try {
      // Use mock WebSocket if configured, otherwise use real WebSocket
      if (WebSocketConfig.useMock) {
        console.log('Using MockWebSocket for development');
        this.wsConnection = new MockWebSocket(this.config.wsUrl) as unknown as WebSocket;
      } else {
        this.wsConnection = new WebSocket(this.config.wsUrl);
      }

      this.wsConnection.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connected');
        console.log('WebSocket connection established');
        
        // Subscribe to default symbols if configured
        if (WebSocketConfig.defaultSymbols && WebSocketConfig.defaultSymbols.length > 0) {
          WebSocketConfig.defaultSymbols.forEach(symbol => this.subscribe(symbol));
        }
      };

      // Setup connection timeout
      const connectionTimeoutId = setTimeout(() => {
        if (this.wsConnection && this.wsConnection.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout');
          
          // Create a timeout error event
          const timeoutEvent = new Event('error');
          if (this.wsConnection.onerror) {
            this.wsConnection.onerror.call(this.wsConnection, timeoutEvent);
          }
          
          // Close the connection and try to reconnect
          if (this.wsConnection.readyState !== WebSocket.CLOSED) {
            this.wsConnection.close();
          }
          this.handleReconnect();
        }
      }, WebSocketConfig.connectionTimeout);

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlePriceUpdate(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      this.wsConnection.onclose = (event) => {
        clearTimeout(connectionTimeoutId);
        console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        this.emit('disconnected', { code: event.code, reason: event.reason });
        this.handleReconnect();
      };

      this.wsConnection.onerror = (error) => {
        clearTimeout(connectionTimeoutId);
        // Create a more detailed error object for debugging
        const errorDetail = {
          message: 'WebSocket connection error',
          timestamp: new Date().toISOString(),
          reconnectAttempts: this.reconnectAttempts,
          url: this.config.wsUrl,
          error: this.serializeError(error)
        };
        
        console.error('WebSocket error:', errorDetail);
        this.emit('error', errorDetail);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.emit('error', { 
        message: 'Failed to initialize WebSocket connection',
        originalError: this.serializeError(error)
      });
      this.handleReconnect();
    }
  }
  
  /**
   * Helper method to safely serialize an error object
   */
  private serializeError(error: any): any {
    if (!error) return { message: 'Unknown error (empty error object)' };
    
    try {
      // If it's an Event object (like in WebSocket errors)
      if (error instanceof Event) {
        return {
          type: error.type,
          timeStamp: error.timeStamp,
          target: error.target ? {
            url: (error.target as any).url || 'unknown',
            readyState: (error.target as any).readyState || 'unknown'
          } : 'unknown'
        };
      }
      
      // If it's a regular Error object
      if (error instanceof Error) {
        return {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      }
      
      // Unknown error type
      return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      // Last resort fallback
      return { 
        message: 'Error object could not be serialized',
        errorType: typeof error,
        errorToString: String(error)
      };
    }
  }

  private handlePriceUpdate(data: any): void {
    const symbol = data.symbol;
    const cacheKey = `price:${symbol}`;
    const currentData = this.cache.get(cacheKey);

    const updatedData: MarketPrice = {
      current: data.price,
      historical: currentData?.historical || data.price,
      change24h: data.percent_change_24h,
      volume24h: data.volume_24h,
      marketCap: data.market_cap,
      lastUpdated: Date.now(),
    };

    this.cache.set(cacheKey, updatedData);
    this.emit('priceUpdate', { symbol, data: updatedData });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      const maxAttemptsError = new Error(`Max reconnection attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached`);
      console.error(maxAttemptsError);
      this.emit('error', maxAttemptsError);
      return;
    }

    console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.initializeWebSocket();
    }, this.RECONNECT_INTERVAL);
  }

  public subscribe(symbol: string): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        action: 'subscribe',
        symbol: symbol,
      }));
    }
  }

  public unsubscribe(symbol: string): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        action: 'unsubscribe',
        symbol: symbol,
      }));
    }
  }

  public disconnect(): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      try {
        // Close with normal closure code
        this.wsConnection.close(1000, 'Client disconnected');
        this.wsConnection = null;
        console.log('WebSocket disconnected manually');
      } catch (error) {
        console.error('Error closing WebSocket connection:', error);
      }
    }
  }

  public removeAllListeners(): void {
    this.removeAllListeners('connected');
    this.removeAllListeners('disconnected');
    this.removeAllListeners('error');
    this.removeAllListeners('priceUpdate');
  }

  public connect(): void {
    console.log('Connecting to market data service...');
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.initializeWebSocket();
  }
}

export const marketDataAdapter = MarketDataAdapter.getInstance(); 