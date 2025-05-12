import { z } from 'zod';
import { FileStorage } from './FileStorage';

// Schema for history entry
export const HistoryEntrySchema = z.object({
  id: z.string(),
  agentType: z.string(),
  timestamp: z.number(),
  userId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  input: z.any(),
  result: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export interface HistoryQuery {
  agentType?: string;
  userId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class HistoryStorage {
  private storage: FileStorage;
  private historyFile: string;

  constructor(basePath: string = 'data/history') {
    this.storage = new FileStorage(basePath);
    this.historyFile = 'analysis_history.json';
  }

  async initialize(): Promise<void> {
    const exists = await this.storage.exists(this.historyFile);
    if (!exists) {
      await this.storage.write(this.historyFile, { entries: [] });
    }
  }

  async addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const history = await this.loadHistory();
    const id = this.generateId();
    const timestamp = Date.now();

    const newEntry: HistoryEntry = {
      ...entry,
      id,
      timestamp,
    };

    history.entries.push(newEntry);
    await this.storage.write(this.historyFile, history);
    return id;
  }

  async updateEntry(id: string, update: Partial<HistoryEntry>): Promise<void> {
    const history = await this.loadHistory();
    const index = history.entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      throw new Error(`History entry ${id} not found`);
    }

    history.entries[index] = {
      ...history.entries[index],
      ...update,
    };

    await this.storage.write(this.historyFile, history);
  }

  async getEntry(id: string): Promise<HistoryEntry | null> {
    const history = await this.loadHistory();
    return history.entries.find(entry => entry.id === id) || null;
  }

  async queryHistory(query: HistoryQuery): Promise<{
    entries: HistoryEntry[];
    total: number;
  }> {
    const history = await this.loadHistory();
    let filtered = history.entries;

    // Apply filters
    if (query.agentType) {
      filtered = filtered.filter(entry => entry.agentType === query.agentType);
    }
    if (query.userId) {
      filtered = filtered.filter(entry => entry.userId === query.userId);
    }
    if (query.status) {
      filtered = filtered.filter(entry => entry.status === query.status);
    }
    if (query.startDate) {
      filtered = filtered.filter(entry => entry.timestamp >= query.startDate.getTime());
    }
    if (query.endDate) {
      filtered = filtered.filter(entry => entry.timestamp <= query.endDate.getTime());
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    const total = filtered.length;
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    // Apply pagination
    filtered = filtered.slice(offset, offset + limit);

    return {
      entries: filtered,
      total,
    };
  }

  async deleteEntry(id: string): Promise<void> {
    const history = await this.loadHistory();
    const index = history.entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      throw new Error(`History entry ${id} not found`);
    }

    history.entries.splice(index, 1);
    await this.storage.write(this.historyFile, history);
  }

  async cleanup(olderThan: Date): Promise<number> {
    const history = await this.loadHistory();
    const threshold = olderThan.getTime();
    const originalLength = history.entries.length;

    history.entries = history.entries.filter(entry => entry.timestamp > threshold);
    await this.storage.write(this.historyFile, history);

    return originalLength - history.entries.length;
  }

  private async loadHistory(): Promise<{ entries: HistoryEntry[] }> {
    await this.initialize();
    return await this.storage.read(this.historyFile);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
} 