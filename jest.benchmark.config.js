module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.benchmark.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/lib/blockchain/__tests__/setup.ts'],
  testTimeout: 60000, // Longer timeout for benchmarks
  verbose: true,
  // Ignore other test files
  testPathIgnorePatterns: ['.unit.test.ts$', '.integration.test.ts$'],
}; 