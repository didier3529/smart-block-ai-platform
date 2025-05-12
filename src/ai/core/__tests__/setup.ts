import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test if it exists, otherwise from .env
dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

// Set default environment variables for testing
process.env.NODE_ENV = 'test';
process.env.AI_MODEL = process.env.AI_MODEL || 'claude-3-opus-20240229';
process.env.MAX_TOKENS = process.env.MAX_TOKENS || '8192';
process.env.TEMPERATURE = process.env.TEMPERATURE || '0.7';

// Increase timeout for AI operations
jest.setTimeout(30000);

// Mock console.error to keep test output clean
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.('ExperimentalWarning') ||
    args[0]?.includes?.('Warning: Invalid aria-describedby')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
}; 