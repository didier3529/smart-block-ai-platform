import { DataTransformationPipeline } from '../data-transformation-pipeline';
import { PerformanceMonitor } from '../../performance/monitor';
import { CompressionUtil } from '../../utils/compression';

jest.mock('../../performance/monitor');
jest.mock('../../utils/compression');

describe('DataTransformationPipeline', () => {
  let pipeline: DataTransformationPipeline;
  let performanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance() as jest.Mocked<PerformanceMonitor>;
    pipeline = new DataTransformationPipeline();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('step management', () => {
    it('should add transformation steps', () => {
      const step = {
        name: 'test',
        transform: (data: any) => data
      };

      pipeline.addStep(step);
      expect(pipeline['steps']).toHaveLength(1);
    });

    it('should chain step additions', () => {
      const step1 = {
        name: 'step1',
        transform: (data: any) => data
      };
      const step2 = {
        name: 'step2',
        transform: (data: any) => data
      };

      pipeline.addStep(step1).addStep(step2);
      expect(pipeline['steps']).toHaveLength(2);
    });
  });

  describe('data processing', () => {
    it('should process data through all steps', async () => {
      const step1 = {
        name: 'step1',
        transform: jest.fn().mockImplementation((data: any) => ({ ...data, step1: true }))
      };
      const step2 = {
        name: 'step2',
        transform: jest.fn().mockImplementation((data: any) => ({ ...data, step2: true }))
      };

      pipeline.addStep(step1).addStep(step2);
      const result = await pipeline.process({ original: true });

      expect(step1.transform).toHaveBeenCalled();
      expect(step2.transform).toHaveBeenCalled();
      expect(result).toEqual({
        original: true,
        step1: true,
        step2: true
      });
    });

    it('should skip steps based on shouldSkip condition', async () => {
      const step1 = {
        name: 'step1',
        transform: jest.fn().mockImplementation((data: any) => ({ ...data, step1: true })),
        shouldSkip: (data: any) => data.skip === true
      };

      pipeline.addStep(step1);
      const result = await pipeline.process({ skip: true });

      expect(step1.transform).not.toHaveBeenCalled();
      expect(result).toEqual({ skip: true });
    });

    it('should validate data after transformation', async () => {
      const step = {
        name: 'validate',
        transform: (data: any) => data,
        validate: jest.fn().mockImplementation((data: any) => data.valid === true)
      };

      pipeline.addStep(step);

      await expect(pipeline.process({ valid: false }))
        .rejects
        .toThrow('Validation failed for step: validate');
    });
  });

  describe('batch processing', () => {
    it('should process multiple items', async () => {
      const step = {
        name: 'test',
        transform: jest.fn().mockImplementation((data: any) => ({ ...data, processed: true }))
      };

      pipeline.addStep(step);
      const items = [{ id: 1 }, { id: 2 }];
      const results = await pipeline.processBatch(items);

      expect(results).toHaveLength(2);
      expect(step.transform).toHaveBeenCalledTimes(2);
      results.forEach(result => {
        expect(result.processed).toBe(true);
      });
    });

    it('should handle errors in batch processing', async () => {
      const step = {
        name: 'test',
        transform: jest.fn()
          .mockImplementationOnce(() => { throw new Error('Test error'); })
          .mockImplementationOnce((data: any) => data)
      };

      pipeline.addStep(step);
      const items = [{ id: 1 }, { id: 2 }];

      await expect(pipeline.processBatch(items))
        .rejects
        .toThrow('Some items failed to process');
    });
  });

  describe('predefined steps', () => {
    describe('parseJSON', () => {
      it('should parse valid JSON string', async () => {
        const jsonStep = DataTransformationPipeline.commonSteps.parseJSON();
        pipeline.addStep(jsonStep);

        const result = await pipeline.process('{"key":"value"}');
        expect(result).toEqual({ key: 'value' });
      });

      it('should throw error for invalid JSON', async () => {
        const jsonStep = DataTransformationPipeline.commonSteps.parseJSON();
        pipeline.addStep(jsonStep);

        await expect(pipeline.process('invalid json'))
          .rejects
          .toThrow();
      });
    });

    describe('normalize', () => {
      it('should normalize object keys', async () => {
        const normalizeStep = DataTransformationPipeline.commonSteps.normalize();
        pipeline.addStep(normalizeStep);

        const result = await pipeline.process({ TestKey: 'value' });
        expect(result).toEqual({ testkey: 'value' });
      });
    });

    describe('compression', () => {
      it('should compress and decompress data', async () => {
        const compressStep = DataTransformationPipeline.commonSteps.compress();
        const decompressStep = DataTransformationPipeline.commonSteps.decompress();
        
        (CompressionUtil.compress as jest.Mock).mockResolvedValue('compressed');
        (CompressionUtil.decompress as jest.Mock).mockResolvedValue('{"key":"value"}');

        pipeline
          .addStep(compressStep)
          .addStep(decompressStep);

        const result = await pipeline.process({ key: 'value' });
        expect(result).toEqual({ key: 'value' });
      });
    });

    describe('filter', () => {
      it('should filter data based on predicate', async () => {
        const filterStep = DataTransformationPipeline.commonSteps.filter(
          (data: any) => data.include === true
        );
        pipeline.addStep(filterStep);

        const result1 = await pipeline.process({ include: true });
        const result2 = await pipeline.process({ include: false });

        expect(result1).toEqual({ include: true });
        expect(result2).toEqual({ include: false });
      });
    });
  });

  describe('performance monitoring', () => {
    it('should track processing metrics', async () => {
      const step = {
        name: 'test',
        transform: (data: any) => data
      };

      pipeline.addStep(step);
      await pipeline.process({ test: true });

      const metrics = pipeline.getMetrics();
      expect(metrics.processedItems).toBe(1);
      expect(metrics.failedItems).toBe(0);
    });

    it('should track compression ratio', async () => {
      const data = { key: 'value'.repeat(100) }; // Create larger data
      const step = {
        name: 'test',
        transform: (data: any) => data
      };

      pipeline.addStep(step);
      await pipeline.process(data);

      const metrics = pipeline.getMetrics();
      expect(metrics.compressionRatio).toBeDefined();
    });

    it('should track validation errors', async () => {
      const step = {
        name: 'test',
        transform: (data: any) => data,
        validate: () => false
      };

      pipeline.addStep(step);
      await expect(pipeline.process({ test: true })).rejects.toThrow();

      const metrics = pipeline.getMetrics();
      expect(metrics.validationErrors).toBe(1);
    });

    it('should track skipped steps', async () => {
      const step = {
        name: 'test',
        transform: (data: any) => data,
        shouldSkip: () => true
      };

      pipeline.addStep(step);
      await pipeline.process({ test: true });

      const metrics = pipeline.getMetrics();
      expect(metrics.skippedSteps).toBe(1);
    });
  });
}); 