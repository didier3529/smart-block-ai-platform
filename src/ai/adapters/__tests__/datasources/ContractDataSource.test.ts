import { ContractDataSource, ContractDataConfig, ContractEventFilter, ContractCallParams } from '../../datasources/ContractDataSource';
import { ethers } from 'ethers';

jest.mock('ethers');

describe('ContractDataSource', () => {
  let dataSource: ContractDataSource;
  let mockProvider: jest.Mocked<ethers.providers.JsonRpcProvider>;
  const defaultConfig: ContractDataConfig = {
    rpcUrl: 'http://test.eth',
    networkId: 1,
    maxBlockRange: 1000,
    retryAttempts: 3,
    retryDelay: 100
  };

  beforeEach(() => {
    mockProvider = {
      ready: Promise.resolve(),
      on: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      getLogs: jest.fn(),
      getTransaction: jest.fn()
    } as any;

    (ethers.providers.JsonRpcProvider as jest.Mock).mockImplementation(() => mockProvider);
    dataSource = new ContractDataSource(defaultConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connection management', () => {
    it('should establish provider connection', async () => {
      await dataSource.connect();

      expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(
        defaultConfig.rpcUrl,
        defaultConfig.networkId
      );
      expect(mockProvider.on).toHaveBeenCalledWith('block', expect.any(Function));
      expect(mockProvider.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(dataSource.getConnectionStatus()).toBe(true);
    });

    it('should handle disconnection', async () => {
      await dataSource.connect();
      await dataSource.disconnect();

      expect(mockProvider.removeAllListeners).toHaveBeenCalled();
      expect(dataSource.getConnectionStatus()).toBe(false);
    });

    it('should emit connected event', async () => {
      const connectHandler = jest.fn();
      dataSource.on('connected', connectHandler);

      await dataSource.connect();
      expect(connectHandler).toHaveBeenCalled();
    });
  });

  describe('event subscription', () => {
    const testFilter: ContractEventFilter = {
      address: '0x123',
      topics: ['0xabc']
    };

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should subscribe to events', async () => {
      await dataSource.subscribeToEvents(testFilter);

      expect(mockProvider.on).toHaveBeenCalledWith(
        testFilter,
        expect.any(Function)
      );
    });

    it('should unsubscribe from events', async () => {
      await dataSource.subscribeToEvents(testFilter);
      await dataSource.unsubscribeFromEvents(testFilter);

      expect(mockProvider.off).toHaveBeenCalledWith(
        testFilter,
        expect.any(Function)
      );
    });

    it('should handle event emissions', async () => {
      const eventHandler = jest.fn();
      dataSource.on('contractEvent', eventHandler);

      await dataSource.subscribeToEvents(testFilter);
      const listener = mockProvider.on.mock.calls.find(
        call => call[0] === testFilter
      )[1];

      const testLog = {
        address: '0x123',
        topics: ['0xabc'],
        data: '0x456',
        blockNumber: 100,
        transactionHash: '0xdef',
        logIndex: 0
      };
      listener(testLog);

      expect(eventHandler).toHaveBeenCalledWith({
        address: '0x123',
        topics: ['0xabc'],
        data: '0x456',
        blockNumber: 100,
        transactionHash: '0xdef',
        logIndex: 0
      });
    });
  });

  describe('contract interaction', () => {
    const testParams: ContractCallParams = {
      address: '0x123',
      abi: ['function test() view returns (uint256)'],
      method: 'test',
      params: []
    };

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should get contract state', async () => {
      const mockContract = {
        test: jest.fn().mockResolvedValue(123)
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

      const result = await dataSource.getContractState(testParams);

      expect(ethers.Contract).toHaveBeenCalledWith(
        testParams.address,
        testParams.abi,
        mockProvider
      );
      expect(result).toBe(123);
    });

    it('should handle contract call errors', async () => {
      const mockContract = {
        test: jest.fn().mockRejectedValue(new Error('Contract call failed'))
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

      await expect(dataSource.getContractState(testParams))
        .rejects
        .toThrow('Contract call failed');
    });
  });

  describe('log retrieval', () => {
    const testFilter: ContractEventFilter = {
      address: '0x123',
      topics: ['0xabc'],
      fromBlock: 100,
      toBlock: 200
    };

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should get logs', async () => {
      const mockLogs = [
        {
          address: '0x123',
          topics: ['0xabc'],
          data: '0x456',
          blockNumber: 150
        }
      ];
      mockProvider.getLogs.mockResolvedValue(mockLogs);

      const logs = await dataSource.getLogs(testFilter);

      expect(mockProvider.getLogs).toHaveBeenCalledWith(testFilter);
      expect(logs).toEqual(mockLogs);
    });

    it('should handle log retrieval errors', async () => {
      mockProvider.getLogs.mockRejectedValue(new Error('Log retrieval failed'));

      await expect(dataSource.getLogs(testFilter))
        .rejects
        .toThrow('Log retrieval failed');
    });
  });

  describe('error handling', () => {
    it('should handle provider errors', async () => {
      const errorHandler = jest.fn();
      dataSource.on('error', errorHandler);

      await dataSource.connect();
      const providerErrorHandler = mockProvider.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      const testError = new Error('Provider error');
      providerErrorHandler(testError);

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        error: testError,
        context: 'Provider error'
      }));
    });
  });

  describe('health check', () => {
    it('should report healthy when connected', async () => {
      await dataSource.connect();
      expect(await dataSource.isHealthy()).toBe(true);
    });

    it('should report unhealthy when disconnected', async () => {
      expect(await dataSource.isHealthy()).toBe(false);
    });

    it('should report unhealthy on network error', async () => {
      await dataSource.connect();
      mockProvider.getNetwork.mockRejectedValueOnce(new Error('Network error'));
      expect(await dataSource.isHealthy()).toBe(false);
    });
  });
}); 