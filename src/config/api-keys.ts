// API Keys Configuration
export const CMC_API_KEY = process.env.NEXT_PUBLIC_CMC_API_KEY || '036951ad-f286-4863-819a-0f94fc8455b6'
export const BINANCE_API_KEY = process.env.NEXT_PUBLIC_BINANCE_API_KEY
export const BINANCE_API_SECRET = process.env.NEXT_PUBLIC_BINANCE_API_SECRET

// Fallback to CoinMarketCap if no API key is provided
export const DEFAULT_PRICE_PROVIDER = 'coinmarketcap'

// WebSocket endpoints
export const CMC_WS_URL = 'wss://stream.coinmarketcap.com/price/latest'
export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws'

// REST API endpoints
export const CMC_API_BASE = 'https://pro-api.coinmarketcap.com/v1'
export const BINANCE_API_BASE = 'https://api.binance.com/api/v3'

// Binance REST API endpoints
export const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

// Default trading pairs to monitor
export const DEFAULT_TRADING_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'DOGEUSDT'
];

// API request settings
export const API_SETTINGS = {
  pollInterval: 10000, // 10 seconds
  timeout: 5000,      // 5 seconds
  maxRetries: 3
}; 