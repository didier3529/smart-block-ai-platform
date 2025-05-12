import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { EthereumBlockchainService } from '../service';
import { BlockchainServiceConfig, TransactionData, BlockData } from '../types';
import { canRunIntegrationTests } from './setup';
import { Redis } from 'ioredis';
import { WebSocket } from 'ws';
import { TrendSpotterAdapter } from '../adapters/TrendSpotterAdapter';
import { NFTAdapter } from '../adapters/NFTAdapter';
import { SmartContractAdapter } from '../adapters/SmartContractAdapter';
import { TokenAdapter } from '../adapters/TokenAdapter';
import { cleanup } from './setup';

// Test configuration with multiple real networks
const testConfig: BlockchainServiceConfig = {
  chains: [
    {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: process.env.ETH_MAINNET_RPC || '',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    },
    {
      chainId: 137,
      name: 'Polygon Mainnet',
      rpcUrl: process.env.POLYGON_MAINNET_RPC || '',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    }
  ],
  cache: {
    maxSize: 1000,
    ttl: 60000 // 1 minute
  },
  maxRetries: 3,
  maxConnections: 2,
  batchSize: 5,
  batchInterval: 1000,
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000
  }
};

describe('EthereumBlockchainService Integration Tests', () => {
  let service: EthereumBlockchainService;
  
  beforeAll(async () => {
    if (!canRunIntegrationTests()) {
      console.warn('Skipping integration tests - missing RPC URLs');
      return;
    }
    
    service = new EthereumBlockchainService(testConfig);
    await service.initialize();
  });

  afterAll(async () => {
    if (service) {
      await service.shutdown();
    }
  });

  describe('Multi-Chain Operations', () => {
    it('should get latest blocks from multiple chains', async () => {
      if (!canRunIntegrationTests()) return;
      
      const ethBlock = await service.getLatestBlock(1);
      const polygonBlock = await service.getLatestBlock(137);

      expect(ethBlock).toBeDefined();
      expect(ethBlock.number).toBeGreaterThan(0);
      expect(polygonBlock).toBeDefined();
      expect(polygonBlock.number).toBeGreaterThan(0);
    });

    it('should handle concurrent requests across chains', async () => {
      if (!canRunIntegrationTests()) return;

      const promises = [
        service.getLatestBlock(1),
        service.getGasPrice(1),
        service.getLatestBlock(137),
        service.getGasPrice(137)
      ];

      const results = await Promise.all(promises);
      results.forEach((result: any) => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should batch multiple requests efficiently', async () => {
      if (!canRunIntegrationTests()) return;

      const startTime = Date.now();
      const blockNumbers = [1, 2, 3, 4, 5].map(n => service.getBlock(1, n));
      const blocks = await Promise.all(blockNumbers);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(blocks).toHaveLength(5);
      blocks.forEach((block: any) => {
        expect(block).toBeDefined();
        expect(block.number).toBeDefined();
      });

      // Batching should be significantly faster than sequential requests
      expect(totalTime).toBeLessThan(5000); // Adjust threshold as needed
    });

    it('should handle connection pooling under load', async () => {
      if (!canRunIntegrationTests()) return;

      const requests = Array(10).fill(null).map(() => 
        service.getLatestBlock(1)
      );

      const results = await Promise.all(requests);
      results.forEach((block: any) => {
        expect(block).toBeDefined();
        expect(block.number).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling & Recovery', () => {
    it('should handle temporary RPC failures with retries', async () => {
      if (!canRunIntegrationTests()) return;

      // Force an error by temporarily using an invalid RPC URL
      const originalUrl = service['config'].chains[0].rpcUrl;
      service['config'].chains[0].rpcUrl = 'http://invalid-url';

      setTimeout(() => {
        service['config'].chains[0].rpcUrl = originalUrl;
      }, 1000);

      const block = await service.getLatestBlock(1);
      expect(block).toBeDefined();
      expect(block.number).toBeGreaterThan(0);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache and return cached results', async () => {
      if (!canRunIntegrationTests()) return;

      // First call - should hit RPC
      const block1 = await service.getBlock(1, 1);
      
      // Second call - should hit cache
      const startTime = Date.now();
      const block2 = await service.getBlock(1, 1);
      const endTime = Date.now();

      expect(block2).toEqual(block1);
      expect(endTime - startTime).toBeLessThan(50); // Cache hits should be very fast
    });
  });
});

describe('Blockchain Adapters Integration', () => {
  let redisClient: Redis;
  let websocket: WebSocket;
  let trendSpotter: TrendSpotterAdapter;
  let nftAdapter: NFTAdapter;
  let contractAdapter: SmartContractAdapter;
  let tokenAdapter: TokenAdapter;

  beforeAll(async () => {
    if (!canRunIntegrationTests()) {
      console.warn('Skipping integration tests - missing environment variables');
      return;
    }

    redisClient = new Redis(process.env.REDIS_URL);
    websocket = new WebSocket('wss://example.com/ws'); // Replace with actual WebSocket URL
    
    trendSpotter = new TrendSpotterAdapter({ redisClient, websocket });
    nftAdapter = new NFTAdapter({ redisClient, websocket });
    contractAdapter = new SmartContractAdapter({ redisClient });
    tokenAdapter = new TokenAdapter({ redisClient, websocket });

    // Wait for WebSocket connection
    await new Promise(resolve => websocket.on('open', resolve));
  });

  afterAll(async () => {
    if (!canRunIntegrationTests()) return;
    
    await cleanup();
    await redisClient.quit();
    websocket.close();
  });

  describe('Market Data Integration', () => {
    const testCases = ['BTC', 'ETH', 'USDT'];

    it.each(testCases)('should fetch and cache market data for %s', async (symbol) => {
      const data = await trendSpotter.getMarketData(symbol);
      expect(data).toBeDefined();
      expect(data.price).toBeGreaterThan(0);
      
      // Verify cache
      const cached = await redisClient.get(`market:${symbol}`);
      expect(cached).toBeDefined();
      expect(JSON.parse(cached!)).toEqual(data);
    });

    it('should handle multiple concurrent requests', async () => {
      const results = await Promise.all(
        testCases.map(symbol => trendSpotter.getMarketData(symbol))
      );
      expect(results).toHaveLength(testCases.length);
      results.forEach(data => expect(data.price).toBeGreaterThan(0));
    });
  });

  describe('NFT Integration', () => {
    const collections = ['boredapes', 'cryptopunks'];

    it.each(collections)('should fetch NFT collection data for %s', async (collection) => {
      const data = await nftAdapter.getCollectionData(collection);
      expect(data).toBeDefined();
      expect(data.floorPrice).toBeGreaterThanOrEqual(0);
      
      // Verify cache
      const cached = await redisClient.get(`nft:collection:${collection}`);
      expect(cached).toBeDefined();
      expect(JSON.parse(cached!)).toEqual(data);
    });

    it('should calculate rarity scores correctly', async () => {
      const collection = collections[0];
      const tokenId = '1234';
      const rarity = await nftAdapter.calculateRarityScore(collection, tokenId);
      expect(rarity).toBeDefined();
      expect(rarity.score).toBeGreaterThan(0);
    });
  });

  describe('Smart Contract Integration', () => {
    const contracts = [
      '0x1234567890123456789012345678901234567890', // Example contract
      '0x9876543210987654321098765432109876543210'  // Example contract
    ];

    it.each(contracts)('should analyze contract security for %s', async (address) => {
      const analysis = await contractAdapter.analyzeContractSecurity(address);
      expect(analysis).toBeDefined();
      expect(analysis.score).toBeDefined();
      expect(Array.isArray(analysis.vulnerabilities)).toBe(true);
    });

    it('should handle contract interactions correctly', async () => {
      const address = contracts[0];
      const mockTx = {
        hash: '0x123...',
        from: '0x456...',
        to: address,
        value: '0',
        data: '0x...'
      };

      const result = await contractAdapter.simulateTransaction(address, mockTx);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Token Integration', () => {
    const tokens = [
      '0x1234567890123456789012345678901234567890', // Example token
      '0x9876543210987654321098765432109876543210'  // Example token
    ];

    it.each(tokens)('should fetch token data and market metrics for %s', async (address) => {
      const data = await tokenAdapter.getTokenData(address);
      expect(data).toBeDefined();
      expect(data.symbol).toBeDefined();
      
      const metrics = await tokenAdapter.analyzeMarketMetrics(address);
      expect(metrics).toBeDefined();
      expect(metrics.marketCap).toBeDefined();
    });

    it('should analyze token distribution patterns', async () => {
      const address = tokens[0];
      const distribution = await tokenAdapter.analyzeTokenDistribution(address);
      expect(distribution).toBeDefined();
      expect(distribution.topHolders).toBeDefined();
      expect(Array.isArray(distribution.topHolders)).toBe(true);
    });
  });

  describe('Cross-adapter Integration', () => {
    it('should combine market and NFT data for analysis', async () => {
      const btcData = await trendSpotter.getMarketData('BTC');
      const nftData = await nftAdapter.getCollectionData('boredapes');
      
      expect(btcData.price).toBeGreaterThan(0);
      expect(nftData.floorPrice).toBeGreaterThanOrEqual(0);
      
      // Correlation analysis could be performed here
    });

    it('should analyze token and contract data together', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890';
      const tokenData = await tokenAdapter.getTokenData(tokenAddress);
      const contractAnalysis = await contractAdapter.analyzeContractSecurity(tokenAddress);
      
      expect(tokenData).toBeDefined();
      expect(contractAnalysis).toBeDefined();
      
      // Combined analysis could be performed here
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API rate limits across adapters', async () => {
      const promises = Array(10).fill(null).map(() => 
        Promise.all([
          trendSpotter.getMarketData('BTC'),
          nftAdapter.getCollectionData('boredapes'),
          tokenAdapter.getTokenData('0x1234567890123456789012345678901234567890')
        ])
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should recover from network errors', async () => {
      // Simulate network error
      websocket.emit('error', new Error('Connection failed'));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should still be able to make requests
      const btcData = await trendSpotter.getMarketData('BTC');
      expect(btcData).toBeDefined();
    });

    it('should handle cache failures gracefully', async () => {
      // Simulate Redis failure
      await redisClient.quit();
      
      // Should still work without cache
      const nftData = await nftAdapter.getCollectionData('boredapes');
      expect(nftData).toBeDefined();
      
      // Restore Redis connection
      redisClient = new Redis(process.env.REDIS_URL);
    });
  });
}); 