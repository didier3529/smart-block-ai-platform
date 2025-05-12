import { EventEmitter } from 'events';

export interface DataSourceConfig {
  apiKey?: string;
  apiUrl?: string;
  wsUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface DataSourceMetrics {
  requestCount: number;
  errorCount: number;
  latency: number;
  lastError?: Error;
  lastRequest?: Date;
}

export abstract class BaseDataSource extends EventEmitter {
  protected config: DataSourceConfig;
  protected metrics: DataSourceMetrics;
  protected isConnected: boolean;

  constructor(config: DataSourceConfig) {
    super();
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...config
    };

    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      latency: 0
    };

    this.isConnected = false;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isHealthy(): Promise<boolean>;

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempts: number = this.config.retryAttempts!
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < attempts; i++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        
        // Update metrics
        this.metrics.requestCount++;
        this.metrics.latency = Date.now() - startTime;
        this.metrics.lastRequest = new Date();
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.metrics.errorCount++;
        this.metrics.lastError = lastError;
        
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  public getMetrics(): DataSourceMetrics {
    return { ...this.metrics };
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  protected handleError(error: Error, context: string): void {
    this.emit('error', {
      error,
      context,
      timestamp: new Date(),
      metrics: this.getMetrics()
    });
  }

  protected validateConfig(): void {
    if (this.config.apiKey && typeof this.config.apiKey !== 'string') {
      throw new Error('Invalid API key configuration');
    }

    if (this.config.apiUrl && typeof this.config.apiUrl !== 'string') {
      throw new Error('Invalid API URL configuration');
    }

    if (this.config.wsUrl && typeof this.config.wsUrl !== 'string') {
      throw new Error('Invalid WebSocket URL configuration');
    }
  }
} 