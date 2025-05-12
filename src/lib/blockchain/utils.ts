import { BlockchainError } from './errors';

interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffFactor: number;
  shouldRetry?: (error: Error) => boolean;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  delayMs: 1000,
  backoffFactor: 2,
  shouldRetry: (error: Error) => error instanceof BlockchainError
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryOptions = { ...defaultRetryOptions, ...options };
  let lastError: Error;
  let delay = retryOptions.delayMs;

  for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (!retryOptions.shouldRetry?.(lastError) || attempt === retryOptions.maxRetries) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= retryOptions.backoffFactor;
    }
  }

  throw lastError!;
}

export function formatWeiToEther(wei: string): string {
  const ether = Number(wei) / 1e18;
  return ether.toFixed(6);
}

export function formatGasPrice(gasPrice: string): string {
  const gwei = Number(gasPrice) / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
} 