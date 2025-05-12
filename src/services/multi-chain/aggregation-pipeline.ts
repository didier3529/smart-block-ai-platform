import { ChainData, AggregatedData, AggregationConfig } from '../../types/chain';
import { EventEmitter } from 'events';

export class AggregationPipeline extends EventEmitter {
  private static instance: AggregationPipeline;
  private processingQueue: Map<string, ChainData[]>;
  private aggregationConfigs: Map<string, AggregationConfig>;

  private constructor() {
    super();
    this.processingQueue = new Map();
    this.aggregationConfigs = new Map();
  }

  public static getInstance(): AggregationPipeline {
    if (!AggregationPipeline.instance) {
      AggregationPipeline.instance = new AggregationPipeline();
    }
    return AggregationPipeline.instance;
  }

  public addChainData(chainId: string, data: ChainData): void {
    const queuedData = this.processingQueue.get(chainId) || [];
    queuedData.push(data);
    this.processingQueue.set(chainId, queuedData);
    this.emit('dataAdded', { chainId, data });
  }

  public setAggregationConfig(chainId: string, config: AggregationConfig): void {
    this.aggregationConfigs.set(chainId, config);
    this.emit('configUpdated', { chainId, config });
  }

  public async processQueue(chainId: string): Promise<AggregatedData> {
    const queuedData = this.processingQueue.get(chainId) || [];
    const config = this.aggregationConfigs.get(chainId);

    if (!config) {
      throw new Error(`No aggregation config found for chain ${chainId}`);
    }

    const aggregatedData = await this.aggregateData(queuedData, config);
    this.processingQueue.delete(chainId);
    this.emit('dataProcessed', { chainId, aggregatedData });

    return aggregatedData;
  }

  private async aggregateData(data: ChainData[], config: AggregationConfig): Promise<AggregatedData> {
    // Apply normalization rules
    const normalizedData = data.map(item => this.normalizeData(item, config));

    // Group by data type
    const groupedData = this.groupDataByType(normalizedData);

    // Apply aggregation rules
    const aggregatedData = this.applyAggregationRules(groupedData, config);

    // Validate results
    this.validateAggregatedData(aggregatedData);

    return aggregatedData;
  }

  private normalizeData(data: ChainData, config: AggregationConfig): ChainData {
    // Apply chain-specific normalization rules
    const normalized = {
      ...data,
      timestamp: new Date(data.timestamp),
      value: this.normalizeValue(data.value, config.decimals),
      metadata: this.normalizeMetadata(data.metadata, config)
    };

    return normalized;
  }

  private normalizeValue(value: string | number, decimals: number): number {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue / Math.pow(10, decimals);
  }

  private normalizeMetadata(metadata: Record<string, any>, config: AggregationConfig): Record<string, any> {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const normalizer = config.metadataNormalizers?.[key];
      normalized[key] = normalizer ? normalizer(value) : value;
    }

    return normalized;
  }

  private groupDataByType(data: ChainData[]): Record<string, ChainData[]> {
    return data.reduce((groups, item) => {
      const type = item.type || 'default';
      groups[type] = groups[type] || [];
      groups[type].push(item);
      return groups;
    }, {} as Record<string, ChainData[]>);
  }

  private applyAggregationRules(
    groupedData: Record<string, ChainData[]>,
    config: AggregationConfig
  ): AggregatedData {
    const result: AggregatedData = {
      timestamp: new Date(),
      chains: [],
      metrics: {},
      summary: {}
    };

    for (const [type, items] of Object.entries(groupedData)) {
      const aggregator = config.aggregators?.[type];
      if (aggregator) {
        result.metrics[type] = aggregator(items);
      }
    }

    // Apply cross-chain analysis
    if (config.crossChainAnalysis) {
      result.summary = config.crossChainAnalysis(result.metrics);
    }

    return result;
  }

  private validateAggregatedData(data: AggregatedData): void {
    // Ensure required fields are present
    if (!data.timestamp || !data.metrics || !data.summary) {
      throw new Error('Invalid aggregated data structure');
    }

    // Validate metrics
    for (const [type, value] of Object.entries(data.metrics)) {
      if (value === undefined || value === null) {
        throw new Error(`Invalid metric value for type ${type}`);
      }
    }

    // Validate summary
    if (Object.keys(data.summary).length === 0) {
      throw new Error('Empty summary in aggregated data');
    }
  }
} 