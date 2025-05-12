import { BaseAgent } from '../BaseAgent';
import { HistoryStorage } from '../../storage/HistoryStorage';
import { PerformanceManager } from '../../core/PerformanceManager';
import { StateManager } from '../../core/StateManager';

jest.mock('../../storage/HistoryStorage');
jest.mock('../../core/PerformanceManager');
jest.mock('../../core/StateManager');

class TestAgent extends BaseAgent {
  constructor() {
    super('TestAgent');
  }

  protected async analyze(input: any): Promise<any> {
    return { result: 'test-result' };
  }

  protected async validateInput(input: any): Promise<void> {
    if (!input.valid) {
      throw new Error('Invalid input');
    }
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  const mockHistoryStorage = HistoryStorage as jest.MockedClass<typeof HistoryStorage>;
  const mockPerformanceManager = PerformanceManager as jest.MockedClass<typeof PerformanceManager>;

  beforeEach(() => {
    mockHistoryStorage.mockClear();
    mockPerformanceManager.mockClear();
    agent = new TestAgent();
  });

  describe('runAnalysis', () => {
    const validInput = { valid: true, data: 'test' };
    const userId = 'test-user';

    it('should create history entry and start analysis', async () => {
      mockHistoryStorage.prototype.addEntry.mockResolvedValue('test-history-id');
      mockPerformanceManager.prototype.execute.mockImplementation(fn => fn());

      const historyId = await agent.runAnalysis(validInput, userId);

      expect(historyId).toBe('test-history-id');
      expect(mockHistoryStorage.prototype.addEntry).toHaveBeenCalledWith({
        agentType: 'TestAgent',
        userId,
        status: 'pending',
        input: validInput,
      });
    });

    it('should update history with result on successful analysis', async () => {
      mockHistoryStorage.prototype.addEntry.mockResolvedValue('test-history-id');
      mockPerformanceManager.prototype.execute.mockImplementation(fn => fn());

      await agent.runAnalysis(validInput, userId);

      // Wait for background task
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHistoryStorage.prototype.updateEntry).toHaveBeenCalledWith(
        'test-history-id',
        {
          status: 'completed',
          result: { result: 'test-result' },
        }
      );
    });

    it('should update history with error on analysis failure', async () => {
      mockHistoryStorage.prototype.addEntry.mockResolvedValue('test-history-id');
      mockPerformanceManager.prototype.execute.mockRejectedValue(new Error('Analysis failed'));

      await agent.runAnalysis(validInput, userId);

      // Wait for background task
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHistoryStorage.prototype.updateEntry).toHaveBeenCalledWith(
        'test-history-id',
        {
          status: 'failed',
          error: 'Analysis failed',
        }
      );
    });

    it('should throw error on invalid input', async () => {
      const invalidInput = { valid: false };

      await expect(
        agent.runAnalysis(invalidInput, userId)
      ).rejects.toThrow('Invalid input');

      expect(mockHistoryStorage.prototype.addEntry).not.toHaveBeenCalled();
    });
  });

  describe('getAnalysisStatus', () => {
    it('should return history entry', async () => {
      const mockEntry = {
        id: 'test-id',
        status: 'completed',
        result: { data: 'test' },
      };

      mockHistoryStorage.prototype.getEntry.mockResolvedValue(mockEntry);

      const result = await agent.getAnalysisStatus('test-id');
      expect(result).toEqual(mockEntry);
    });
  });

  describe('queryHistory', () => {
    it('should query history with agent type', async () => {
      const mockResult = {
        entries: [{ id: 'test-id' }],
        total: 1,
      };

      mockHistoryStorage.prototype.queryHistory.mockResolvedValue(mockResult);

      const query = { userId: 'test-user' };
      const result = await agent.queryHistory(query);

      expect(result).toEqual(mockResult);
      expect(mockHistoryStorage.prototype.queryHistory).toHaveBeenCalledWith({
        ...query,
        agentType: 'TestAgent',
      });
    });
  });

  describe('cleanupHistory', () => {
    it('should cleanup old history entries', async () => {
      const date = new Date();
      mockHistoryStorage.prototype.cleanup.mockResolvedValue(5);

      const result = await agent.cleanupHistory(date);
      expect(result).toBe(5);
      expect(mockHistoryStorage.prototype.cleanup).toHaveBeenCalledWith(date);
    });
  });
}); 