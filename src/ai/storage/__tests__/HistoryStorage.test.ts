import { HistoryStorage, HistoryEntry } from '../HistoryStorage';
import { FileStorage } from '../FileStorage';
import fs from 'fs/promises';
import path from 'path';

jest.mock('../FileStorage');

describe('HistoryStorage', () => {
  let historyStorage: HistoryStorage;
  const mockFileStorage = FileStorage as jest.MockedClass<typeof FileStorage>;

  beforeEach(() => {
    mockFileStorage.mockClear();
    historyStorage = new HistoryStorage('test/history');
  });

  describe('initialize', () => {
    it('should create empty history file if it does not exist', async () => {
      mockFileStorage.prototype.exists.mockResolvedValue(false);
      
      await historyStorage.initialize();

      expect(mockFileStorage.prototype.write).toHaveBeenCalledWith(
        'analysis_history.json',
        { entries: [] }
      );
    });

    it('should not create file if it already exists', async () => {
      mockFileStorage.prototype.exists.mockResolvedValue(true);
      
      await historyStorage.initialize();

      expect(mockFileStorage.prototype.write).not.toHaveBeenCalled();
    });
  });

  describe('addEntry', () => {
    it('should add new entry with generated id and timestamp', async () => {
      const mockHistory = { entries: [] };
      mockFileStorage.prototype.read.mockResolvedValue(mockHistory);

      const entry = {
        agentType: 'TestAgent',
        userId: 'user123',
        status: 'pending' as const,
        input: { test: true },
      };

      const id = await historyStorage.addEntry(entry);

      expect(id).toBeDefined();
      expect(mockFileStorage.prototype.write).toHaveBeenCalled();
      
      const writeCall = mockFileStorage.prototype.write.mock.calls[0];
      const savedHistory = writeCall[1];
      const savedEntry = savedHistory.entries[0];

      expect(savedEntry).toMatchObject(entry);
      expect(savedEntry.id).toBeDefined();
      expect(savedEntry.timestamp).toBeDefined();
    });
  });

  describe('updateEntry', () => {
    it('should update existing entry', async () => {
      const existingEntry: HistoryEntry = {
        id: 'test123',
        agentType: 'TestAgent',
        userId: 'user123',
        status: 'pending',
        input: { test: true },
        timestamp: Date.now(),
      };

      const mockHistory = { entries: [existingEntry] };
      mockFileStorage.prototype.read.mockResolvedValue(mockHistory);

      const update = {
        status: 'completed' as const,
        result: { success: true },
      };

      await historyStorage.updateEntry('test123', update);

      const writeCall = mockFileStorage.prototype.write.mock.calls[0];
      const savedHistory = writeCall[1];
      const updatedEntry = savedHistory.entries[0];

      expect(updatedEntry).toMatchObject({
        ...existingEntry,
        ...update,
      });
    });

    it('should throw error if entry not found', async () => {
      mockFileStorage.prototype.read.mockResolvedValue({ entries: [] });

      await expect(
        historyStorage.updateEntry('nonexistent', { status: 'completed' as const })
      ).rejects.toThrow('History entry nonexistent not found');
    });
  });

  describe('queryHistory', () => {
    const mockEntries: HistoryEntry[] = [
      {
        id: '1',
        agentType: 'TestAgent',
        userId: 'user1',
        status: 'completed',
        input: {},
        timestamp: new Date('2024-01-01').getTime(),
      },
      {
        id: '2',
        agentType: 'OtherAgent',
        userId: 'user2',
        status: 'pending',
        input: {},
        timestamp: new Date('2024-01-02').getTime(),
      },
    ];

    beforeEach(() => {
      mockFileStorage.prototype.read.mockResolvedValue({ entries: mockEntries });
    });

    it('should filter by agent type', async () => {
      const result = await historyStorage.queryHistory({ agentType: 'TestAgent' });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('1');
    });

    it('should filter by user id', async () => {
      const result = await historyStorage.queryHistory({ userId: 'user2' });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('2');
    });

    it('should filter by date range', async () => {
      const result = await historyStorage.queryHistory({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('1');
    });

    it('should apply pagination', async () => {
      const result = await historyStorage.queryHistory({
        limit: 1,
        offset: 1,
      });
      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.entries[0].id).toBe('1'); // Second entry after sorting by timestamp desc
    });
  });

  describe('cleanup', () => {
    it('should remove entries older than specified date', async () => {
      const mockEntries: HistoryEntry[] = [
        {
          id: '1',
          agentType: 'TestAgent',
          userId: 'user1',
          status: 'completed',
          input: {},
          timestamp: new Date('2024-01-01').getTime(),
        },
        {
          id: '2',
          agentType: 'TestAgent',
          userId: 'user1',
          status: 'completed',
          input: {},
          timestamp: new Date('2024-02-01').getTime(),
        },
      ];

      mockFileStorage.prototype.read.mockResolvedValue({ entries: mockEntries });

      const removedCount = await historyStorage.cleanup(new Date('2024-01-15'));

      expect(removedCount).toBe(1);

      const writeCall = mockFileStorage.prototype.write.mock.calls[0];
      const savedHistory = writeCall[1];
      expect(savedHistory.entries).toHaveLength(1);
      expect(savedHistory.entries[0].id).toBe('2');
    });
  });
}); 