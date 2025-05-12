/**
 * WebSocket Configuration
 * Controls WebSocket behavior for development and production environments
 */

export const WebSocketConfig = {
  // URL for the WebSocket connection - used in production and if useMock is false
  url: 'wss://stream.coinmarketcap.com/price/latest',
  
  // Fallback URLs if the primary URL fails
  fallbackUrls: [
    'wss://alternative-stream.coinmarketcap.com/price/latest',
    'wss://backup-stream.coinmarketcap.com/price/latest'
  ],
  
  // Whether to use the mock WebSocket implementation
  // Set to true during development or when experiencing connection issues
  useMock: process.env.NODE_ENV === 'development' || process.env.USE_MOCK_WEBSOCKET === 'true',
  
  // Connection timeout in milliseconds
  connectionTimeout: 10000,
  
  // Maximum number of reconnection attempts
  maxReconnectAttempts: 5,
  
  // Reconnection delay in milliseconds (with exponential backoff)
  reconnectInterval: 5000,
  
  // WebSocket protocol version
  protocolVersion: 'v1',
  
  // Heartbeat interval in milliseconds
  heartbeatInterval: 30000,
  
  // Whether to enable verbose logging
  verbose: process.env.NODE_ENV === 'development',
  
  // Symbols to automatically subscribe to on connection
  defaultSymbols: ['BTC', 'ETH', 'SOL', 'DOGE']
}; 