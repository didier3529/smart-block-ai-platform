import { BlockchainConfig, ChainCapabilities } from './types';
import { ConfigurationError } from './errors';
import { ethers } from 'ethers';

export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114
} as const;

export const CHAIN_CAPABILITIES: Record<number, ChainCapabilities> = {
  [CHAIN_IDS.ETHEREUM]: {
    hasWebSocket: true,
    supportsEIP1559: true,
    hasArchivalNodes: true,
    supportsENS: true,
    maxBlockRange: 3500
  },
  [CHAIN_IDS.POLYGON]: {
    hasWebSocket: true,
    supportsEIP1559: true,
    hasArchivalNodes: true,
    supportsENS: false,
    maxBlockRange: 3500
  },
  [CHAIN_IDS.BSC]: {
    hasWebSocket: true,
    supportsEIP1559: false,
    hasArchivalNodes: true,
    supportsENS: false,
    maxBlockRange: 5000
  },
  [CHAIN_IDS.ARBITRUM]: {
    hasWebSocket: true,
    supportsEIP1559: true,
    hasArchivalNodes: true,
    supportsENS: false,
    maxBlockRange: 10000
  },
  [CHAIN_IDS.OPTIMISM]: {
    hasWebSocket: true,
    supportsEIP1559: true,
    hasArchivalNodes: true,
    supportsENS: false,
    maxBlockRange: 10000
  },
  [CHAIN_IDS.AVALANCHE]: {
    hasWebSocket: true,
    supportsEIP1559: true,
    hasArchivalNodes: true,
    supportsENS: false,
    maxBlockRange: 2048
  }
};

export const DEFAULT_CHAINS: BlockchainConfig[] = [
  {
    chainId: CHAIN_IDS.ETHEREUM,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_ETH_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://etherscan.io'
  },
  {
    chainId: CHAIN_IDS.POLYGON,
    name: 'Polygon',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    blockExplorerUrl: 'https://polygonscan.com'
  },
  {
    chainId: CHAIN_IDS.BSC,
    name: 'BNB Smart Chain',
    rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    blockExplorerUrl: 'https://bscscan.com'
  },
  {
    chainId: CHAIN_IDS.ARBITRUM,
    name: 'Arbitrum One',
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://arbiscan.io'
  },
  {
    chainId: CHAIN_IDS.OPTIMISM,
    name: 'Optimism',
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://optimistic.etherscan.io'
  },
  {
    chainId: CHAIN_IDS.AVALANCHE,
    name: 'Avalanche C-Chain',
    rpcUrl: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    },
    blockExplorerUrl: 'https://snowtrace.io'
  }
];

export function getChainConfig(chainId: number): BlockchainConfig | undefined {
  return DEFAULT_CHAINS.find(chain => chain.chainId === chainId);
}

export function getChainCapabilities(chainId: number): ChainCapabilities | undefined {
  return CHAIN_CAPABILITIES[chainId];
}

export function validateChainConfig(config: BlockchainConfig): void {
  if (!config.chainId) {
    throw new ConfigurationError('Chain ID is required');
  }

  if (!config.rpcUrl) {
    throw new ConfigurationError('RPC URL is required');
  }

  if (!config.name) {
    throw new ConfigurationError('Chain name is required');
  }

  if (!config.nativeCurrency || !config.nativeCurrency.symbol || !config.nativeCurrency.decimals) {
    throw new ConfigurationError('Native currency configuration is invalid');
  }

  // Validate RPC URL format
  try {
    new URL(config.rpcUrl);
  } catch {
    throw new ConfigurationError('Invalid RPC URL format');
  }

  // Validate block explorer URL if provided
  if (config.blockExplorerUrl) {
    try {
      new URL(config.blockExplorerUrl);
    } catch {
      throw new ConfigurationError('Invalid block explorer URL format');
    }
  }
}

export function validateChainSupport(chainId: number, feature: keyof ChainCapabilities): boolean {
  const capabilities = getChainCapabilities(chainId);
  return capabilities ? capabilities[feature] : false;
}

export function getExplorerUrl(chainId: number, hash: string, type: 'tx' | 'address' | 'block'): string | undefined {
  const chain = getChainConfig(chainId);
  if (!chain?.blockExplorerUrl) return undefined;

  switch (type) {
    case 'tx':
      return `${chain.blockExplorerUrl}/tx/${hash}`;
    case 'address':
      return `${chain.blockExplorerUrl}/address/${hash}`;
    case 'block':
      return `${chain.blockExplorerUrl}/block/${hash}`;
  }
}

export function formatNativeCurrency(chainId: number, value: string, decimals?: number): string {
  const config = getChainConfig(chainId);
  if (!config) return value;

  const dec = decimals ?? config.nativeCurrency.decimals;
  const formatted = ethers.formatUnits(value, dec);
  return `${formatted} ${config.nativeCurrency.symbol}`;
}

export function getChainName(chainId: number): string {
  const config = getChainConfig(chainId);
  return config?.name || `Chain ${chainId}`;
}

export function isKnownChain(chainId: number): boolean {
  return DEFAULT_CHAINS.some(chain => chain.chainId === chainId);
}

export function getChainRpcUrl(chainId: number): string | undefined {
  const config = getChainConfig(chainId);
  return config?.rpcUrl;
}