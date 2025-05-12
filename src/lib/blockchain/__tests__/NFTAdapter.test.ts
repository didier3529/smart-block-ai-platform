import { jest } from '@jest/globals';
import { NFTAdapter } from '../adapters/NFTAdapter';
import { mockNFTData, mockRedisClient, mockWebSocket, cleanup, flushPromises } from './setup';

describe('NFTAdapter', () => {
  let adapter: NFTAdapter;

  beforeEach(() => {
    adapter = new NFTAdapter({
      redisClient: mockRedisClient,
      websocket: mockWebSocket
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Collection Data', () => {
    it('should fetch and cache collection data', async () => {
      const spy = jest.spyOn(adapter, 'fetchCollectionData');
      const data = await adapter.getCollectionData('boredapes');
      
      expect(spy).toHaveBeenCalledWith('boredapes');
      expect(data).toEqual(mockNFTData);
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should use cached collection data when available', async () => {
      await mockRedisClient.set('nft:collection:boredapes', JSON.stringify(mockNFTData));
      const spy = jest.spyOn(adapter, 'fetchCollectionData');
      
      const data = await adapter.getCollectionData('boredapes');
      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual(mockNFTData);
    });

    it('should handle collection data fetch errors', async () => {
      const error = new Error('API Error');
      jest.spyOn(adapter, 'fetchCollectionData').mockRejectedValue(error);
      
      await expect(adapter.getCollectionData('boredapes')).rejects.toThrow('API Error');
    });
  });

  describe('NFT Metadata', () => {
    const mockTokenId = '1234';
    const mockMetadata = {
      name: 'Bored Ape #1234',
      description: 'A unique Bored Ape NFT',
      image: 'https://example.com/image.png',
      attributes: []
    };

    it('should fetch and cache NFT metadata', async () => {
      const spy = jest.spyOn(adapter, 'fetchNFTMetadata');
      await adapter.getNFTMetadata('boredapes', mockTokenId);
      
      expect(spy).toHaveBeenCalledWith('boredapes', mockTokenId);
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should use cached NFT metadata when available', async () => {
      await mockRedisClient.set(
        `nft:metadata:boredapes:${mockTokenId}`,
        JSON.stringify(mockMetadata)
      );
      const spy = jest.spyOn(adapter, 'fetchNFTMetadata');
      
      const data = await adapter.getNFTMetadata('boredapes', mockTokenId);
      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual(mockMetadata);
    });
  });

  describe('Rarity Analysis', () => {
    it('should calculate rarity scores', async () => {
      const rarity = await adapter.calculateRarityScore('boredapes', '1234');
      expect(rarity).toBeDefined();
      expect(rarity.score).toBeDefined();
      expect(rarity.rank).toBeDefined();
      expect(rarity.traits).toBeDefined();
    });

    it('should analyze trait distribution', async () => {
      const distribution = await adapter.analyzeTraitDistribution('boredapes');
      expect(distribution).toBeDefined();
      expect(Object.keys(distribution).length).toBeGreaterThan(0);
    });
  });

  describe('Market Analysis', () => {
    it('should track floor price history', async () => {
      const history = await adapter.getFloorPriceHistory('boredapes', '7d');
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should analyze sales trends', async () => {
      const trends = await adapter.analyzeSalesTrends('boredapes', '24h');
      expect(trends).toBeDefined();
      expect(trends.volume).toBeDefined();
      expect(trends.transactions).toBeDefined();
      expect(trends.averagePrice).toBeDefined();
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to collection updates', () => {
      adapter.subscribeToCollectionUpdates('boredapes');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', collection: 'boredapes' })
      );
    });

    it('should handle sale event messages', async () => {
      const callback = jest.fn();
      adapter.onSaleEvent(callback);
      
      mockWebSocket.emit('message', JSON.stringify({
        type: 'sale',
        collection: 'boredapes',
        tokenId: '1234',
        price: 100
      }));

      await flushPromises();
      expect(callback).toHaveBeenCalledWith({
        collection: 'boredapes',
        tokenId: '1234',
        price: 100
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      jest.spyOn(adapter, 'fetchCollectionData').mockRejectedValue(rateLimitError);
      
      await expect(adapter.getCollectionData('boredapes')).rejects.toThrow('Rate limit exceeded');
      expect(mockRedisClient.get).toHaveBeenCalled(); // Should try to use cache
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      jest.spyOn(adapter, 'fetchCollectionData').mockRejectedValue(networkError);
      
      await expect(adapter.getCollectionData('boredapes')).rejects.toThrow('Network error');
      expect(adapter['retryCount']).toBe(3); // Should attempt retries
    });
  });
}); 