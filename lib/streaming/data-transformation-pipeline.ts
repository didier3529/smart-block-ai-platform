import { PerformanceMonitor } from '../performance/monitor';
import { CompressionUtil } from '../utils/compression';

interface TransformationStep<T = any, R = any> {
  name: string;
  transform: (data: T) => Promise<R> | R;
  validate?: (data: R) => boolean;
  shouldSkip?: (data: T) => boolean;
}

interface PipelineMetrics {
  processedItems: number;
  failedItems: number;
  averageProcessingTime: number;
  compressionRatio: number;
  validationErrors: number;
  skippedSteps: number;
}

export class DataTransformationPipeline {
  private steps: TransformationStep[];
  private performanceMonitor: PerformanceMonitor;
  private metrics: PipelineMetrics;

  constructor() {
    this.steps = [];
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.metrics = {
      processedItems: 0,
      failedItems: 0,
      averageProcessingTime: 0,
      compressionRatio: 1,
      validationErrors: 0,
      skippedSteps: 0
    };
  }

  addStep<T, R>(step: TransformationStep<T, R>): this {
    this.steps.push(step);
    return this;
  }

  async process<T>(data: T): Promise<any> {
    const startTime = this.performanceMonitor.startOperation('pipeline:process');
    let current = data;
    let originalSize = 0;
    let transformedSize = 0;

    try {
      // Calculate original size for compression ratio
      originalSize = this.calculateSize(data);

      for (const step of this.steps) {
        const stepStartTime = this.performanceMonitor.startOperation(`step:${step.name}`);

        try {
          // Check if step should be skipped
          if (step.shouldSkip && step.shouldSkip(current)) {
            this.metrics.skippedSteps++;
            continue;
          }

          // Transform data
          current = await step.transform(current);

          // Validate if validator exists
          if (step.validate && !step.validate(current)) {
            throw new Error(`Validation failed for step: ${step.name}`);
          }

          this.performanceMonitor.endOperation(`step:${step.name}`, stepStartTime);
        } catch (error) {
          this.metrics.validationErrors++;
          this.performanceMonitor.endOperation(`step:${step.name}`, stepStartTime, error as Error);
          throw error;
        }
      }

      // Calculate transformed size and compression ratio
      transformedSize = this.calculateSize(current);
      this.metrics.compressionRatio = transformedSize / originalSize;

      this.metrics.processedItems++;
      this.updateAverageProcessingTime(Date.now() - startTime);

      this.performanceMonitor.endOperation('pipeline:process', startTime);
      return current;
    } catch (error) {
      this.metrics.failedItems++;
      this.performanceMonitor.endOperation('pipeline:process', startTime, error as Error);
      throw error;
    }
  }

  async processBatch<T>(items: T[]): Promise<any[]> {
    const results: any[] = [];
    const errors: Error[] = [];

    await Promise.all(
      items.map(async (item) => {
        try {
          const result = await this.process(item);
          results.push(result);
        } catch (error) {
          errors.push(error as Error);
        }
      })
    );

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Some items failed to process');
    }

    return results;
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private updateAverageProcessingTime(newTime: number): void {
    const total = this.metrics.processedItems;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (total - 1) + newTime) / total;
  }

  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }

  // Predefined transformation steps
  static readonly commonSteps = {
    parseJSON: (): TransformationStep<string, any> => ({
      name: 'parseJSON',
      transform: (data: string) => JSON.parse(data),
      validate: (data: any) => data !== null && typeof data === 'object'
    }),

    normalize: (): TransformationStep => ({
      name: 'normalize',
      transform: (data: any) => {
        if (typeof data !== 'object') return data;
        return Object.entries(data).reduce((acc, [key, value]) => ({
          ...acc,
          [key.toLowerCase()]: value
        }), {});
      }
    }),

    validate: (schema: any): TransformationStep => ({
      name: 'validate',
      transform: (data: any) => data,
      validate: (data: any) => {
        // Add your schema validation logic here
        return true; // Placeholder implementation
      }
    }),

    compress: (): TransformationStep => ({
      name: 'compress',
      transform: async (data: any) => {
        const serialized = JSON.stringify(data);
        return await CompressionUtil.compress(serialized);
      }
    }),

    decompress: (): TransformationStep => ({
      name: 'decompress',
      transform: async (data: string) => {
        const decompressed = await CompressionUtil.decompress(data);
        return JSON.parse(decompressed);
      }
    }),

    filter: (predicate: (data: any) => boolean): TransformationStep => ({
      name: 'filter',
      transform: (data: any) => data,
      shouldSkip: (data: any) => !predicate(data)
    })
  };
} 