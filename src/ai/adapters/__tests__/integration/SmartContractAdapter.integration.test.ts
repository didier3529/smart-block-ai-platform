import { SmartContractAdapter } from '../../SmartContractAdapter';
import { ContractDataSource } from '../../datasources/ContractDataSource';
import { SmartContractCache } from '../../cache/SmartContractCache';
import { CacheFactory } from '../../cache/CacheFactory';
import { DataSourceFactory } from '../../datasources/DataSourceFactory';
import { ethers } from 'ethers';

jest.mock('../../cache/CacheFactory');
jest.mock('../../datasources/DataSourceFactory');
jest.mock('ethers');

describe('SmartContractAdapter Integration', () => {
  let adapter: SmartContractAdapter;
  let mockContractDataSource: jest.Mocked<ContractDataSource>;
  let mockCache: jest.Mocked<SmartContractCache>;

  const testContractAddress = '0x123';
  const testEvent = {
    address: testContractAddress,
    topics: [ethers.utils.id('Transfer(address,address,uint256)')],
    data: '0x0',
    blockNumber: 1000,
    transactionHash: '0xabc',
    logIndex: 0
  };

  beforeEach(() => {
    mockContractDataSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
      subscribeToEvents: jest.fn(),
      unsubscribeFromEvents: jest.fn(),
      getContractState: jest.fn(),
      getLogs: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    } as any;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    } as any;

    (DataSourceFactory.getInstance as jest.Mock).mockReturnValue({
      getContractDataSource: jest.fn().mockReturnValue(mockContractDataSource)
    });

    (CacheFactory.getInstance as jest.Mock).mockReturnValue({
      getSmartContractCache: jest.fn().mockReturnValue(mockCache)
    });

    adapter = new SmartContractAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('contract monitoring', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should monitor contract events with caching', async () => {
      // Set up cache miss for initial state
      mockCache.get.mockResolvedValueOnce(undefined);

      // Set up contract state response
      const mockState = {
        balance: ethers.BigNumber.from('1000000000000000000'),
        nonce: 5,
        code: '0x...'
      };
      mockContractDataSource.getContractState.mockResolvedValueOnce(mockState);

      // Start monitoring
      await adapter.monitorContract(testContractAddress);

      // Verify data source interaction
      expect(mockContractDataSource.subscribeToEvents).toHaveBeenCalledWith({
        address: testContractAddress,
        topics: [null] // Subscribe to all events
      });

      // Trigger contract event
      const eventHandler = mockContractDataSource.on.mock.calls.find(
        call => call[0] === 'contractEvent'
      )[1];
      eventHandler(testEvent);

      // Verify caching behavior
      expect(mockCache.get).toHaveBeenCalledWith(`state:${testContractAddress}`);
      expect(mockCache.set).toHaveBeenCalledWith(
        `state:${testContractAddress}`,
        expect.objectContaining(mockState)
      );
    });

    it('should use cached contract state when available', async () => {
      const cachedState = {
        balance: '1000000000000000000',
        nonce: 5,
        code: '0x...',
        timestamp: Date.now() - 1000
      };

      mockCache.get.mockResolvedValueOnce(cachedState);

      const state = await adapter.getContractState(testContractAddress);

      expect(mockContractDataSource.getContractState).not.toHaveBeenCalled();
      expect(state).toEqual(cachedState);
    });

    it('should handle contract errors gracefully', async () => {
      mockCache.get.mockResolvedValueOnce(undefined);
      mockContractDataSource.getContractState.mockRejectedValueOnce(
        new Error('Contract not found')
      );

      await expect(adapter.getContractState(testContractAddress))
        .rejects
        .toThrow('Failed to get contract state: Contract not found');
    });
  });

  describe('security analysis', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should perform security analysis with caching', async () => {
      // Set up cache miss for security analysis
      mockCache.get.mockResolvedValueOnce(undefined);

      // Set up contract code response
      const mockCode = '0x608060405234801561001057600080fd5b50...';
      mockContractDataSource.getContractState.mockResolvedValueOnce({
        code: mockCode
      });

      // Request security analysis
      const analysis = await adapter.analyzeSecurity(testContractAddress);

      // Verify analysis result
      expect(analysis).toEqual(expect.objectContaining({
        vulnerabilities: expect.any(Array),
        riskLevel: expect.any(String),
        timestamp: expect.any(Number)
      }));

      // Verify caching behavior
      expect(mockCache.get).toHaveBeenCalledWith(`security:${testContractAddress}`);
      expect(mockCache.set).toHaveBeenCalledWith(
        `security:${testContractAddress}`,
        expect.objectContaining({
          vulnerabilities: expect.any(Array),
          riskLevel: expect.any(String)
        })
      );
    });

    it('should use cached security analysis when available', async () => {
      const cachedAnalysis = {
        vulnerabilities: [
          { type: 'reentrancy', severity: 'high', location: '0x123' }
        ],
        riskLevel: 'high',
        timestamp: Date.now() - 1000
      };

      mockCache.get.mockResolvedValueOnce(cachedAnalysis);

      const analysis = await adapter.analyzeSecurity(testContractAddress);

      expect(mockContractDataSource.getContractState).not.toHaveBeenCalled();
      expect(analysis).toEqual(cachedAnalysis);
    });
  });

  describe('gas optimization', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should analyze gas usage patterns', async () => {
      // Set up transaction history
      const mockTxs = [
        {
          hash: '0x123',
          gasUsed: ethers.BigNumber.from('50000'),
          timestamp: Date.now() - 3600000
        },
        {
          hash: '0x456',
          gasUsed: ethers.BigNumber.from('75000'),
          timestamp: Date.now() - 1800000
        }
      ];

      mockContractDataSource.getLogs.mockResolvedValueOnce(mockTxs);

      const gasAnalysis = await adapter.analyzeGasUsage(testContractAddress);

      expect(gasAnalysis).toEqual(expect.objectContaining({
        averageGasUsed: expect.any(Number),
        recommendations: expect.any(Array),
        timestamp: expect.any(Number)
      }));
    });
  });

  describe('event tracking', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should track and analyze event patterns', async () => {
      const eventHandler = jest.fn();
      adapter.on('contractEvent', eventHandler);

      // Simulate multiple events
      const contractEventHandler = mockContractDataSource.on.mock.calls.find(
        call => call[0] === 'contractEvent'
      )[1];

      contractEventHandler({
        ...testEvent,
        blockNumber: 1000
      });

      contractEventHandler({
        ...testEvent,
        blockNumber: 1001
      });

      expect(eventHandler).toHaveBeenCalledTimes(2);
      expect(eventHandler).toHaveBeenLastCalledWith(
        expect.objectContaining({
          address: testContractAddress,
          blockNumber: 1001
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should properly clean up resources on shutdown', async () => {
      await adapter.initialize();
      await adapter.monitorContract(testContractAddress);

      await adapter.shutdown();

      expect(mockContractDataSource.disconnect).toHaveBeenCalled();
      expect(mockCache.dispose).toHaveBeenCalled();
    });
  });
}); 