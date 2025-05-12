// Add custom matchers
expect.extend({
  toBeValidAgentResponse(received) {
    const pass = received &&
      typeof received === 'object' &&
      'status' in received &&
      'data' in received;

    return {
      pass,
      message: () =>
        pass
          ? 'Expected response not to be a valid agent response'
          : 'Expected response to be a valid agent response with status and data properties',
    };
  },
});

// Global test configuration
beforeAll(() => {
  // Ensure we're in test environment
  expect(process.env.NODE_ENV).toBe('test');
  
  // Verify required environment variables
  const requiredEnvVars = [
    'AI_MODEL',
    'MAX_TOKENS',
    'TEMPERATURE'
  ];
  
  requiredEnvVars.forEach(envVar => {
    expect(process.env[envVar]).toBeDefined();
  });
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 