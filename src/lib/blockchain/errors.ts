export class BlockchainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockchainError';
  }
}

export class ConnectionError extends BlockchainError {
  constructor(chainId: number, message: string) {
    super(`Chain ${chainId}: ${message}`);
    this.name = 'ConnectionError';
  }
}

export class TransactionError extends BlockchainError {
  constructor(txHash: string, message: string) {
    super(`Transaction ${txHash}: ${message}`);
    this.name = 'TransactionError';
  }
}

export class BlockError extends BlockchainError {
  constructor(blockNumber: number, message: string) {
    super(`Block ${blockNumber}: ${message}`);
    this.name = 'BlockError';
  }
}

export class ConfigurationError extends BlockchainError {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigurationError';
  }
} 