import { EventEmitter } from 'events';
import { AggregationPipeline } from './aggregation-pipeline';
import { ChainData, AggregationConfig, AggregatedData, CrossChainMetrics } from '../../types/chain';

export class AggregationManager extends EventEmitter {
  private static instance: AggregationManager;
  private pipeline: AggregationPipeline;
  private activeChains: Set<string>;
  private processingInterval: NodeJS.Timeout | null;
  private readonly DEFAULT_INTERVAL = 5000; // 5 seconds

  private constructor() {
    super();
    this.pipeline = AggregationPipeline.getInstance();
    this.activeChains = new Set();
    this.processingInterval = null;

    // Listen to pipeline events
    this.pipeline.on('dataAdded', this.handleDataAdded.bind(this));
    this.pipeline.on('dataProcessed', this.handleDataProcessed.bind(this));
    this.pipeline.on('configUpdated', this.handleConfigUpdated.bind(this));
  }

  public static getInstance(): AggregationManager {
    if (!AggregationManager.instance) {
      AggregationManager.instance = new AggregationManager();
    }
    return AggregationManager.instance;
  }

  public registerChain(chainId: string, config: AggregationConfig): void {
    this.activeChains.add(chainId);
    this.pipeline.setAggregationConfig(chainId, config);
    this.startProcessing();
  }

  public unregisterChain(chainId: string): void {
    this.activeChains.delete(chainId);
    if (this.activeChains.size === 0) {
      this.stopProcessing();
    }
  }

  public addData(chainId: string, data: ChainData): void {
    if (!this.activeChains.has(chainId)) {
      throw new Error(`Chain ${chainId} is not registered`);
    }
    this.pipeline.addChainData(chainId, data);
  }

  private startProcessing(): void {
    if (!this.processingInterval) {
      this.processingInterval = setInterval(
        this.processAllChains.bind(this),
        this.DEFAULT_INTERVAL
      );
    }
  }

  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processAllChains(): Promise<void> {
    try {
      const aggregatedResults: Record<string, AggregatedData> = {};

      // Process each chain's data
      for (const chainId of this.activeChains) {
        try {
          const result = await this.pipeline.processQueue(chainId);
          aggregatedResults[chainId] = result;
        } catch (error) {
          this.emit('error', { chainId, error });
          console.error(`Error processing chain ${chainId}:`, error);
        }
      }

      // Perform cross-chain analysis
      if (Object.keys(aggregatedResults).length > 0) {
        const crossChainMetrics = this.analyzeCrossChainMetrics(aggregatedResults);
        this.emit('crossChainMetrics', crossChainMetrics);
      }

    } catch (error) {
      this.emit('error', { error });
      console.error('Error in aggregation process:', error);
    }
  }

  private analyzeCrossChainMetrics(results: Record<string, AggregatedData>): CrossChainMetrics {
    const metrics: CrossChainMetrics = {
      totalTransactions: 0,
      totalValueLocked: 0,
      crossChainVolume: 0,
      chainActivity: {},
      performanceMetrics: {}
    };

    // Calculate total metrics across all chains
    for (const [chainId, data] of Object.entries(results)) {
      metrics.totalTransactions += data.metrics.transactionCount || 0;
      metrics.totalValueLocked += data.metrics.totalValue || 0;
      metrics.chainActivity[chainId] = data.metrics.activeAddresses || 0;
      metrics.performanceMetrics[chainId] = data.metrics.blockTime || 0;

      // Calculate cross-chain volume if available
      if (data.metrics.crossChainTransfers) {
        metrics.crossChainVolume += data.metrics.crossChainTransfers.volume || 0;
      }
    }

    return metrics;
  }

  private handleDataAdded(event: { chainId: string; data: ChainData }): void {
    this.emit('dataAdded', event);
  }

  private handleDataProcessed(event: { chainId: string; aggregatedData: AggregatedData }): void {
    this.emit('dataProcessed', event);
  }

  private handleConfigUpdated(event: { chainId: string; config: AggregationConfig }): void {
    this.emit('configUpdated', event);
  }
} 