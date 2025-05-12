import { StateManager } from '../StateManager';
import { FileStorage } from '../../storage/FileStorage';
import { PerformanceManager } from '../PerformanceManager';
import { AgentState } from '../../types/state';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('../PerformanceManager');

describe('State Management System', () => {
  const testBasePath = path.join(process.cwd(), 'test-states');
  let stateManager: StateManager;
  let storage: FileStorage;
  let performanceManager: jest.Mocked<PerformanceManager>;

  const mockState: AgentState = {
    id: 'test-agent',
    status: 'active',
    lastUpdate: Date.now(),
    data: {
      key: 'value'
    }
  };

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();

    // Setup mocked PerformanceManager
    performanceManager = {
      withBatching: jest.fn((key, fn) => fn()),
      withCaching: jest.fn((key, fn) => fn()),
      withRateLimit: jest.fn()
    } as any;

    // Setup storage
    storage = new FileStorage({ path: testBasePath });
    await storage.initialize();

    // Create StateManager instance
    stateManager = new StateManager(storage, performanceManager);
  });

  describe('State Manager', () => {
    it('should save state successfully', async () => {
      await stateManager.saveState('test-agent', mockState);
      
      expect(performanceManager.withBatching).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-agent.json'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should load state successfully', async () => {
      // Mock fs.readFile to return our test state
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockState));

      const loadedState = await stateManager.loadState('test-agent');
      
      expect(performanceManager.withCaching).toHaveBeenCalled();
      expect(loadedState).toEqual(mockState);
    });

    it('should return null for non-existent state', async () => {
      // Mock fs.readFile to throw ENOENT
      (fs.readFile as jest.Mock).mockRejectedValueOnce({ code: 'ENOENT' });

      const loadedState = await stateManager.loadState('non-existent');
      expect(loadedState).toBeNull();
    });

    it('should delete state successfully', async () => {
      await stateManager.deleteState('test-agent');
      
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('test-agent.json')
      );
    });

    it('should list all states', async () => {
      // Mock fs.readdir to return some test files
      (fs.readdir as jest.Mock).mockResolvedValueOnce([
        'agent1.json',
        'agent2.json',
        'not-a-state.txt'
      ]);

      const states = await stateManager.listStates();
      expect(states).toEqual(['agent1', 'agent2']);
    });

    it('should use cache for repeated loads', async () => {
      // First load - should hit storage
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockState));
      await stateManager.loadState('test-agent');

      // Second load - should use cache
      const loadedState = await stateManager.loadState('test-agent');
      expect(loadedState).toEqual(mockState);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      // Load state into cache
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockState));
      await stateManager.loadState('test-agent');

      // Clear cache
      await stateManager.clearCache();

      // Load again - should hit storage
      await stateManager.loadState('test-agent');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('File Storage', () => {
    it('should initialize storage directory', async () => {
      const storage = new FileStorage({ path: testBasePath });
      await storage.initialize();
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        testBasePath,
        { recursive: true }
      );
    });

    it('should handle storage initialization errors', async () => {
      (fs.mkdir as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

      const storage = new FileStorage({ path: testBasePath });
      await expect(storage.initialize()).rejects.toThrow('Failed to initialize storage directory');
    });

    it('should handle save errors', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

      await expect(storage.save('test-agent', mockState))
        .rejects.toThrow('Failed to save state for agent test-agent');
    });

    it('should handle load errors', async () => {
      (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('Read error'));

      await expect(storage.load('test-agent'))
        .rejects.toThrow('Failed to load state for agent test-agent');
    });

    it('should handle delete errors', async () => {
      (fs.unlink as jest.Mock).mockRejectedValueOnce(new Error('Delete error'));

      await expect(storage.delete('test-agent'))
        .rejects.toThrow('Failed to delete state for agent test-agent');
    });

    it('should handle list errors', async () => {
      (fs.readdir as jest.Mock).mockRejectedValueOnce(new Error('Read directory error'));

      await expect(storage.list())
        .rejects.toThrow('Failed to list agent states');
    });
  });
}); 