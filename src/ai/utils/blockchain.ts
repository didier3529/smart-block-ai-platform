import { ethers } from 'ethers';
import { TokenHolding } from '../types';

const PRICE_API_ENDPOINT = 'https://api.coingecko.com/api/v3';

// Use deterministic values for server-side rendering
const getTokenPrice = (address: string) => {
  // Use hash of address to generate deterministic price
  const hash = ethers.id(address);
  const numericHash = parseInt(hash.slice(2, 10), 16);
  return (numericHash % 1000) + 1; // Price between 1-1000
};

export async function fetchTokenPrices(tokenAddresses: string[]): Promise<Record<string, number>> {
  try {
    // In a real implementation, we would:
    // 1. Call CoinGecko or similar API to get token prices
    // 2. Handle rate limiting and caching
    // 3. Implement fallback price sources
    
    // Use deterministic values for SSR
    return tokenAddresses.reduce((acc, address) => {
      acc[address] = getTokenPrice(address);
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
}

export async function getWalletHoldings(walletAddress: string): Promise<TokenHolding[]> {
  try {
    // In a real implementation, we would:
    // 1. Connect to blockchain node
    // 2. Query ERC20 token balances
    // 3. Handle pagination and rate limiting
    // 4. Cache results appropriately

    // Placeholder implementation
    return [
      {
        token: 'ETH',
        amount: '1.5',
        symbol: 'ETH',
        decimals: 18
      },
      {
        token: 'BTC',
        amount: '0.1',
        symbol: 'BTC',
        decimals: 8
      }
    ];
  } catch (error) {
    console.error('Error fetching wallet holdings:', error);
    throw error;
  }
}

export async function getTokenMetadata(tokenAddress: string) {
  try {
    // In a real implementation, we would:
    // 1. Load ERC20 contract
    // 2. Fetch name, symbol, decimals
    // 3. Cache results

    // Placeholder implementation
    return {
      name: 'Mock Token',
      symbol: 'TOKEN',
      decimals: 18
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw error;
  }
}

export async function getHistoricalPrices(tokenAddress: string, days: number) {
  try {
    // In a real implementation, we would:
    // 1. Call price API for historical data
    // 2. Handle rate limiting
    // 3. Cache results
    
    // Use deterministic values for SSR
    const basePrice = getTokenPrice(tokenAddress);
    return Array(days).fill(0).map((_, i) => {
      // Generate deterministic daily price variations
      const dayHash = ethers.id(`${tokenAddress}-${i}`);
      const variation = (parseInt(dayHash.slice(2, 6), 16) % 200 - 100) / 100; // ±100%
      return {
        timestamp: Date.now() - (i * 86400000),
        price: basePrice * (1 + variation)
      };
    });
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
}

export async function getGasPrice() {
  try {
    // In a real implementation, we would:
    // 1. Connect to blockchain node
    // 2. Get current gas prices
    // 3. Calculate estimates for different speeds
    
    // Placeholder implementation
    return {
      slow: '50',
      medium: '70',
      fast: '90'
    };
  } catch (error) {
    console.error('Error fetching gas price:', error);
    throw error;
  }
}

export async function getMarketConditions() {
  // Placeholder implementation
  // TODO: Integrate with actual market data APIs
  return {
    'Market Trend': 'Bullish',
    'BTC Dominance': '45%',
    'Total Market Cap': '$1.5T',
    'Fear & Greed Index': '65 (Greed)',
    'Recent Trends': [
      'DeFi tokens showing strong momentum',
      'Layer 2 solutions gaining adoption',
      'Increased institutional interest'
    ].join('\n'),
    'Key Metrics': {
      '24h Volume': '$85B',
      'BTC Price Change (24h)': '+2.5%',
      'ETH Price Change (24h)': '+3.2%'
    }
  };
} 