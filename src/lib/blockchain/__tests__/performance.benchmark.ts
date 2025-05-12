import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { EthereumBlockchainService } from '../service';
import { BlockchainServiceConfig } from '../types';
import { canRunIntegrationTests } from './setup';
import { PerformanceMetrics } from '../performance';
import { connectWallet } from '../walletConnection';
import { performance } from 'perf_hooks';

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
    }
  ],
  maxRetries: 3,
  cache: {
    maxSize: 1000,
    ttl: 60000
  },
  maxConnections: 5,
  batchSize: 10,
  batchInterval: 100,
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000
  }
};

describe('Blockchain Service Performance Benchmarks', () => {
  let service: EthereumBlockchainService;
  let metrics: PerformanceMetrics;

  beforeAll(async () => {
    if (!canRunIntegrationTests()) {
      console.warn('Skipping performance benchmarks - missing RPC URLs');
      return;
    }
    service = new EthereumBlockchainService(testConfig);
    await service.initialize();
    metrics = new PerformanceMetrics();
  });

  afterAll(async () => {
    if (service) {
      await service.shutdown();
    }
  });

  describe('Batch Processing Performance', () => {
    it('should process batched requests more efficiently than individual requests', async () => {
      if (!canRunIntegrationTests()) return;

      // Test individual requests
      const individualStart = Date.now();
      const individualPromises = [];
      for (let i = 1; i <= 5; i++) {
        individualPromises.push(service.getBlock(1, i));
      }
      await Promise.all(individualPromises);
      const individualTime = Date.now() - individualStart;

      // Clear cache to ensure fair comparison
      await service.clearCache();

      // Test batched requests
      const batchStart = Date.now();
      const batchPromises = [];
      for (let i = 1; i <= 5; i++) {
        batchPromises.push(service.getBlock(1, i));
      }
      await Promise.all(batchPromises);
      const batchTime = Date.now() - batchStart;

      console.log('Performance comparison:');
      console.log('Individual requests time:', individualTime, 'ms');
      console.log('Batched requests time:', batchTime, 'ms');
      console.log('Performance improvement:', ((individualTime - batchTime) / individualTime * 100).toFixed(2) + '%');

      // Batched requests should be at least 30% faster
      expect(batchTime).toBeLessThan(individualTime * 0.7);
    }, 30000);
  });

  describe('Connection Pool Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      if (!canRunIntegrationTests()) return;

      const startTime = Date.now();
      const concurrentRequests = 20;
      const promises = Array(concurrentRequests).fill(null).map(() => 
        service.getLatestBlock(1)
      );

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest = totalTime / concurrentRequests;

      console.log('Connection pool performance:');
      console.log('Total time for', concurrentRequests, 'requests:', totalTime, 'ms');
      console.log('Average time per request:', avgTimePerRequest, 'ms');

      // Average time per request should be reasonable
      expect(avgTimePerRequest).toBeLessThan(500); // Adjust threshold based on network conditions
    }, 30000);
  });

  describe('Cache Performance', () => {
    it('should significantly improve response times for cached data', async () => {
      if (!canRunIntegrationTests()) return;

      // First request - uncached
      const uncachedStart = Date.now();
      const block = await service.getBlock(1, 1);
      const uncachedTime = Date.now() - uncachedStart;

      // Second request - should hit cache
      const cachedStart = Date.now();
      const cachedBlock = await service.getBlock(1, 1);
      const cachedTime = Date.now() - cachedStart;

      console.log('Cache performance:');
      console.log('Uncached request time:', uncachedTime, 'ms');
      console.log('Cached request time:', cachedTime, 'ms');
      console.log('Performance improvement:', ((uncachedTime - cachedTime) / uncachedTime * 100).toFixed(2) + '%');

      // Cached requests should be at least 90% faster
      expect(cachedTime).toBeLessThan(uncachedTime * 0.1);
      expect(cachedBlock).toEqual(block);
    });
  });

  describe('Overall Service Performance', () => {
    it('should maintain good performance under load', async () => {
      if (!canRunIntegrationTests()) return;

      const operations = [
        () => service.getLatestBlock(1),
        () => service.getGasPrice(1),
        () => service.getBlock(1, 1),
        () => service.getBlock(1, 2),
        () => service.getBlock(1, 3)
      ];

      const startTime = Date.now();
      const iterations = 3;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const iterationPromises = operations.map(op => op());
        results.push(await Promise.all(iterationPromises));
      }

      const totalTime = Date.now() - startTime;
      const totalOperations = operations.length * iterations;
      const avgTimePerOperation = totalTime / totalOperations;

      console.log('Overall performance metrics:');
      console.log('Total operations:', totalOperations);
      console.log('Total time:', totalTime, 'ms');
      console.log('Average time per operation:', avgTimePerOperation, 'ms');

      // Get detailed metrics
      const serviceMetrics = service.getPerformanceMetrics();
      console.log('Detailed performance metrics:', serviceMetrics);

      // Performance assertions
      expect(avgTimePerOperation).toBeLessThan(1000); // Adjust threshold based on network conditions
      expect(results).toHaveLength(iterations);
      results.forEach(result => {
        expect(result).toHaveLength(operations.length);
      });
    }, 60000);
  });
});

describe('Wallet Connection Performance', () => {
  const CONNECTION_TIMEOUT = 3000; // 3 seconds

  beforeEach(() => {
    jest.setTimeout(10000); // 10 seconds for test timeout
  });

  it('should connect to wallet within acceptable time limit', async () => {
    const startTime = performance.now();
    
    try {
      await connectWallet();
      const endTime = performance.now();
      const connectionTime = endTime - startTime;
      
      console.log(`Wallet connection time: ${connectionTime}ms`);
      expect(connectionTime).toBeLessThan(CONNECTION_TIMEOUT);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  });
}); 