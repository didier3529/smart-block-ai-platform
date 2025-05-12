import { Socket } from 'socket.io-client';
import { createContext, useContext } from 'react';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';
export type SecurityStatus = 'authenticated' | 'unauthenticated' | 'blocked';

export type EventHandler = (data: any) => void;

export interface SecurityMetrics {
  activeConnections: number;
  blockedConnections: number;
  rateLimitedMessages: number;
  activeSubscriptions: Record<string, number>;
  authenticationFailures: number;
}

export interface WebSocketContextType {
  socket: Socket | null;
  connectionState: ConnectionState;
  healthStatus: HealthStatus;
  securityStatus: SecurityStatus;
  metrics: {
    pool: PoolMetrics;
    security: SecurityMetrics;
  };
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  subscribe: (event: string, handler: EventHandler) => void;
  unsubscribe: (event: string) => void;
  emit: (event: string, data: any, priority?: 'high' | 'normal' | 'low') => Promise<void>;
  emitWithAck: <T>(event: string, data: any, timeout?: number) => Promise<T>;
  authenticate: (token: string) => Promise<boolean>;
  deauthenticate: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export interface WebSocketConfig {
  url: string;
  options: {
    path: string;
    transports: string[];
    reconnectionAttempts: number;
    reconnectionDelay: number;
    timeout: number;
    healthCheckInterval: number;
    minConnections: number;
    auth?: {
      token?: string;
    };
    security?: {
      rateLimits?: {
        connection: number;
        message: number;
        subscription: number;
      };
      ipRateLimits?: {
        connection: number;
        message: number;
      };
      maxSubscriptionsPerClient?: number;
      tokenExpirySeconds?: number;
    };
  };
}

export interface Message {
  id: string;
  event: string;
  data: any;
  timestamp: number;
  priority?: 'high' | 'normal' | 'low';
  security?: {
    clientId: string;
    ip: string;
  };
}

export interface StateSubscriber {
  id: string;
  callback: (value: any) => void;
}

export interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  acquireTimeout: number;
  healthCheckInterval: number;
  minConnections: number;
}

export interface PoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalConnections: number;
  acquireTime: number[];
  releaseTime: number[];
  healthStatus: Record<string, HealthStatus>;
  averageResponseTime: number;
  errorRate: number;
} 