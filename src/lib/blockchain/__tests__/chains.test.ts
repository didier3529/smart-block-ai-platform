import { describe, it, expect } from '@jest/globals';
import { CHAIN_IDS, getChainConfig, getExplorerUrl, formatNativeCurrency } from '../chains';

describe('Chain Utilities', () => {
  describe('getChainConfig', () => {
    it('should return correct chain configuration for Ethereum', () => {
      const config = getChainConfig(CHAIN_IDS.ETHEREUM);
      expect(config).toBeDefined();
      expect(config?.chainId).toBe(CHAIN_IDS.ETHEREUM);
      expect(config?.name).toBe('Ethereum Mainnet');
      expect(config?.nativeCurrency.symbol).toBe('ETH');
    });

    it('should return correct chain configuration for Polygon', () => {
      const config = getChainConfig(CHAIN_IDS.POLYGON);
      expect(config).toBeDefined();
      expect(config?.chainId).toBe(CHAIN_IDS.POLYGON);
      expect(config?.name).toBe('Polygon');
      expect(config?.nativeCurrency.symbol).toBe('MATIC');
    });

    it('should return undefined for unknown chain ID', () => {
      const config = getChainConfig(999999);
      expect(config).toBeUndefined();
    });
  });

  describe('getExplorerUrl', () => {
    it('should return correct transaction URL for Ethereum', () => {
      const url = getExplorerUrl(CHAIN_IDS.ETHEREUM, '0x123', 'tx');
      expect(url).toBe('https://etherscan.io/tx/0x123');
    });

    it('should return correct address URL for Polygon', () => {
      const url = getExplorerUrl(CHAIN_IDS.POLYGON, '0x456', 'address');
      expect(url).toBe('https://polygonscan.com/address/0x456');
    });

    it('should return correct block URL for BSC', () => {
      const url = getExplorerUrl(CHAIN_IDS.BSC, '12345', 'block');
      expect(url).toBe('https://bscscan.com/block/12345');
    });

    it('should return undefined for unknown chain ID', () => {
      const url = getExplorerUrl(999999, '0x123', 'tx');
      expect(url).toBeUndefined();
    });
  });

  describe('formatNativeCurrency', () => {
    it('should format Ethereum value correctly', () => {
      const formatted = formatNativeCurrency(CHAIN_IDS.ETHEREUM, '1000000000000000000');
      expect(formatted).toBe('1000000000000000000 ETH');
    });

    it('should format Polygon value correctly', () => {
      const formatted = formatNativeCurrency(CHAIN_IDS.POLYGON, '1000000000000000000');
      expect(formatted).toBe('1000000000000000000 MATIC');
    });

    it('should return original value for unknown chain ID', () => {
      const value = '1000000000000000000';
      const formatted = formatNativeCurrency(999999, value);
      expect(formatted).toBe(value);
    });
  });
}); 