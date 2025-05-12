import { config } from 'dotenv';
import { jest } from '@jest/globals';
import { Redis } from 'ioredis';
import { WebSocket } from 'ws';

// Load test environment variables
config({ path: '.env.test' });

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Mock console.warn for cleaner test output
global.console.warn = jest.fn();

// Mock Redis
jest.mock('ioredis');

// Mock WebSocket
jest.mock('ws');

// Mock external API clients
jest.mock('@coingecko/client');
jest.mock('@defillama/sdk');
jest.mock('@opensea/sdk');
jest.mock('@nftport/sdk');
jest.mock('@alch/alchemy-sdk');

// Setup test environment
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.COINGECKO_API_KEY = 'test-key';
process.env.DEFILLAMA_API_KEY = 'test-key';
process.env.OPENSEA_API_KEY = 'test-key';
process.env.NFTPORT_API_KEY = 'test-key';
process.env.ALCHEMY_API_KEY = 'test-key';

// Common test utilities
export const mockRedisClient = new Redis() as jest.Mocked<Redis>;
export const mockWebSocket = new WebSocket('ws://localhost:8080') as jest.Mocked<WebSocket>;

export const mockMarketData = {
  price: 1000,
  volume: 1000000,
  marketCap: 10000000000,
  change24h: 5.5
};

export const mockNFTData = {
  floorPrice: 1.5,
  totalVolume: 1000,
  holders: 1000,
  items: 10000
};

export const mockContractData = {
  address: '0x1234567890123456789012345678901234567890',
  abi: [],
  bytecode: '0x',
  deployedBytecode: '0x'
};

export const mockTokenData = {
  symbol: 'TEST',
  decimals: 18,
  totalSupply: '1000000000000000000000000',
  holders: 1000
};

// Helper function to create mock responses
export const createMockResponse = <T>(data: T) => ({
  data,
  status: 200,
  ok: true,
  headers: new Headers()
});

// Helper function to wait for promises
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Clean up function
export const cleanup = async () => {
  jest.clearAllMocks();
  await mockRedisClient.flushall();
};

// Helper to check if we can run integration tests
export const canRunIntegrationTests = () => {
  return process.env.ETH_MAINNET_RPC && process.env.POLYGON_MAINNET_RPC;
}; 