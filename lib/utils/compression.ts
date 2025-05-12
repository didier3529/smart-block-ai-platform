import { deflate, inflate } from 'pako';
import { PerformanceMonitor } from '../performance/monitor';

interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  decompressionTime: number;
}

export class CompressionUtil {
  private static performanceMonitor = PerformanceMonitor.getInstance();
  private static metrics: CompressionMetrics = {
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 1,
    compressionTime: 0,
    decompressionTime: 0
  };

  static async compress(data: string): Promise<string> {
    const startTime = this.performanceMonitor.startOperation('compression');
    
    try {
      const originalSize = new TextEncoder().encode(data).length;
      const compressed = deflate(data, { level: 6 }); // Balanced compression level
      const compressedSize = compressed.length;
      
      // Update metrics
      this.updateCompressionMetrics(
        originalSize,
        compressedSize,
        Date.now() - startTime
      );

      this.performanceMonitor.endOperation('compression', startTime);
      return Buffer.from(compressed).toString('base64');
    } catch (error) {
      this.performanceMonitor.endOperation('compression', startTime, error as Error);
      throw error;
    }
  }

  static async decompress(data: string): Promise<string> {
    const startTime = this.performanceMonitor.startOperation('decompression');
    
    try {
      const compressed = Buffer.from(data, 'base64');
      const decompressed = inflate(compressed);
      
      // Update metrics
      this.metrics.decompressionTime = Date.now() - startTime;

      this.performanceMonitor.endOperation('decompression', startTime);
      return new TextDecoder().decode(decompressed);
    } catch (error) {
      this.performanceMonitor.endOperation('decompression', startTime, error as Error);
      throw error;
    }
  }

  private static updateCompressionMetrics(
    originalSize: number,
    compressedSize: number,
    compressionTime: number
  ): void {
    this.metrics.originalSize = originalSize;
    this.metrics.compressedSize = compressedSize;
    this.metrics.compressionRatio = compressedSize / originalSize;
    this.metrics.compressionTime = compressionTime;
  }

  static getMetrics(): CompressionMetrics {
    return { ...this.metrics };
  }

  // Utility method to determine if compression is worthwhile
  static shouldCompress(data: string): boolean {
    const size = new TextEncoder().encode(data).length;
    // Only compress data larger than 1KB
    return size > 1024;
  }

  // Batch compression for multiple items
  static async compressBatch(items: string[]): Promise<string[]> {
    const startTime = this.performanceMonitor.startOperation('batchCompression');
    const results: string[] = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    try {
      await Promise.all(
        items.map(async (item) => {
          if (this.shouldCompress(item)) {
            const compressed = await this.compress(item);
            results.push(compressed);
            totalOriginalSize += new TextEncoder().encode(item).length;
            totalCompressedSize += new TextEncoder().encode(compressed).length;
          } else {
            results.push(item);
            const size = new TextEncoder().encode(item).length;
            totalOriginalSize += size;
            totalCompressedSize += size;
          }
        })
      );

      // Update batch metrics
      this.updateCompressionMetrics(
        totalOriginalSize,
        totalCompressedSize,
        Date.now() - startTime
      );

      this.performanceMonitor.endOperation('batchCompression', startTime);
      return results;
    } catch (error) {
      this.performanceMonitor.endOperation('batchCompression', startTime, error as Error);
      throw error;
    }
  }

  // Batch decompression for multiple items
  static async decompressBatch(items: string[]): Promise<string[]> {
    const startTime = this.performanceMonitor.startOperation('batchDecompression');
    
    try {
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            return await this.decompress(item);
          } catch {
            // If decompression fails, item might not be compressed
            return item;
          }
        })
      );

      this.metrics.decompressionTime = Date.now() - startTime;
      this.performanceMonitor.endOperation('batchDecompression', startTime);
      return results;
    } catch (error) {
      this.performanceMonitor.endOperation('batchDecompression', startTime, error as Error);
      throw error;
    }
  }
} 