import { jest } from '@jest/globals';
import { SmartContractAdapter } from '../adapters/SmartContractAdapter';
import { mockContractData, mockRedisClient, cleanup, flushPromises } from './setup';

describe('SmartContractAdapter', () => {
  let adapter: SmartContractAdapter;

  beforeEach(() => {
    adapter = new SmartContractAdapter({
      redisClient: mockRedisClient
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Contract Data', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';

    it('should fetch and cache contract data', async () => {
      const spy = jest.spyOn(adapter, 'fetchContractData');
      const data = await adapter.getContractData(contractAddress);
      
      expect(spy).toHaveBeenCalledWith(contractAddress);
      expect(data).toEqual(mockContractData);
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should use cached contract data when available', async () => {
      await mockRedisClient.set(`contract:${contractAddress}`, JSON.stringify(mockContractData));
      const spy = jest.spyOn(adapter, 'fetchContractData');
      
      const data = await adapter.getContractData(contractAddress);
      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual(mockContractData);
    });

    it('should handle contract data fetch errors', async () => {
      const error = new Error('API Error');
      jest.spyOn(adapter, 'fetchContractData').mockRejectedValue(error);
      
      await expect(adapter.getContractData(contractAddress)).rejects.toThrow('API Error');
    });
  });

  describe('Contract Analysis', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';

    it('should analyze contract security', async () => {
      const analysis = await adapter.analyzeContractSecurity(contractAddress);
      expect(analysis).toBeDefined();
      expect(analysis.vulnerabilities).toBeDefined();
      expect(analysis.score).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should analyze gas usage', async () => {
      const gasAnalysis = await adapter.analyzeGasUsage(contractAddress);
      expect(gasAnalysis).toBeDefined();
      expect(gasAnalysis.averageGas).toBeDefined();
      expect(gasAnalysis.maxGas).toBeDefined();
      expect(gasAnalysis.optimizationTips).toBeDefined();
    });

    it('should detect contract patterns', async () => {
      const patterns = await adapter.detectContractPatterns(contractAddress);
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Contract Interaction', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';
    const mockTx = {
      hash: '0x123...',
      from: '0x456...',
      to: contractAddress,
      value: '0',
      data: '0x...'
    };

    it('should estimate transaction gas', async () => {
      const estimate = await adapter.estimateGas(contractAddress, 'transfer', ['0x789...', '1000']);
      expect(estimate).toBeDefined();
      expect(typeof estimate).toBe('number');
      expect(estimate).toBeGreaterThan(0);
    });

    it('should decode transaction input data', async () => {
      const decoded = await adapter.decodeTransactionInput(contractAddress, mockTx.data);
      expect(decoded).toBeDefined();
      expect(decoded.method).toBeDefined();
      expect(decoded.params).toBeDefined();
    });

    it('should simulate transaction execution', async () => {
      const result = await adapter.simulateTransaction(contractAddress, mockTx);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.gasUsed).toBeDefined();
    });
  });

  describe('Contract Events', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';
    const mockEvent = {
      event: 'Transfer',
      args: {
        from: '0x123...',
        to: '0x456...',
        value: '1000'
      }
    };

    it('should parse event logs', async () => {
      const parsed = await adapter.parseEventLogs(contractAddress, [mockEvent]);
      expect(parsed).toBeDefined();
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].name).toBe('Transfer');
      expect(parsed[0].params).toBeDefined();
    });

    it('should filter events by type', async () => {
      const filtered = await adapter.filterEvents(contractAddress, 'Transfer', { fromBlock: 0 });
      expect(filtered).toBeDefined();
      expect(Array.isArray(filtered)).toBe(true);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';

    it('should handle invalid contract addresses', async () => {
      await expect(adapter.getContractData('invalid')).rejects.toThrow('Invalid contract address');
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      jest.spyOn(adapter, 'fetchContractData').mockRejectedValue(networkError);
      
      await expect(adapter.getContractData(contractAddress)).rejects.toThrow('Network error');
      expect(adapter['retryCount']).toBe(3); // Should attempt retries
    });

    it('should handle contract verification errors', async () => {
      const verificationError = new Error('Contract not verified');
      jest.spyOn(adapter, 'verifyContract').mockRejectedValue(verificationError);
      
      await expect(adapter.verifyContract(contractAddress)).rejects.toThrow('Contract not verified');
    });
  });
}); 