import { Socket } from 'socket.io-client';
import { ConnectionPoolConfig, PoolMetrics, HealthStatus } from './websocket-context';

interface PooledSocket {
  socket: Socket;
  lastUsed: number;
  isIdle: boolean;
  healthStatus: HealthStatus;
  metrics: {
    totalMessages: number;
    errorCount: number;
    lastHealthCheck: number;
    responseTime: number[];
  };
}

export class ConnectionPool {
  private pool: Map<string, PooledSocket>;
  private config: ConnectionPoolConfig;
  private metrics: PoolMetrics;
  private cleanupInterval: NodeJS.Timeout;
  private healthCheckInterval: NodeJS.Timeout;
  private warmupPromise: Promise<void> | null = null;

  constructor(config: ConnectionPoolConfig) {
    this.pool = new Map();
    this.config = {
      maxConnections: config.maxConnections || 5,
      idleTimeout: config.idleTimeout || 30000,
      acquireTimeout: config.acquireTimeout || 5000,
      healthCheckInterval: config.healthCheckInterval || 10000,
      minConnections: config.minConnections || 2
    };
    this.metrics = {
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalConnections: 0,
      acquireTime: [],
      releaseTime: [],
      healthStatus: {},
      averageResponseTime: 0,
      errorRate: 0
    };

    this.cleanupInterval = setInterval(() => this.cleanup(), 5000);
    this.healthCheckInterval = setInterval(() => this.checkHealth(), this.config.healthCheckInterval);
    
    // Initialize minimum connections
    this.warmup();
  }

  private async warmup(): Promise<void> {
    if (this.warmupPromise) return this.warmupPromise;

    this.warmupPromise = new Promise(async (resolve) => {
      const connectionsNeeded = this.config.minConnections - this.pool.size;
      if (connectionsNeeded <= 0) {
        resolve();
        return;
      }

      const warmupConnections = Array(connectionsNeeded).fill(null).map(() => 
        this.createConnection()
      );

      await Promise.all(warmupConnections);
      resolve();
    });

    return this.warmupPromise;
  }

  private async createConnection(): Promise<Socket> {
    const socket = new Socket();
    const id = this.getSocketId(socket);
    
    this.pool.set(id, {
      socket,
      lastUsed: Date.now(),
      isIdle: true,
      healthStatus: 'healthy',
      metrics: {
        totalMessages: 0,
        errorCount: 0,
        lastHealthCheck: Date.now(),
        responseTime: []
      }
    });

    // Set up metrics collection
    socket.on('message', () => {
      const pooledSocket = this.pool.get(id);
      if (pooledSocket) {
        pooledSocket.metrics.totalMessages++;
      }
    });

    socket.on('error', () => {
      const pooledSocket = this.pool.get(id);
      if (pooledSocket) {
        pooledSocket.metrics.errorCount++;
      }
    });

    return socket;
  }

  async acquire(): Promise<Socket | null> {
    this.metrics.waitingRequests++;
    const startTime = Date.now();

    try {
      await this.warmup();

      // Try to find a healthy idle connection
      for (const [id, pooledSocket] of this.pool.entries()) {
        if (pooledSocket.isIdle && pooledSocket.healthStatus === 'healthy') {
          pooledSocket.isIdle = false;
          pooledSocket.lastUsed = Date.now();
          this.metrics.idleConnections--;
          this.metrics.activeConnections++;
          this.metrics.acquireTime.push(Date.now() - startTime);
          this.metrics.waitingRequests--;
          return pooledSocket.socket;
        }
      }

      // If pool is not full, create a new connection
      if (this.pool.size < this.config.maxConnections) {
        return null; // Let the provider create a new socket
      }

      // Wait for a connection to become available
      return await this.waitForConnection();
    } catch (error) {
      console.error('Failed to acquire connection:', error);
      this.metrics.waitingRequests--;
      throw error;
    }
  }

  private async checkHealth(): Promise<void> {
    const now = Date.now();
    const healthChecks = Array.from(this.pool.entries()).map(async ([id, pooledSocket]) => {
      try {
        const startTime = Date.now();
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Health check timeout')), 5000);
          
          pooledSocket.socket.emit('ping', () => {
            clearTimeout(timeout);
            resolve(void 0);
          });
        });

        const responseTime = Date.now() - startTime;
        pooledSocket.metrics.responseTime.push(responseTime);
        pooledSocket.metrics.lastHealthCheck = now;
        pooledSocket.healthStatus = 'healthy';

        // Update pool metrics
        this.updatePoolMetrics(id, pooledSocket);
      } catch (error) {
        console.error(`Health check failed for connection ${id}:`, error);
        pooledSocket.healthStatus = 'unhealthy';
        this.metrics.healthStatus[id] = 'unhealthy';
      }
    });

    await Promise.all(healthChecks);
  }

  private updatePoolMetrics(id: string, pooledSocket: PooledSocket): void {
    // Calculate average response time
    const avgResponseTime = pooledSocket.metrics.responseTime.reduce((a, b) => a + b, 0) / 
      pooledSocket.metrics.responseTime.length;

    // Calculate error rate
    const errorRate = pooledSocket.metrics.errorCount / 
      (pooledSocket.metrics.totalMessages || 1);

    // Update metrics
    this.metrics.healthStatus[id] = pooledSocket.healthStatus;
    this.metrics.averageResponseTime = avgResponseTime;
    this.metrics.errorRate = errorRate;
  }

  release(socket: Socket): void {
    const startTime = Date.now();
    const id = this.getSocketId(socket);
    const pooledSocket = this.pool.get(id);

    if (pooledSocket) {
      pooledSocket.isIdle = true;
      pooledSocket.lastUsed = Date.now();
      this.metrics.activeConnections--;
      this.metrics.idleConnections++;
      this.metrics.releaseTime.push(Date.now() - startTime);
    }
  }

  add(socket: Socket): void {
    const id = this.getSocketId(socket);
    this.pool.set(id, {
      socket,
      lastUsed: Date.now(),
      isIdle: false
    });
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
  }

  private getSocketId(socket: Socket): string {
    return socket.id || Math.random().toString(36).substring(2);
  }

  private async waitForConnection(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);

      const checkInterval = setInterval(() => {
        for (const [id, pooledSocket] of this.pool.entries()) {
          if (pooledSocket.isIdle) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            pooledSocket.isIdle = false;
            pooledSocket.lastUsed = Date.now();
            this.metrics.idleConnections--;
            this.metrics.activeConnections++;
            resolve(pooledSocket.socket);
            return;
          }
        }
      }, 100);
    });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, pooledSocket] of this.pool.entries()) {
      if (pooledSocket.isIdle && now - pooledSocket.lastUsed > this.config.idleTimeout) {
        pooledSocket.socket.disconnect();
        this.pool.delete(id);
        this.metrics.idleConnections--;
        this.metrics.totalConnections--;
      }
    }
  }

  getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    clearInterval(this.healthCheckInterval);
    for (const [id, pooledSocket] of this.pool.entries()) {
      pooledSocket.socket.disconnect();
    }
    this.pool.clear();
    this.resetMetrics();
  }

  private resetMetrics(): void {
    this.metrics = {
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalConnections: 0,
      acquireTime: [],
      releaseTime: [],
      healthStatus: {},
      averageResponseTime: 0,
      errorRate: 0
    };
  }
} 