module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/lib/blockchain/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  // Ignore unit test files
  testPathIgnorePatterns: ['.unit.test.ts$'],
}; 