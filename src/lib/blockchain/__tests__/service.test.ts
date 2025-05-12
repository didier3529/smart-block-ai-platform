import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EthereumBlockchainService } from '../service';
import { BlockchainServiceConfig, TransactionData, BlockData } from '../types';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers');

describe('EthereumBlockchainService', () => {
  let service: EthereumBlockchainService;
  let mockProvider: jest.Mocked<ethers.JsonRpcProvider>;
  
  const testConfig: BlockchainServiceConfig = {
    chains: [
      {
        chainId: 1,
        name: 'Test Chain',
        rpcUrl: 'http://localhost:8545',
        nativeCurrency: {
          name: 'Test',
          symbol: 'TEST',
          decimals: 18
        }
      }
    ],
    cache: {
      maxAge: 5000,
      maxSize: 100
    },
    wsReconnectInterval: 1000,
    maxRetries: 3
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(1) }),
      getBlockNumber: jest.fn().mockResolvedValue(12345),
      getTransaction: jest.fn(),
      getTransactionReceipt: jest.fn(),
      getBlock: jest.fn(),
      getBalance: jest.fn(),
    } as unknown as jest.Mocked<ethers.JsonRpcProvider>;

    (ethers.JsonRpcProvider as jest.Mock).mockImplementation(() => mockProvider);

    service = new EthereumBlockchainService(testConfig);
  });

  describe('initialize', () => {
    it('should initialize providers for all configured chains', async () => {
      await service.initialize();
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('http://localhost:8545');
    });
  });

  describe('connect', () => {
    it('should connect to a chain successfully', async () => {
      await service.initialize();
      const result = await service.connect(1);
      expect(result).toBe(true);
      expect(mockProvider.getNetwork).toHaveBeenCalled();
    });

    it('should handle chain ID mismatch', async () => {
      mockProvider.getNetwork.mockResolvedValueOnce({ chainId: BigInt(2) });
      await service.initialize();
      const result = await service.connect(1);
      expect(result).toBe(false);
    });
  });

  describe('getTransaction', () => {
    const mockTx = {
      hash: '0x123',
      from: '0x456',
      to: '0x789',
      value: BigInt(1000),
      blockNumber: 100,
      data: '0x',
      gasPrice: BigInt(2000000000)
    };

    const mockReceipt = {
      status: 1,
      gasUsed: BigInt(21000)
    };

    const mockBlock = {
      timestamp: 1234567890
    };

    beforeEach(async () => {
      mockProvider.getTransaction.mockResolvedValue(mockTx as any);
      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt as any);
      mockProvider.getBlock.mockResolvedValue(mockBlock as any);
      await service.initialize();
      await service.connect(1);
    });

    it('should fetch and format transaction data', async () => {
      const result = await service.getTransaction(1, '0x123');
      
      expect(result).toEqual({
        hash: '0x123',
        from: '0x456',
        to: '0x789',
        value: '1000',
        blockNumber: 100,
        timestamp: 1234567890,
        gasUsed: '21000',
        gasPrice: '2000000000',
        status: true,
        input: '0x'
      });
    });

    it('should use cached transaction data when available', async () => {
      await service.getTransaction(1, '0x123');
      await service.getTransaction(1, '0x123');
      
      expect(mockProvider.getTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBlock', () => {
    const mockBlock = {
      number: 100,
      hash: '0xabc',
      timestamp: 1234567890,
      transactions: ['0x123', '0x456'],
      gasUsed: BigInt(100000),
      gasLimit: BigInt(2000000)
    };

    beforeEach(async () => {
      mockProvider.getBlock.mockResolvedValue(mockBlock as any);
      await service.initialize();
      await service.connect(1);
    });

    it('should fetch and format block data', async () => {
      const result = await service.getBlock(1, 100);
      
      expect(result).toEqual({
        number: 100,
        hash: '0xabc',
        timestamp: 1234567890,
        transactions: ['0x123', '0x456'],
        gasUsed: '100000',
        gasLimit: '2000000'
      });
    });

    it('should use cached block data when available', async () => {
      await service.getBlock(1, 100);
      await service.getBlock(1, 100);
      
      expect(mockProvider.getBlock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBalance', () => {
    beforeEach(async () => {
      mockProvider.getBalance.mockResolvedValue(BigInt(1000000000000000000));
      await service.initialize();
      await service.connect(1);
    });

    it('should fetch balance correctly', async () => {
      const result = await service.getBalance(1, '0x123');
      expect(result).toBe('1000000000000000000');
      expect(mockProvider.getBalance).toHaveBeenCalledWith('0x123');
    });
  });
}); 