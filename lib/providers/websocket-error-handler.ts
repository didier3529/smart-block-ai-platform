import { Socket } from 'socket.io-client';
import { ConnectionState, HealthStatus } from './websocket-context';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recoveryAttempts: number;
  successfulRecoveries: number;
  lastError: {
    timestamp: number;
    type: string;
    message: string;
  } | null;
  errorRates: {
    lastMinute: number;
    lastHour: number;
    lastDay: number;
  };
}

interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  errorLogSize: number;
}

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private metrics: ErrorMetrics;
  private errorLog: Array<{
    timestamp: number;
    type: string;
    message: string;
    context?: any;
  }>;
  private retryCount: number = 0;
  private circuitBreakerOpen: boolean = false;
  private circuitBreakerTimer: NodeJS.Timeout | null = null;
  private errorRateIntervals: {
    minute: number[];
    hour: number[];
    day: number[];
  };

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 30000,
      errorLogSize: config.errorLogSize || 100
    };

    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      lastError: null,
      errorRates: {
        lastMinute: 0,
        lastHour: 0,
        lastDay: 0
      }
    };

    this.errorLog = [];
    this.errorRateIntervals = {
      minute: [],
      hour: [],
      day: []
    };

    // Start error rate calculation
    setInterval(() => this.calculateErrorRates(), 60000);
  }

  async handleError(
    error: Error,
    socket: Socket | null,
    setConnectionState: (state: ConnectionState) => void,
    setHealthStatus: (status: HealthStatus) => void,
    reconnectCallback: () => Promise<void>
  ): Promise<boolean> {
    const errorType = this.categorizeError(error);
    this.logError(errorType, error.message);

    // Check circuit breaker
    if (this.circuitBreakerOpen) {
      console.warn('Circuit breaker is open, waiting for timeout');
      return false;
    }

    // Update metrics
    this.metrics.totalErrors++;
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
    this.metrics.lastError = {
      timestamp: Date.now(),
      type: errorType,
      message: error.message
    };

    // Check if we should open circuit breaker
    if (this.shouldOpenCircuitBreaker()) {
      this.openCircuitBreaker();
      return false;
    }

    // Attempt recovery based on error type
    try {
      this.metrics.recoveryAttempts++;
      
      switch (errorType) {
        case 'connection':
          return await this.handleConnectionError(socket, setConnectionState, setHealthStatus, reconnectCallback);
        case 'timeout':
          return await this.handleTimeoutError(socket, setConnectionState, reconnectCallback);
        case 'authentication':
          return this.handleAuthenticationError(setConnectionState);
        case 'protocol':
          return await this.handleProtocolError(socket, setConnectionState, reconnectCallback);
        default:
          return await this.handleGenericError(socket, setConnectionState, reconnectCallback);
      }
    } catch (recoveryError) {
      console.error('Error during recovery:', recoveryError);
      return false;
    }
  }

  private async handleConnectionError(
    socket: Socket | null,
    setConnectionState: (state: ConnectionState) => void,
    setHealthStatus: (status: HealthStatus) => void,
    reconnectCallback: () => Promise<void>
  ): Promise<boolean> {
    if (this.retryCount >= this.config.maxRetries) {
      setConnectionState('error');
      setHealthStatus('unhealthy');
      this.retryCount = 0;
      return false;
    }

    this.retryCount++;
    setConnectionState('connecting');
    
    try {
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * this.retryCount));
      await reconnectCallback();
      this.metrics.successfulRecoveries++;
      this.retryCount = 0;
      return true;
    } catch (error) {
      return this.handleError(error as Error, socket, setConnectionState, setHealthStatus, reconnectCallback);
    }
  }

  private async handleTimeoutError(
    socket: Socket | null,
    setConnectionState: (state: ConnectionState) => void,
    reconnectCallback: () => Promise<void>
  ): Promise<boolean> {
    if (socket) {
      socket.disconnect();
    }
    setConnectionState('connecting');
    
    try {
      await reconnectCallback();
      this.metrics.successfulRecoveries++;
      return true;
    } catch {
      setConnectionState('error');
      return false;
    }
  }

  private handleAuthenticationError(
    setConnectionState: (state: ConnectionState) => void
  ): boolean {
    setConnectionState('error');
    return false; // Authentication errors require user intervention
  }

  private async handleProtocolError(
    socket: Socket | null,
    setConnectionState: (state: ConnectionState) => void,
    reconnectCallback: () => Promise<void>
  ): Promise<boolean> {
    if (socket) {
      socket.disconnect();
    }
    setConnectionState('connecting');

    try {
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      await reconnectCallback();
      this.metrics.successfulRecoveries++;
      return true;
    } catch {
      setConnectionState('error');
      return false;
    }
  }

  private async handleGenericError(
    socket: Socket | null,
    setConnectionState: (state: ConnectionState) => void,
    reconnectCallback: () => Promise<void>
  ): Promise<boolean> {
    if (this.retryCount >= this.config.maxRetries) {
      setConnectionState('error');
      this.retryCount = 0;
      return false;
    }

    this.retryCount++;
    setConnectionState('connecting');

    try {
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * this.retryCount));
      await reconnectCallback();
      this.metrics.successfulRecoveries++;
      this.retryCount = 0;
      return true;
    } catch {
      return false;
    }
  }

  private categorizeError(error: Error): string {
    if (error.message.includes('connect')) return 'connection';
    if (error.message.includes('timeout')) return 'timeout';
    if (error.message.includes('auth')) return 'authentication';
    if (error.message.includes('protocol')) return 'protocol';
    return 'unknown';
  }

  private logError(type: string, message: string, context?: any) {
    const errorEntry = {
      timestamp: Date.now(),
      type,
      message,
      context
    };

    this.errorLog.push(errorEntry);
    if (this.errorLog.length > this.config.errorLogSize) {
      this.errorLog.shift();
    }

    // Update error rate tracking
    const now = Date.now();
    this.errorRateIntervals.minute.push(now);
    this.errorRateIntervals.hour.push(now);
    this.errorRateIntervals.day.push(now);
  }

  private shouldOpenCircuitBreaker(): boolean {
    const recentErrors = this.errorRateIntervals.minute.filter(
      timestamp => Date.now() - timestamp < 60000
    ).length;

    return recentErrors >= this.config.circuitBreakerThreshold;
  }

  private openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    this.circuitBreakerTimer = setTimeout(() => {
      this.circuitBreakerOpen = false;
      this.circuitBreakerTimer = null;
    }, this.config.circuitBreakerTimeout);
  }

  private calculateErrorRates() {
    const now = Date.now();

    // Update minute rate
    this.errorRateIntervals.minute = this.errorRateIntervals.minute.filter(
      timestamp => now - timestamp < 60000
    );
    this.metrics.errorRates.lastMinute = this.errorRateIntervals.minute.length;

    // Update hour rate
    this.errorRateIntervals.hour = this.errorRateIntervals.hour.filter(
      timestamp => now - timestamp < 3600000
    );
    this.metrics.errorRates.lastHour = this.errorRateIntervals.hour.length;

    // Update day rate
    this.errorRateIntervals.day = this.errorRateIntervals.day.filter(
      timestamp => now - timestamp < 86400000
    );
    this.metrics.errorRates.lastDay = this.errorRateIntervals.day.length;
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  getErrorLog() {
    return [...this.errorLog];
  }

  clearMetrics() {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      lastError: null,
      errorRates: {
        lastMinute: 0,
        lastHour: 0,
        lastDay: 0
      }
    };
    this.errorLog = [];
    this.errorRateIntervals = {
      minute: [],
      hour: [],
      day: []
    };
  }

  destroy() {
    if (this.circuitBreakerTimer) {
      clearTimeout(this.circuitBreakerTimer);
    }
  }
} 