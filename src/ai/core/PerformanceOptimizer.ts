import { EventEmitter } from 'events';
import { AgentResponse } from '../types/agents';

export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ResourceUsage {
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
}

export interface PerformanceConfig {
  enableMetrics?: boolean;
  samplingRate?: number;
  slowOperationThreshold?: number;
  maxConcurrentOperations?: number;
  resourceMonitoringInterval?: number;
  cleanupInterval?: number;
  retentionPeriod?: number;
}

export class PerformanceOptimizer extends EventEmitter {
  private static instance: PerformanceOptimizer;
  private metrics: Map<string, PerformanceMetric>;
  private resourceMetrics: ResourceUsage[];
  private config: Required<PerformanceConfig>;
  private resourceMonitoringTimer?: NodeJS.Timer;
  private cleanupTimer?: NodeJS.Timer;
  private activeOperations: Set<string>;

  private constructor(config: PerformanceConfig = {}) {
    super();
    this.metrics = new Map();
    this.resourceMetrics = [];
    this.activeOperations = new Set();
    this.config = {
      enableMetrics: config.enableMetrics ?? true,
      samplingRate: config.samplingRate ?? 1.0,
      slowOperationThreshold: config.slowOperationThreshold ?? 1000,
      maxConcurrentOperations: config.maxConcurrentOperations ?? 10,
      resourceMonitoringInterval: config.resourceMonitoringInterval ?? 5000,
      cleanupInterval: config.cleanupInterval ?? 300000,
      retentionPeriod: config.retentionPeriod ?? 3600000
    };

    if (this.config.enableMetrics) {
      this.startResourceMonitoring();
      this.startPeriodicCleanup();
    }
  }

  static getInstance(config?: PerformanceConfig): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer(config);
    }
    return PerformanceOptimizer.instance;
  }

  startOperation(operation: string): number {
    if (!this.config.enableMetrics) return Date.now();

    if (this.activeOperations.size >= this.config.maxConcurrentOperations) {
      throw new Error('Maximum concurrent operations limit reached');
    }

    if (Math.random() > this.config.samplingRate) {
      return Date.now();
    }

    const startTime = Date.now();
    const metric: PerformanceMetric = {
      operation,
      startTime,
      success: true
    };

    this.metrics.set(`${operation}_${startTime}`, metric);
    this.activeOperations.add(operation);
    return startTime;
  }

  endOperation(operation: string, startTime: number, error?: Error): void {
    if (!this.config.enableMetrics) return;

    const metricKey = `${operation}_${startTime}`;
    const metric = this.metrics.get(metricKey);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - startTime;

    this.metrics.set(metricKey, {
      ...metric,
      endTime,
      duration,
      success: !error,
      error: error?.message
    });

    this.activeOperations.delete(operation);

    if (duration > this.config.slowOperationThreshold) {
      this.emit('slow_operation', {
        operation,
        duration,
        threshold: this.config.slowOperationThreshold
      });
    }
  }

  private startResourceMonitoring(): void {
    if (this.resourceMonitoringTimer) return;

    this.resourceMonitoringTimer = setInterval(() => {
      const usage: ResourceUsage = {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };

      this.resourceMetrics.push(usage);
      this.emit('resource_usage', usage);

      // Keep only recent metrics
      const cutoff = Date.now() - this.config.retentionPeriod;
      this.resourceMetrics = this.resourceMetrics.filter(
        metric => metric.memory.heapUsed > 0
      );
    }, this.config.resourceMonitoringInterval);
  }

  private startPeriodicCleanup(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - this.config.retentionPeriod;
      for (const [key, metric] of this.metrics.entries()) {
        if (metric.startTime < cutoff) {
          this.metrics.delete(key);
        }
      }
    }, this.config.cleanupInterval);
  }

  getMetrics() {
    const metrics = Array.from(this.metrics.values());
    const completedMetrics = metrics.filter(m => m.endTime !== undefined);

    const totalOperations = completedMetrics.length;
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;
    const successCount = completedMetrics.filter(m => m.success).length;
    const successRate = totalOperations > 0 ? successCount / totalOperations : 0;

    const operationCounts: Record<string, number> = {};
    for (const metric of completedMetrics) {
      operationCounts[metric.operation] = (operationCounts[metric.operation] || 0) + 1;
    }

    return {
      metrics,
      resourceMetrics: this.resourceMetrics,
      summary: {
        totalOperations,
        averageDuration,
        successRate,
        operationCounts,
        activeOperations: this.activeOperations.size,
        currentMemoryUsage: process.memoryUsage()
      }
    };
  }

  async shutdown(): Promise<void> {
    if (this.resourceMonitoringTimer) {
      clearInterval(this.resourceMonitoringTimer);
      this.resourceMonitoringTimer = undefined;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.metrics.clear();
    this.resourceMetrics = [];
    this.activeOperations.clear();
    this.removeAllListeners();
  }
} 