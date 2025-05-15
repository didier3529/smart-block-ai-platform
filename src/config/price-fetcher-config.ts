/**
 * Price Fetcher Configuration
 * Controls the behavior of the REST API-based price fetcher
 */

export const PriceFetcherConfig = {
  // Binance REST API base URL
  baseUrl: 'https://api.binance.com/api/v3',
  
  // Polling interval in milliseconds (10 seconds)
  pollingInterval: 10000,
  
  // Cache TTL in milliseconds (30 seconds)
  cacheTTL: 30000,
  
  // Request timeout in milliseconds (5 seconds)
  requestTimeout: 5000,
  
  // Maximum number of retry attempts for failed requests
  maxRetries: 3,
  
  // Retry delay in milliseconds (with exponential backoff)
  retryInterval: 1000,
  
  // Whether to use mock data in development
  useMock: process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PRICES === 'true',
  
  // Whether to enable verbose logging
  verbose: process.env.NODE_ENV === 'development',
  
  // Default trading pairs to monitor
  defaultSymbols: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'DOGE'].map(symbol => `${symbol}USDT`)
}; 