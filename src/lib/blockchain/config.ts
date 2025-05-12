import { BlockchainServiceConfig } from './types';

const METAMASK_API_KEY = '3c502f6030be41ba86bb45e6d0c08788';

export const defaultConfig: BlockchainServiceConfig = {
  chains: [
    {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: process.env.NEXT_PUBLIC_ETH_MAINNET_RPC_URL || `https://mainnet.infura.io/v3/${METAMASK_API_KEY}`,
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      blockExplorerUrl: 'https://etherscan.io'
    },
    {
      chainId: 137,
      name: 'Polygon',
      rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || `https://polygon-mainnet.infura.io/v3/${METAMASK_API_KEY}`,
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      blockExplorerUrl: 'https://polygonscan.com'
    },
    {
      chainId: 56,
      name: 'BNB Smart Chain',
      rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
      },
      blockExplorerUrl: 'https://bscscan.com'
    }
  ],
  cache: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000 // Maximum number of entries
  },
  wsReconnectInterval: 5000, // 5 seconds
  maxRetries: 3
};

// Helper function to create a config with custom settings
export function createConfig(
  customConfig: Partial<BlockchainServiceConfig>
): BlockchainServiceConfig {
  return {
    ...defaultConfig,
    ...customConfig,
    chains: [...(customConfig.chains || defaultConfig.chains)],
    cache: {
      ...defaultConfig.cache,
      ...(customConfig.cache || {})
    }
  };
} 