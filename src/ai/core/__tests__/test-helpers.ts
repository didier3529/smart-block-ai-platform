import { AgentConfig, AgentMessage, AgentResponse } from '../../types';
import { PortfolioAnalystConfig } from '../../types/agents';

/**
 * Helper function to create a test agent configuration
 */
export function createTestAgentConfig(
  type: string,
  id: string,
  overrides: Partial<AgentConfig> = {}
): AgentConfig {
  return {
    id,
    name: `Test ${type} Agent`,
    capabilities: ['test'],
    modelConfig: {
      provider: 'test',
      model: 'test-model'
    },
    modelName: 'test-model',
    maxRetries: 3,
    timeoutMs: 5000,
    ...overrides
  };
}

/**
 * Helper function to create a test portfolio analyst configuration
 */
export function createTestPortfolioAnalystConfig(
  id: string,
  overrides: Partial<PortfolioAnalystConfig> = {}
): PortfolioAnalystConfig {
  return {
    ...createTestAgentConfig('Portfolio Analyst', id),
    capabilities: ['portfolio analysis', 'risk assessment', 'investment recommendations'],
    analysisThresholds: {
      riskTolerance: 0.5,
      minimumHoldingValue: '100'
    },
    ...overrides
  };
}

/**
 * Helper function to create a test message
 */
export function createTestMessage(
  targetAgent: string,
  type: string = 'test',
  data: any = {}
): AgentMessage {
  return {
    type,
    targetAgent,
    data
  };
}

/**
 * Helper function to create test portfolio holdings data
 */
export function createTestHoldings(count: number = 2) {
  const symbols = ['ETH', 'BTC', 'USDT', 'BNB', 'SOL'];
  return Array(count).fill(null).map((_, i) => ({
    symbol: symbols[i % symbols.length],
    value: ((i + 1) * 1000).toString()
  }));
}

/**
 * Helper function to wait for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to check if we can run integration tests
 */
export function canRunIntegrationTests(): boolean {
  return process.env.NODE_ENV === 'test' && process.env.SKIP_INTEGRATION !== 'true';
}

/**
 * Helper function to create a mock agent response
 */
export function createMockAgentResponse(data: any = {}): AgentResponse {
  return {
    type: 'test',
    data,
    metadata: {
      timestamp: Date.now(),
      processingTime: 100
    }
  };
}

/**
 * Helper function to simulate an error condition
 */
export function simulateError(probability: number = 0.2): boolean {
  return Math.random() < probability;
}

/**
 * Helper function to create test task data
 */
export function createTestTask(
  agentId: string,
  taskId: string,
  dependencies: string[] = []
) {
  return {
    agentId,
    taskId,
    priority: 1,
    dependencies
  };
}

/**
 * Helper function to create a batch of test tasks
 */
export function createTestTasks(
  agentId: string,
  count: number,
  withDependencies: boolean = false
) {
  return Array(count).fill(null).map((_, i) => {
    const taskId = `test-task-${i}`;
    const dependencies = withDependencies && i > 0 ? [`test-task-${i - 1}`] : [];
    return createTestTask(agentId, taskId, dependencies);
  });
}

/**
 * Helper function to validate agent response structure
 */
export function validateAgentResponse(response: AgentResponse) {
  expect(response).toBeDefined();
  expect(response.type).toBeDefined();
  expect(response.data).toBeDefined();
  expect(response.metadata).toBeDefined();
  expect(response.metadata.timestamp).toBeDefined();
  expect(response.metadata.processingTime).toBeGreaterThan(0);
}

/**
 * Helper function to validate portfolio analysis response
 */
export function validatePortfolioAnalysis(analysis: any) {
  expect(analysis).toBeDefined();
  expect(analysis.holdings).toBeDefined();
  expect(Array.isArray(analysis.holdings)).toBe(true);
  expect(analysis.totalValue).toBeDefined();
  expect(analysis.riskScore).toBeDefined();
  expect(analysis.recommendations).toBeDefined();
  expect(Array.isArray(analysis.recommendations)).toBe(true);
}

/**
 * Helper function to setup test environment variables
 */
export function setupTestEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.MODEL = 'test-model';
  process.env.MAX_TOKENS = '1000';
  process.env.TEMPERATURE = '0.7';
  process.env.DEBUG = 'false';
  process.env.LOG_LEVEL = 'error';
}

/**
 * Helper function to cleanup test environment variables
 */
export function cleanupTestEnvironment() {
  delete process.env.NODE_ENV;
  delete process.env.MODEL;
  delete process.env.MAX_TOKENS;
  delete process.env.TEMPERATURE;
  delete process.env.DEBUG;
  delete process.env.LOG_LEVEL;
} 