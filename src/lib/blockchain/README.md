# Blockchain Adapters Documentation

## Overview

The blockchain adapters provide a robust interface for interacting with various blockchain data sources and services. The system is designed to be modular, extensible, and efficient, with built-in caching and error handling.

## Core Components

### 1. TrendSpotterAdapter

The TrendSpotter adapter provides real-time market data and trend analysis capabilities.

#### Features:
- Real-time price tracking
- Market trend analysis
- Pattern detection
- WebSocket-based price updates
- Redis-backed caching

#### Usage:
```typescript
const adapter = new TrendSpotterAdapter({
  redisClient,
  websocket
});

// Get market data
const btcData = await adapter.getMarketData('BTC');

// Subscribe to updates
adapter.subscribeToPriceUpdates('BTC');
adapter.onPriceUpdate((data) => {
  console.log('Price update:', data);
});

// Analyze trends
const trends = await adapter.analyzeTrends('BTC', '1d');
```

### 2. NFTAdapter

The NFT adapter handles NFT collection data, metadata, and market analysis.

#### Features:
- Collection statistics
- NFT metadata retrieval
- Rarity score calculation
- Floor price tracking
- Sales trend analysis

#### Usage:
```typescript
const adapter = new NFTAdapter({
  redisClient,
  websocket
});

// Get collection data
const collection = await adapter.getCollectionData('boredapes');

// Get NFT metadata
const metadata = await adapter.getNFTMetadata('boredapes', '1234');

// Calculate rarity
const rarity = await adapter.calculateRarityScore('boredapes', '1234');
```

### 3. SmartContractAdapter

The Smart Contract adapter provides contract analysis and interaction capabilities.

#### Features:
- Contract security analysis
- Gas usage optimization
- Pattern detection
- Transaction simulation
- Event parsing

#### Usage:
```typescript
const adapter = new SmartContractAdapter({
  redisClient
});

// Analyze contract
const security = await adapter.analyzeContractSecurity(contractAddress);

// Simulate transaction
const result = await adapter.simulateTransaction(contractAddress, transaction);

// Parse events
const events = await adapter.parseEventLogs(contractAddress, logs);
```

### 4. TokenAdapter

The Token adapter handles ERC20, ERC721, and ERC1155 token interactions.

#### Features:
- Token data retrieval
- Balance checking
- Distribution analysis
- Market metrics
- Transfer monitoring

#### Usage:
```typescript
const adapter = new TokenAdapter({
  redisClient,
  websocket
});

// Get token data
const token = await adapter.getTokenData(tokenAddress);

// Check balance
const balance = await adapter.getTokenBalance(tokenAddress, walletAddress);

// Analyze distribution
const distribution = await adapter.analyzeTokenDistribution(tokenAddress);
```

## Caching System

All adapters use Redis for caching with the following features:
- TTL-based cache expiration
- Cache invalidation on updates
- Fallback to API on cache miss
- Distributed cache locking

### Cache Keys:
- Market data: `market:{symbol}`
- NFT collections: `nft:collection:{collection}`
- NFT metadata: `nft:metadata:{collection}:{tokenId}`
- Contract data: `contract:{address}`
- Token data: `token:{address}`

## Error Handling

The adapters implement comprehensive error handling:
- Automatic retry on network errors
- Rate limit handling with exponential backoff
- Cache fallback on API failures
- Graceful degradation of service
- Error event propagation

## WebSocket Integration

Real-time updates are handled through WebSocket connections:
- Automatic reconnection
- Message queuing during disconnects
- Event-based subscription system
- Heartbeat monitoring

## Testing

The adapters include both unit and integration tests:
- Mocked external services
- Redis integration testing
- WebSocket event testing
- Cross-adapter integration tests

### Running Tests:
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run all tests
npm test
```

## Environment Configuration

Required environment variables:
```
REDIS_URL=redis://localhost:6379
COINGECKO_API_KEY=your_key
DEFILLAMA_API_KEY=your_key
OPENSEA_API_KEY=your_key
NFTPORT_API_KEY=your_key
ALCHEMY_API_KEY=your_key
```

## Best Practices

1. Always use the adapter factory to create instances:
```typescript
const adapter = AdapterFactory.create(AdapterType.TREND_SPOTTER, config);
```

2. Implement proper error handling:
```typescript
try {
  const data = await adapter.getMarketData('BTC');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting
  } else if (error instanceof NetworkError) {
    // Handle network issues
  }
}
```

3. Clean up resources:
```typescript
// Properly close connections
await adapter.cleanup();
```

4. Use the caching system effectively:
```typescript
// Check cache first
const cached = await adapter.getCached(key);
if (cached) return cached;

// Fetch and cache
const data = await adapter.fetchFresh();
await adapter.cache(key, data);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details 