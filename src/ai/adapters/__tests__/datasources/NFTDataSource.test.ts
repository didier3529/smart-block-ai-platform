import { NFTDataSource, NFTDataConfig, NFTMetadata, NFTSale } from '../../datasources/NFTDataSource';
import { ContractDataSource } from '../../datasources/ContractDataSource';
import { ethers } from 'ethers';

jest.mock('../../datasources/ContractDataSource');
jest.mock('ethers');

describe('NFTDataSource', () => {
  let dataSource: NFTDataSource;
  let mockContractDataSource: jest.Mocked<ContractDataSource>;
  const defaultConfig: NFTDataConfig = {
    contractDataConfig: {
      rpcUrl: 'http://test.eth',
      networkId: 1
    },
    ipfsGateway: 'https://test.ipfs/'
  };

  beforeEach(() => {
    mockContractDataSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
      getLogs: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    } as any;

    (ContractDataSource as jest.Mock).mockImplementation(() => mockContractDataSource);
    dataSource = new NFTDataSource(defaultConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connection management', () => {
    it('should establish connection through contract data source', async () => {
      await dataSource.connect();

      expect(mockContractDataSource.connect).toHaveBeenCalled();
      expect(dataSource.getConnectionStatus()).toBe(true);
    });

    it('should handle disconnection', async () => {
      await dataSource.connect();
      await dataSource.disconnect();

      expect(mockContractDataSource.disconnect).toHaveBeenCalled();
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
  });

  describe('token metadata', () => {
    const testAddress = '0x123';
    const testTokenId = '1';
    const mockUri = 'ipfs://test/1';
    const mockMetadata: NFTMetadata = {
      name: 'Test NFT',
      description: 'Test Description',
      image: 'ipfs://test/image/1',
      attributes: [
        { trait_type: 'test', value: 'value' }
      ]
    };

    beforeEach(async () => {
      await dataSource.connect();
      global.fetch = jest.fn();
    });

    afterEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it('should fetch and validate token metadata', async () => {
      const mockContract = {
        tokenURI: jest.fn().mockResolvedValue(mockUri)
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      });

      const metadata = await dataSource.getTokenMetadata(testAddress, testTokenId);

      expect(ethers.Contract).toHaveBeenCalledWith(
        testAddress,
        ['function tokenURI(uint256) view returns (string)'],
        mockContractDataSource['provider']
      );
      expect(global.fetch).toHaveBeenCalledWith(
        `${defaultConfig.ipfsGateway}test/1`
      );
      expect(metadata).toEqual(mockMetadata);
    });

    it('should handle invalid metadata', async () => {
      const mockContract = {
        tokenURI: jest.fn().mockResolvedValue(mockUri)
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: 'Test' }) // Missing required fields
      });

      await expect(dataSource.getTokenMetadata(testAddress, testTokenId))
        .rejects
        .toThrow('Invalid metadata');
    });
  });

  describe('collection stats', () => {
    const testAddress = '0x123';
    const mockTransferEvents = [
      {
        topics: [
          ethers.utils.id('Transfer(address,address,uint256)'),
          ethers.utils.hexZeroPad('0x1', 32),
          ethers.utils.hexZeroPad('0x2', 32)
        ],
        transactionHash: '0xabc'
      }
    ];

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should get collection statistics', async () => {
      const mockContract = {
        totalSupply: jest.fn().mockResolvedValue(ethers.BigNumber.from(100))
      };
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
      mockContractDataSource.getLogs.mockResolvedValue(mockTransferEvents);

      const stats = await dataSource.getCollectionStats(testAddress);

      expect(stats).toEqual({
        totalSupply: 100,
        holders: 1,
        volumeTraded: 0,
        floorPrice: undefined
      });
    });
  });

  describe('sales tracking', () => {
    const testAddress = '0x123';
    const mockTransferEvent = {
      topics: [
        ethers.utils.id('Transfer(address,address,uint256)'),
        ethers.utils.hexZeroPad('0x1', 32),
        ethers.utils.hexZeroPad('0x2', 32),
        ethers.utils.hexZeroPad('0x3', 32)
      ],
      transactionHash: '0xabc'
    };

    beforeEach(async () => {
      await dataSource.connect();
    });

    it('should track NFT sales', async () => {
      mockContractDataSource.getLogs.mockResolvedValue([mockTransferEvent]);
      const mockTx = {
        value: ethers.BigNumber.from('1000000000000000000'),
        to: '0xmarket',
        wait: jest.fn().mockResolvedValue({ timestamp: 1234567890 })
      };
      mockContractDataSource['provider'].getTransaction.mockResolvedValue(mockTx);

      const sales = await dataSource.getSales(testAddress);

      expect(sales).toEqual([{
        tokenId: '3',
        price: 1,
        seller: '0x0000000000000000000000000000000000000001',
        buyer: '0x0000000000000000000000000000000000000002',
        timestamp: 1234567890,
        marketplace: '0xmarket'
      }]);
    });
  });

  describe('health check', () => {
    it('should report healthy when contract data source is healthy', async () => {
      mockContractDataSource.isHealthy.mockResolvedValue(true);
      expect(await dataSource.isHealthy()).toBe(true);
    });

    it('should report unhealthy when contract data source is unhealthy', async () => {
      mockContractDataSource.isHealthy.mockResolvedValue(false);
      expect(await dataSource.isHealthy()).toBe(false);
    });
  });
}); 