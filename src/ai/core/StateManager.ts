import { AgentState, StateStorage, StorageConfig } from '../types/state';
import { PerformanceManager } from './PerformanceManager';

export class StateManager {
  private storage: StateStorage;
  private performanceManager: PerformanceManager;
  private cache: Map<string, { state: AgentState; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(storage: StateStorage, performanceManager: PerformanceManager) {
    this.storage = storage;
    this.performanceManager = performanceManager;
  }

  async saveState(agentId: string, state: AgentState): Promise<void> {
    await this.performanceManager.withBatching(
      `save_state_${agentId}`,
      async () => {
        // Update cache
        this.cache.set(agentId, {
          state,
          timestamp: Date.now()
        });

        // Persist to storage
        await this.storage.save(agentId, state);
      }
    );
  }

  async loadState(agentId: string): Promise<AgentState | null> {
    return this.performanceManager.withCaching(
      `load_state_${agentId}`,
      async () => {
        // Check cache first
        const cached = this.cache.get(agentId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          return cached.state;
        }

        // Load from storage
        const state = await this.storage.load(agentId);
        if (state) {
          this.cache.set(agentId, {
            state,
            timestamp: Date.now()
          });
        }

        return state;
      }
    );
  }

  async deleteState(agentId: string): Promise<void> {
    // Remove from cache
    this.cache.delete(agentId);

    // Remove from storage
    await this.storage.delete(agentId);
  }

  async listStates(): Promise<string[]> {
    return this.storage.list();
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }
} 