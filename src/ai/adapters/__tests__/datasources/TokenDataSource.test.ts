import { TokenDataSource, TokenDataConfig, TokenInfo, TokenBalance, TokenDistribution } from '../../datasources/TokenDataSource';
import { ContractDataSource } from '../../datasources/ContractDataSource';
import { MarketDataSource } from '../../datasources/MarketDataSource';
import { ethers } from 'ethers';

jest.mock('../../datasources/ContractDataSource');
jest.mock('../../datasources/MarketDataSource');
jest.mock('ethers');

describe('TokenDataSource', () => {
  let dataSource: TokenDataSource;
  let mockContractDataSource: jest.Mocked<ContractDataSource>;
  let mockMarketDataSource: jest.Mocked<MarketDataSource>;
  const defaultConfig: TokenDataConfig = {
    contractDataConfig: {
      rpcUrl: 'http://test.eth',
      networkId: 1
    },
    marketDataConfig: {
      wsUrl: 'ws://test.market',
      apiUrl: 'http://test.market/api'
    }
  };

  beforeEach(() => {
    mockContractDataSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
      getContractState: jest.fn(),
      getLogs: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    } as any;

    mockMarketDataSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
      subscribeToSymbol: jest.fn(),
      unsubscribeFromSymbol: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    } as any;

    (ContractDataSource as jest.Mock).mockImplementation(() => mockContractDataSource);
    (MarketDataSource as jest.Mock).mockImplementation(() => mockMarketDataSource);
    dataSource = new TokenDataSource(defaultConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connection management', () => {
    it('should establish connections to both data sources', async () => {
      await dataSource.connect();

      expect(mockContractDataSource.connect).toHaveBeenCalled();
      expect(mockMarketDataSource.connect).toHaveBeenCalled();
      expect(dataSource.getConnectionStatus()).toBe(true);
    });

    it('should handle disconnection', async () => {
      await dataSource.connect();
      await dataSource.disconnect();

      expect(mockContractDataSource.disconnect).toHaveBeenCalled();
      expect(mockMarketDataSource.disconnect).toHaveBeenCalled();
      expect(dataSource.getConnectionStatus()).toBe(false);
    });

    it('should forward contract events', async () => {
      const eventHandler = jest.fn();
      dataSource.on('contractEvent', eventHandler);

      await dataSource.connect();
      const contractEventCallback = mockContractDataSource.on.mock.calls.find(
        call => call[0] === 'contractEvent'
      )[1];

      const testEvent = { type: 'Transfer', data: 'test' };
      contractEventCallback(testEvent);

      expect(eventHandler).toHaveBeenCalledWith(testEvent);
    });

    it('should forward market events', async () => {
      const priceHandler = jest.fn();
      dataSource.on('price', priceHandler);

      await dataSource.connect();
      const priceEventCallback = mockMarketDataSource.on.mock.calls.find(
        call => call[0] === 'price'
      )[1];

      const testPrice = { symbol: 'TEST', price: 100 };
      priceEventCallback(testPrice);

      expect(priceHandler).toHaveBeenCalledWith(testPrice);
    });
  });

  describe('token information', () => {
    const testAddress = '0x123';
    const mockTokenInfo: TokenInfo = {
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000000000000000000000'
    };

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should get token information', async () => {
      const mockContract = {
        name: jest.fn().mockResolvedValue(mockTokenInfo.name),
        symbol: jest.fn().mockResolvedValue(mockTokenInfo.symbol),
        decimals: jest.fn().mockResolvedValue(mockTokenInfo.decimals),
        totalSupply: jest.fn().mockResolvedValue(ethers.BigNumber.from(mockTokenInfo.totalSupply))
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

      const info = await dataSource.getTokenInfo(testAddress);

      expect(info).toEqual(mockTokenInfo);
    });

    it('should handle missing optional fields', async () => {
      const mockContract = {
        symbol: jest.fn().mockResolvedValue('TEST'),
        decimals: jest.fn().mockResolvedValue(18),
        totalSupply: jest.fn().mockResolvedValue(ethers.BigNumber.from('1000000000000000000000')),
        name: jest.fn().mockRejectedValue(new Error('Not implemented'))
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

      const info = await dataSource.getTokenInfo(testAddress);

      expect(info).toEqual({
        symbol: 'TEST',
        decimals: 18,
        totalSupply: '1000000000000000000000'
      });
    });
  });

  describe('token distribution', () => {
    const testAddress = '0x123';
    const mockTransferEvents = [
      {
        topics: [
          ethers.utils.id('Transfer(address,address,uint256)'),
          ethers.utils.hexZeroPad('0x1', 32),
          ethers.utils.hexZeroPad('0x2', 32)
        ],
        data: ethers.utils.hexZeroPad('0x64', 32) // 100 tokens
      }
    ];

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should get token distribution', async () => {
      mockContractDataSource.getLogs.mockResolvedValue(mockTransferEvents);
      const mockContract = {
        balanceOf: jest.fn().mockImplementation((address) => {
          return Promise.resolve(ethers.BigNumber.from(address === '0x2' ? '100' : '0'));
        }),
        totalSupply: jest.fn().mockResolvedValue(ethers.BigNumber.from('1000'))
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

      const distribution = await dataSource.getTokenDistribution(testAddress);

      expect(distribution).toEqual({
        topHolders: [{
          address: '0x0000000000000000000000000000000000000002',
          balance: '100',
          percentage: 10
        }],
        totalHolders: 1,
        circulatingSupply: '1000'
      });
    });
  });

  describe('market data', () => {
    const testAddress = '0x123';
    const testSymbol = 'TEST';

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should subscribe to market data', async () => {
      await dataSource.subscribeToMarketData(testAddress, testSymbol);

      expect(mockMarketDataSource.subscribeToSymbol).toHaveBeenCalledWith(testSymbol);
    });

    it('should unsubscribe from market data', async () => {
      await dataSource.unsubscribeFromMarketData(testAddress, testSymbol);

      expect(mockMarketDataSource.unsubscribeFromSymbol).toHaveBeenCalledWith(testSymbol);
    });
  });

  describe('health check', () => {
    it('should report healthy when both data sources are healthy', async () => {
      mockContractDataSource.isHealthy.mockResolvedValue(true);
      mockMarketDataSource.isHealthy.mockResolvedValue(true);
      expect(await dataSource.isHealthy()).toBe(true);
    });

    it('should report unhealthy when contract data source is unhealthy', async () => {
      mockContractDataSource.isHealthy.mockResolvedValue(false);
      mockMarketDataSource.isHealthy.mockResolvedValue(true);
      expect(await dataSource.isHealthy()).toBe(false);
    });

    it('should report unhealthy when market data source is unhealthy', async () => {
      mockContractDataSource.isHealthy.mockResolvedValue(true);
      mockMarketDataSource.isHealthy.mockResolvedValue(false);
      expect(await dataSource.isHealthy()).toBe(false);
    });
  });
}); 