import { jest } from '@jest/globals';
import { TokenAdapter } from '../adapters/TokenAdapter';
import { mockTokenData, mockRedisClient, mockWebSocket, cleanup, flushPromises } from './setup';

describe('TokenAdapter', () => {
  let adapter: TokenAdapter;

  beforeEach(() => {
    adapter = new TokenAdapter({
      redisClient: mockRedisClient,
      websocket: mockWebSocket
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Token Data', () => {
    const tokenAddress = '0x1234567890123456789012345678901234567890';

    it('should fetch and cache token data', async () => {
      const spy = jest.spyOn(adapter, 'fetchTokenData');
      const data = await adapter.getTokenData(tokenAddress);
      
      expect(spy).toHaveBeenCalledWith(tokenAddress);
      expect(data).toEqual(mockTokenData);
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should use cached token data when available', async () => {
      await mockRedisClient.set(`token:${tokenAddress}`, JSON.stringify(mockTokenData));
      const spy = jest.spyOn(adapter, 'fetchTokenData');
      
      const data = await adapter.getTokenData(tokenAddress);
      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual(mockTokenData);
    });

    it('should handle token data fetch errors', async () => {
      const error = new Error('API Error');
      jest.spyOn(adapter, 'fetchTokenData').mockRejectedValue(error);
      
      await expect(adapter.getTokenData(tokenAddress)).rejects.toThrow('API Error');
    });
  });

  describe('Token Balances', () => {
    const tokenAddress = '0x1234567890123456789012345678901234567890';
    const walletAddress = '0x9876543210987654321098765432109876543210';

    it('should fetch token balance', async () => {
      const balance = await adapter.getTokenBalance(tokenAddress, walletAddress);
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      expect(BigInt(balance)).toBeGreaterThanOrEqual(BigInt(0));
    });

    it('should fetch token allowance', async () => {
      const spenderAddress = '0x5555555555555555555555555555555555555555';
      const allowance = await adapter.getTokenAllowance(tokenAddress, walletAddress, spenderAddress);
      expect(allowance).toBeDefined();
      expect(typeof allowance).toBe('string');
      expect(BigInt(allowance)).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  describe('Token Analysis', () => {
    const tokenAddress = '0x1234567890123456789012345678901234567890';

    it('should analyze token distribution', async () => {
      const distribution = await adapter.analyzeTokenDistribution(tokenAddress);
      expect(distribution).toBeDefined();
      expect(distribution.topHolders).toBeDefined();
      expect(distribution.concentrationMetrics).toBeDefined();
    });

    it('should analyze token transfers', async () => {
      const transfers = await adapter.analyzeTokenTransfers(tokenAddress, '24h');
      expect(transfers).toBeDefined();
      expect(transfers.volume).toBeDefined();
      expect(transfers.uniqueAddresses).toBeDefined();
      expect(transfers.patterns).toBeDefined();
    });

    it('should detect token type', async () => {
      const tokenType = await adapter.detectTokenType(tokenAddress);
      expect(tokenType).toBeDefined();
      expect(['ERC20', 'ERC721', 'ERC1155']).toContain(tokenType);
    });
  });

  describe('Token Market Data', () => {
    const tokenAddress = '0x1234567890123456789012345678901234567890';

    it('should fetch token price', async () => {
      const price = await adapter.getTokenPrice(tokenAddress);
      expect(price).toBeDefined();
      expect(price.usd).toBeDefined();
      expect(price.eth).toBeDefined();
    });

    it('should fetch price history', async () => {
      const history = await adapter.getPriceHistory(tokenAddress, '7d');
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should analyze market metrics', async () => {
      const metrics = await adapter.analyzeMarketMetrics(tokenAddress);
      expect(metrics).toBeDefined();
      expect(metrics.marketCap).toBeDefined();
      expect(metrics.volume24h).toBeDefined();
      expect(metrics.liquidity).toBeDefined();
    });
  });

  describe('Real-time Updates', () => {
    const tokenAddress = '0x1234567890123456789012345678901234567890';

    it('should subscribe to token updates', () => {
      adapter.subscribeToTokenUpdates(tokenAddress);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', token: tokenAddress })
      );
    });

    it('should handle transfer event messages', async () => {
      const callback = jest.fn();
      adapter.onTransferEvent(callback);
      
      mockWebSocket.emit('message', JSON.stringify({
        type: 'transfer',
        token: tokenAddress,
        from: '0x123...',
        to: '0x456...',
        value: '1000'
      }));

      await flushPromises();
      expect(callback).toHaveBeenCalledWith({
        token: tokenAddress,
        from: '0x123...',
        to: '0x456...',
        value: '1000'
      });
    });
  });

  describe('Error Handling', () => {
    const tokenAddress = '0x1234567890123456789012345678901234567890';

    it('should handle invalid token addresses', async () => {
      await expect(adapter.getTokenData('invalid')).rejects.toThrow('Invalid token address');
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      jest.spyOn(adapter, 'fetchTokenData').mockRejectedValue(networkError);
      
      await expect(adapter.getTokenData(tokenAddress)).rejects.toThrow('Network error');
      expect(adapter['retryCount']).toBe(3); // Should attempt retries
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      jest.spyOn(adapter, 'fetchTokenData').mockRejectedValue(rateLimitError);
      
      await expect(adapter.getTokenData(tokenAddress)).rejects.toThrow('Rate limit exceeded');
      expect(mockRedisClient.get).toHaveBeenCalled(); // Should try to use cache
    });
  });
}); 