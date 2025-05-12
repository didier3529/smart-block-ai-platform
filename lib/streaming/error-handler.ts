import { EventEmitter } from 'events';
import { PerformanceMonitor } from '../performance/monitor';

interface ErrorConfig {
  maxRetries?: number;
  retryDelay?: number;
  errorThreshold?: number;
  recoveryWindow?: number;
  circuitBreakerTimeout?: number;
}

interface ErrorMetrics {
  totalErrors: number;
  retryAttempts: number;
  recoverySuccess: number;
  circuitBreakerTrips: number;
  errorRate: number;
  averageRecoveryTime: number;
}

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorContext {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  retryCount: number;
  error: Error;
  metadata?: Record<string, any>;
}

export class ErrorHandler extends EventEmitter {
  private errors: Map<string, ErrorContext>;
  private performanceMonitor: PerformanceMonitor;
  private metrics: ErrorMetrics;
  private config: Required<ErrorConfig>;
  private circuitBreakers: Map<string, boolean>;
  private errorCounts: Map<string, number>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: ErrorConfig = {}) {
    super();
    this.errors = new Map();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.circuitBreakers = new Map();
    this.errorCounts = new Map();

    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      errorThreshold: config.errorThreshold || 5,
      recoveryWindow: config.recoveryWindow || 60000,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 30000
    };

    this.metrics = {
      totalErrors: 0,
      retryAttempts: 0,
      recoverySuccess: 0,
      circuitBreakerTrips: 0,
      errorRate: 0,
      averageRecoveryTime: 0
    };

    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async handleError(
    id: string,
    error: Error,
    severity: ErrorSeverity = 'medium',
    metadata?: Record<string, any>
  ): Promise<void> {
    const startTime = this.performanceMonitor.startOperation('errorHandler.handle');

    try {
      // Check circuit breaker
      if (this.isCircuitBroken(id)) {
        this.emit('error:blocked', { id, error, reason: 'circuit_breaker' });
        return;
      }

      this.metrics.totalErrors++;
      this.updateErrorRate();

      const context: ErrorContext = {
        id,
        timestamp: Date.now(),
        severity,
        retryCount: 0,
        error,
        metadata
      };

      this.errors.set(id, context);
      this.incrementErrorCount(id);

      // Check if we need to trip the circuit breaker
      if (this.shouldTripCircuitBreaker(id)) {
        this.tripCircuitBreaker(id);
        return;
      }

      // Emit error event
      this.emit('error:new', { id, error, severity, metadata });

      // Handle based on severity
      switch (severity) {
        case 'critical':
          await this.handleCriticalError(context);
          break;
        case 'high':
          await this.handleHighSeverityError(context);
          break;
        case 'medium':
          await this.handleMediumSeverityError(context);
          break;
        case 'low':
          await this.handleLowSeverityError(context);
          break;
      }

      this.performanceMonitor.endOperation('errorHandler.handle', startTime);
    } catch (handlingError) {
      this.performanceMonitor.endOperation('errorHandler.handle', startTime, handlingError as Error);
      throw handlingError;
    }
  }

  private async handleCriticalError(context: ErrorContext): Promise<void> {
    // Immediate notification and no retry
    this.emit('error:critical', {
      id: context.id,
      error: context.error,
      metadata: context.metadata
    });

    // Trip circuit breaker immediately
    this.tripCircuitBreaker(context.id);
  }

  private async handleHighSeverityError(context: ErrorContext): Promise<void> {
    if (context.retryCount < this.config.maxRetries) {
      await this.retryWithBackoff(context);
    } else {
      this.emit('error:max_retries', {
        id: context.id,
        error: context.error,
        retries: context.retryCount
      });
    }
  }

  private async handleMediumSeverityError(context: ErrorContext): Promise<void> {
    if (context.retryCount < this.config.maxRetries * 2) {
      await this.retryWithBackoff(context);
    } else {
      this.emit('error:max_retries', {
        id: context.id,
        error: context.error,
        retries: context.retryCount
      });
    }
  }

  private async handleLowSeverityError(context: ErrorContext): Promise<void> {
    // Log and continue, no retry needed
    this.emit('error:low', {
      id: context.id,
      error: context.error,
      metadata: context.metadata
    });
  }

  private async retryWithBackoff(context: ErrorContext): Promise<void> {
    const retryDelay = this.calculateRetryDelay(context.retryCount);
    context.retryCount++;
    this.metrics.retryAttempts++;

    this.emit('error:retry', {
      id: context.id,
      error: context.error,
      attempt: context.retryCount,
      delay: retryDelay
    });

    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Emit retry complete event
    this.emit('error:retry_complete', {
      id: context.id,
      attempt: context.retryCount
    });
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay;
    const maxDelay = baseDelay * Math.pow(2, this.config.maxRetries);
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85 and 1.15

    return Math.min(exponentialDelay * jitter, maxDelay);
  }

  private isCircuitBroken(id: string): boolean {
    return this.circuitBreakers.get(id) || false;
  }

  private incrementErrorCount(id: string): void {
    const count = (this.errorCounts.get(id) || 0) + 1;
    this.errorCounts.set(id, count);
  }

  private shouldTripCircuitBreaker(id: string): boolean {
    const errorCount = this.errorCounts.get(id) || 0;
    return errorCount >= this.config.errorThreshold;
  }

  private tripCircuitBreaker(id: string): void {
    this.circuitBreakers.set(id, true);
    this.metrics.circuitBreakerTrips++;

    this.emit('circuit_breaker:trip', { id });

    // Schedule circuit breaker reset
    setTimeout(() => this.resetCircuitBreaker(id), this.config.circuitBreakerTimeout);
  }

  private resetCircuitBreaker(id: string): void {
    this.circuitBreakers.set(id, false);
    this.errorCounts.set(id, 0);

    this.emit('circuit_breaker:reset', { id });
  }

  private updateErrorRate(): void {
    const now = Date.now();
    const windowStart = now - this.config.recoveryWindow;
    
    // Count errors in the current window
    let recentErrors = 0;
    for (const error of this.errors.values()) {
      if (error.timestamp >= windowStart) {
        recentErrors++;
      }
    }

    this.metrics.errorRate = recentErrors / (this.config.recoveryWindow / 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.recoveryWindow;

    // Clean up old errors
    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < windowStart) {
        this.errors.delete(id);
      }
    }

    // Clean up old error counts
    for (const [id, count] of this.errorCounts.entries()) {
      if (count === 0) {
        this.errorCounts.delete(id);
      }
    }

    // Clean up resolved circuit breakers
    for (const [id, broken] of this.circuitBreakers.entries()) {
      if (!broken) {
        this.circuitBreakers.delete(id);
      }
    }
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  getErrorContext(id: string): ErrorContext | undefined {
    return this.errors.get(id);
  }

  cleanup(): void {
    clearInterval(this.cleanupInterval);
    this.errors.clear();
    this.circuitBreakers.clear();
    this.errorCounts.clear();
  }
} 