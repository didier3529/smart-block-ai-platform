import { NFTAdapter } from '../../NFTAdapter';
import { NFTDataSource } from '../../datasources/NFTDataSource';
import { NFTCache } from '../../cache/NFTCache';
import { CacheFactory } from '../../cache/CacheFactory';
import { DataSourceFactory } from '../../datasources/DataSourceFactory';
import { ethers } from 'ethers';

jest.mock('../../cache/CacheFactory');
jest.mock('../../datasources/DataSourceFactory');
jest.mock('ethers');

describe('NFTAdapter Integration', () => {
  let adapter: NFTAdapter;
  let mockNFTDataSource: jest.Mocked<NFTDataSource>;
  let mockCache: jest.Mocked<NFTCache>;

  const testCollectionAddress = '0x123';
  const testTokenId = '1';
  const mockMetadata = {
    name: 'Test NFT',
    description: 'Test Description',
    image: 'ipfs://test/image/1',
    attributes: [
      { trait_type: 'test', value: 'value' }
    ]
  };

  beforeEach(() => {
    mockNFTDataSource = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
      getTokenMetadata: jest.fn(),
      getCollectionStats: jest.fn(),
      getSales: jest.fn(),
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
      getNFTDataSource: jest.fn().mockReturnValue(mockNFTDataSource)
    });

    (CacheFactory.getInstance as jest.Mock).mockReturnValue({
      getNFTCache: jest.fn().mockReturnValue(mockCache)
    });

    adapter = new NFTAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('collection analysis', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should analyze collection with caching', async () => {
      // Set up cache miss for collection stats
      mockCache.get.mockResolvedValueOnce(undefined);

      // Set up collection stats response
      const mockStats = {
        totalSupply: 10000,
        holders: 5000,
        floorPrice: ethers.utils.parseEther('0.1'),
        volumeTraded: ethers.utils.parseEther('1000')
      };
      mockNFTDataSource.getCollectionStats.mockResolvedValueOnce(mockStats);

      // Request collection analysis
      const analysis = await adapter.analyzeCollection(testCollectionAddress);

      // Verify data source interaction
      expect(mockNFTDataSource.getCollectionStats).toHaveBeenCalledWith(testCollectionAddress);

      // Verify caching behavior
      expect(mockCache.get).toHaveBeenCalledWith(`stats:${testCollectionAddress}`);
      expect(mockCache.set).toHaveBeenCalledWith(
        `stats:${testCollectionAddress}`,
        expect.objectContaining({
          totalSupply: mockStats.totalSupply,
          holders: mockStats.holders
        })
      );

      // Verify analysis result
      expect(analysis).toEqual(expect.objectContaining({
        totalSupply: mockStats.totalSupply,
        holders: mockStats.holders,
        metrics: expect.any(Object),
        timestamp: expect.any(Number)
      }));
    });

    it('should use cached collection stats when available', async () => {
      const cachedStats = {
        totalSupply: 10000,
        holders: 5000,
        floorPrice: '0.1',
        volumeTraded: '1000',
        timestamp: Date.now() - 1000
      };

      mockCache.get.mockResolvedValueOnce(cachedStats);

      const stats = await adapter.getCollectionStats(testCollectionAddress);

      expect(mockNFTDataSource.getCollectionStats).not.toHaveBeenCalled();
      expect(stats).toEqual(cachedStats);
    });
  });

  describe('token metadata', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should fetch and analyze token metadata with caching', async () => {
      // Set up cache miss for metadata
      mockCache.get.mockResolvedValueOnce(undefined);

      // Set up metadata response
      mockNFTDataSource.getTokenMetadata.mockResolvedValueOnce(mockMetadata);

      // Request metadata analysis
      const analysis = await adapter.analyzeTokenMetadata(testCollectionAddress, testTokenId);

      // Verify data source interaction
      expect(mockNFTDataSource.getTokenMetadata).toHaveBeenCalledWith(
        testCollectionAddress,
        testTokenId
      );

      // Verify caching behavior
      expect(mockCache.get).toHaveBeenCalledWith(
        `metadata:${testCollectionAddress}:${testTokenId}`
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        `metadata:${testCollectionAddress}:${testTokenId}`,
        expect.objectContaining(mockMetadata)
      );

      // Verify analysis result
      expect(analysis).toEqual(expect.objectContaining({
        metadata: mockMetadata,
        rarity: expect.any(Object),
        timestamp: expect.any(Number)
      }));
    });

    it('should calculate rarity scores', async () => {
      mockCache.get.mockResolvedValueOnce(undefined);
      mockNFTDataSource.getTokenMetadata.mockResolvedValueOnce(mockMetadata);

      const analysis = await adapter.analyzeTokenMetadata(testCollectionAddress, testTokenId);

      expect(analysis.rarity).toEqual(expect.objectContaining({
        score: expect.any(Number),
        rank: expect.any(Number),
        traits: expect.any(Array)
      }));
    });
  });

  describe('market analysis', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should analyze market activity', async () => {
      const mockSales = [
        {
          tokenId: testTokenId,
          price: ethers.utils.parseEther('0.1'),
          seller: '0x1',
          buyer: '0x2',
          timestamp: Date.now() - 3600000,
          marketplace: 'OpenSea'
        },
        {
          tokenId: testTokenId,
          price: ethers.utils.parseEther('0.15'),
          seller: '0x2',
          buyer: '0x3',
          timestamp: Date.now() - 1800000,
          marketplace: 'OpenSea'
        }
      ];

      mockNFTDataSource.getSales.mockResolvedValueOnce(mockSales);

      const analysis = await adapter.analyzeMarketActivity(testCollectionAddress);

      expect(analysis).toEqual(expect.objectContaining({
        volume24h: expect.any(String),
        transactions24h: expect.any(Number),
        averagePrice: expect.any(String),
        priceChange24h: expect.any(Number)
      }));
    });
  });

  describe('transfer tracking', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should track token transfers', async () => {
      const transferHandler = jest.fn();
      adapter.on('transfer', transferHandler);

      // Simulate transfer event
      const eventHandler = mockNFTDataSource.on.mock.calls.find(
        call => call[0] === 'contractEvent'
      )[1];

      const transferEvent = {
        address: testCollectionAddress,
        topics: [
          ethers.utils.id('Transfer(address,address,uint256)'),
          ethers.utils.hexZeroPad('0x1', 32),
          ethers.utils.hexZeroPad('0x2', 32),
          ethers.utils.hexZeroPad(testTokenId, 32)
        ],
        data: '0x',
        blockNumber: 1000
      };

      eventHandler(transferEvent);

      expect(transferHandler).toHaveBeenCalledWith(expect.objectContaining({
        tokenId: testTokenId,
        from: '0x0000000000000000000000000000000000000001',
        to: '0x0000000000000000000000000000000000000002',
        collection: testCollectionAddress
      }));
    });
  });

  describe('cleanup', () => {
    it('should properly clean up resources on shutdown', async () => {
      await adapter.initialize();
      await adapter.analyzeCollection(testCollectionAddress);

      await adapter.shutdown();

      expect(mockNFTDataSource.disconnect).toHaveBeenCalled();
      expect(mockCache.dispose).toHaveBeenCalled();
    });
  });
}); 