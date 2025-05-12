import { AggregationManager } from '../aggregation-manager';
import { AggregationPipeline } from '../aggregation-pipeline';
import { ChainData, AggregationConfig, CrossChainMetrics } from '../../../types/chain';

describe('Multi-chain Data Aggregation', () => {
  let manager: AggregationManager;
  let pipeline: AggregationPipeline;

  beforeEach(() => {
    manager = AggregationManager.getInstance();
    pipeline = AggregationPipeline.getInstance();
  });

  const mockConfig: AggregationConfig = {
    decimals: 18,
    metadataNormalizers: {
      gasPrice: (value: string) => parseFloat(value) / 1e9, // Convert to Gwei
    },
    aggregators: {
      transaction: (data: ChainData[]) => ({
        count: data.length,
        totalValue: data.reduce((sum, item) => sum + Number(item.value), 0),
      }),
    },
    crossChainAnalysis: (metrics: Record<string, any>) => ({
      totalValue: Object.values(metrics).reduce((sum: number, m: any) => sum + m.totalValue, 0),
    }),
  };

  const createMockChainData = (chainId: string, value: number): ChainData => ({
    chainId,
    type: 'transaction',
    timestamp: new Date(),
    value: value.toString(),
    metadata: {
      gasPrice: '1000000000', // 1 Gwei
    },
  });

  describe('Chain Registration', () => {
    it('should successfully register a new chain', () => {
      const chainId = 'eth-mainnet';
      manager.registerChain(chainId, mockConfig);
      
      // Add test data
      const testData = createMockChainData(chainId, 1.5);
      expect(() => manager.addData(chainId, testData)).not.toThrow();
    });

    it('should throw error when adding data for unregistered chain', () => {
      const chainId = 'unregistered-chain';
      const testData = createMockChainData(chainId, 1.0);
      
      expect(() => manager.addData(chainId, testData)).toThrow();
    });

    it('should handle multiple chain registrations', () => {
      const chains = ['eth-mainnet', 'bsc-mainnet', 'polygon-mainnet'];
      
      chains.forEach(chainId => {
        manager.registerChain(chainId, mockConfig);
        const testData = createMockChainData(chainId, 1.0);
        expect(() => manager.addData(chainId, testData)).not.toThrow();
      });
    });
  });

  describe('Data Processing', () => {
    const chainId = 'eth-mainnet';
    let processedData: any = null;

    beforeEach(() => {
      manager.registerChain(chainId, mockConfig);
      manager.on('dataProcessed', (event) => {
        processedData = event;
      });
    });

    it('should process chain data correctly', async () => {
      const testData = createMockChainData(chainId, 1.5);
      manager.addData(chainId, testData);

      // Wait for processing interval
      await new Promise(resolve => setTimeout(resolve, 5500));

      expect(processedData).toBeTruthy();
      expect(processedData.chainId).toBe(chainId);
      expect(processedData.aggregatedData.metrics.transaction).toBeTruthy();
      expect(processedData.aggregatedData.metrics.transaction.count).toBe(1);
      expect(processedData.aggregatedData.metrics.transaction.totalValue).toBe(1.5);
    });

    it('should normalize metadata correctly', async () => {
      const testData = createMockChainData(chainId, 1.0);
      manager.addData(chainId, testData);

      // Wait for processing interval
      await new Promise(resolve => setTimeout(resolve, 5500));

      expect(processedData.aggregatedData.metrics.transaction).toBeTruthy();
      expect(testData.metadata.gasPrice).toBe('1000000000');
      // Should be normalized to 1 Gwei
      expect(mockConfig.metadataNormalizers?.gasPrice(testData.metadata.gasPrice)).toBe(1);
    });
  });

  describe('Cross-chain Analysis', () => {
    let crossChainMetrics: CrossChainMetrics | null = null;

    beforeEach(() => {
      crossChainMetrics = null;
      manager.on('crossChainMetrics', (metrics) => {
        crossChainMetrics = metrics;
      });
    });

    it('should calculate cross-chain metrics correctly', async () => {
      const chains = [
        { id: 'eth-mainnet', value: 1.5 },
        { id: 'bsc-mainnet', value: 2.5 },
        { id: 'polygon-mainnet', value: 1.0 },
      ];

      // Register chains and add data
      chains.forEach(chain => {
        manager.registerChain(chain.id, mockConfig);
        manager.addData(chain.id, createMockChainData(chain.id, chain.value));
      });

      // Wait for processing interval
      await new Promise(resolve => setTimeout(resolve, 5500));

      expect(crossChainMetrics).toBeTruthy();
      if (crossChainMetrics) {
        expect(crossChainMetrics.totalTransactions).toBe(3);
        expect(crossChainMetrics.totalValueLocked).toBeGreaterThan(0);
        expect(Object.keys(crossChainMetrics.chainActivity).length).toBe(3);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const chainId = 'eth-mainnet';
      manager.registerChain(chainId, mockConfig);

      const invalidData = {
        ...createMockChainData(chainId, 1.0),
        value: 'invalid',
      };

      expect(() => manager.addData(chainId, invalidData)).not.toThrow();
    });

    it('should emit error events for processing failures', async () => {
      const chainId = 'eth-mainnet';
      let errorEvent: any = null;

      manager.registerChain(chainId, {
        ...mockConfig,
        aggregators: {
          transaction: () => {
            throw new Error('Aggregation failed');
          },
        },
      });

      manager.on('error', (event) => {
        errorEvent = event;
      });

      manager.addData(chainId, createMockChainData(chainId, 1.0));

      // Wait for processing interval
      await new Promise(resolve => setTimeout(resolve, 5500));

      expect(errorEvent).toBeTruthy();
      expect(errorEvent.chainId).toBe(chainId);
      expect(errorEvent.error.message).toBe('Aggregation failed');
    });
  });
}); 