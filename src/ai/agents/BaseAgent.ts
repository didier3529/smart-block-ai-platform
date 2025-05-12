import { HistoryStorage, HistoryEntry, HistoryQuery } from '../storage/HistoryStorage';
import { PerformanceManager } from '../core/PerformanceManager';
import { StateManager } from '../core/StateManager';

export abstract class BaseAgent {
  protected historyStorage: HistoryStorage;
  protected performanceManager: PerformanceManager;
  protected stateManager: StateManager;
  
  constructor(
    protected readonly agentType: string,
    protected readonly options: {
      historyPath?: string;
      performanceConfig?: any;
      stateConfig?: any;
    } = {}
  ) {
    this.historyStorage = new HistoryStorage(options.historyPath);
    this.performanceManager = new PerformanceManager(options.performanceConfig);
    this.stateManager = new StateManager(options.stateConfig);
  }

  // Abstract methods that must be implemented by specific agents
  protected abstract analyze(input: any): Promise<any>;
  protected abstract validateInput(input: any): Promise<void>;

  // Main analysis method with history tracking
  async runAnalysis(input: any, userId: string): Promise<string> {
    await this.validateInput(input);

    // Create history entry for new analysis
    const historyId = await this.historyStorage.addEntry({
      agentType: this.agentType,
      userId,
      status: 'pending',
      input,
    });

    // Start analysis in background
    this.executeAnalysis(historyId, input).catch(error => {
      // Update history with error if analysis fails
      this.historyStorage.updateEntry(historyId, {
        status: 'failed',
        error: error.message,
      });
    });

    return historyId;
  }

  // Get status of an analysis
  async getAnalysisStatus(historyId: string): Promise<HistoryEntry | null> {
    return await this.historyStorage.getEntry(historyId);
  }

  // Query analysis history
  async queryHistory(query: HistoryQuery): Promise<{
    entries: HistoryEntry[];
    total: number;
  }> {
    return await this.historyStorage.queryHistory({
      ...query,
      agentType: this.agentType,
    });
  }

  // Protected method to execute analysis and update history
  protected async executeAnalysis(historyId: string, input: any): Promise<void> {
    try {
      // Update status to processing
      await this.historyStorage.updateEntry(historyId, {
        status: 'processing',
      });

      // Run the analysis with performance management
      const result = await this.performanceManager.execute(
        () => this.analyze(input)
      );

      // Update history with success
      await this.historyStorage.updateEntry(historyId, {
        status: 'completed',
        result,
      });
    } catch (error) {
      // Update history with failure
      await this.historyStorage.updateEntry(historyId, {
        status: 'failed',
        error: error.message,
      });
      throw error;
    }
  }

  // Cleanup old history entries
  async cleanupHistory(olderThan: Date): Promise<number> {
    return await this.historyStorage.cleanup(olderThan);
  }
} 