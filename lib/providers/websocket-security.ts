import { Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';

interface SecurityConfig {
  jwtSecret?: string;
  rateLimits: {
    connection: number;  // Max connections per minute
    message: number;     // Max messages per minute
    subscription: number; // Max subscriptions per connection
  };
  ipRateLimits: {
    connection: number;  // Max connections per IP per minute
    message: number;     // Max messages per IP per minute
  };
  maxSubscriptionsPerClient: number;
  tokenExpirySeconds: number;
}

interface SecurityMetrics {
  activeConnections: number;
  blockedConnections: number;
  rateLimitedMessages: number;
  activeSubscriptions: Record<string, number>;
  authenticationFailures: number;
  lastAuthAttempts: Record<string, number>;
  ipAddresses: Record<string, {
    connections: number;
    messages: number;
    lastReset: number;
  }>;
}

export class SecurityManager {
  private config: SecurityConfig;
  private metrics: SecurityMetrics;
  private tokenBlacklist: Set<string>;
  private connectionTimestamps: Map<string, number[]>;
  private messageTimestamps: Map<string, number[]>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      rateLimits: {
        connection: config.rateLimits?.connection || 60,
        message: config.rateLimits?.message || 100,
        subscription: config.rateLimits?.subscription || 50
      },
      ipRateLimits: {
        connection: config.ipRateLimits?.connection || 30,
        message: config.ipRateLimits?.message || 50
      },
      maxSubscriptionsPerClient: config.maxSubscriptionsPerClient || 20,
      tokenExpirySeconds: config.tokenExpirySeconds || 3600,
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET
    };

    this.metrics = {
      activeConnections: 0,
      blockedConnections: 0,
      rateLimitedMessages: 0,
      activeSubscriptions: {},
      authenticationFailures: 0,
      lastAuthAttempts: {},
      ipAddresses: {}
    };

    this.tokenBlacklist = new Set();
    this.connectionTimestamps = new Map();
    this.messageTimestamps = new Map();

    // Cleanup old data every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async authenticateConnection(socket: Socket, token: string): Promise<boolean> {
    try {
      if (!token || this.tokenBlacklist.has(token)) {
        this.metrics.authenticationFailures++;
        return false;
      }

      const decoded = await this.verifyToken(token);
      const clientId = decoded.sub as string;

      // Rate limit check for authentication attempts
      if (this.isAuthRateLimited(clientId)) {
        this.metrics.authenticationFailures++;
        return false;
      }

      // Update metrics
      this.metrics.lastAuthAttempts[clientId] = Date.now();
      
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      this.metrics.authenticationFailures++;
      return false;
    }
  }

  private async verifyToken(token: string): Promise<any> {
    if (!this.config.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, this.config.jwtSecret!, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as any);
      });
    });
  }

  canConnect(clientId: string, ip: string): boolean {
    // Check connection rate limits
    if (!this.checkConnectionRateLimit(clientId)) {
      this.metrics.blockedConnections++;
      return false;
    }

    // Check IP-based rate limits
    if (!this.checkIpRateLimit(ip, 'connection')) {
      this.metrics.blockedConnections++;
      return false;
    }

    // Update metrics
    this.recordConnection(clientId, ip);
    return true;
  }

  canSendMessage(clientId: string, ip: string): boolean {
    // Check message rate limits
    if (!this.checkMessageRateLimit(clientId)) {
      this.metrics.rateLimitedMessages++;
      return false;
    }

    // Check IP-based message rate limits
    if (!this.checkIpRateLimit(ip, 'message')) {
      this.metrics.rateLimitedMessages++;
      return false;
    }

    // Update metrics
    this.recordMessage(clientId, ip);
    return true;
  }

  private checkConnectionRateLimit(clientId: string): boolean {
    const timestamps = this.connectionTimestamps.get(clientId) || [];
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Filter timestamps within the window
    const recentConnections = timestamps.filter(ts => ts > windowStart);
    this.connectionTimestamps.set(clientId, recentConnections);

    return recentConnections.length < this.config.rateLimits.connection;
  }

  private checkMessageRateLimit(clientId: string): boolean {
    const timestamps = this.messageTimestamps.get(clientId) || [];
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Filter timestamps within the window
    const recentMessages = timestamps.filter(ts => ts > windowStart);
    this.messageTimestamps.set(clientId, recentMessages);

    return recentMessages.length < this.config.rateLimits.message;
  }

  private checkIpRateLimit(ip: string, type: 'connection' | 'message'): boolean {
    const now = Date.now();
    if (!this.metrics.ipAddresses[ip]) {
      this.metrics.ipAddresses[ip] = {
        connections: 0,
        messages: 0,
        lastReset: now
      };
    }

    const ipData = this.metrics.ipAddresses[ip];

    // Reset counters if window has passed
    if (now - ipData.lastReset > 60000) {
      ipData.connections = 0;
      ipData.messages = 0;
      ipData.lastReset = now;
    }

    const limit = this.config.ipRateLimits[type];
    const current = type === 'connection' ? ipData.connections : ipData.messages;

    return current < limit;
  }

  private recordConnection(clientId: string, ip: string) {
    // Update client connection timestamps
    const timestamps = this.connectionTimestamps.get(clientId) || [];
    timestamps.push(Date.now());
    this.connectionTimestamps.set(clientId, timestamps);

    // Update IP metrics
    this.metrics.ipAddresses[ip].connections++;
    this.metrics.activeConnections++;
  }

  private recordMessage(clientId: string, ip: string) {
    // Update client message timestamps
    const timestamps = this.messageTimestamps.get(clientId) || [];
    timestamps.push(Date.now());
    this.messageTimestamps.set(clientId, timestamps);

    // Update IP metrics
    this.metrics.ipAddresses[ip].messages++;
  }

  private isAuthRateLimited(clientId: string): boolean {
    const lastAttempt = this.metrics.lastAuthAttempts[clientId];
    if (!lastAttempt) return false;

    // Allow one attempt per second
    return Date.now() - lastAttempt < 1000;
  }

  blacklistToken(token: string) {
    this.tokenBlacklist.add(token);
  }

  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  private cleanup() {
    const now = Date.now();
    const window = 60000; // 1 minute

    // Cleanup connection timestamps
    for (const [clientId, timestamps] of this.connectionTimestamps) {
      const filtered = timestamps.filter(ts => now - ts < window);
      if (filtered.length === 0) {
        this.connectionTimestamps.delete(clientId);
      } else {
        this.connectionTimestamps.set(clientId, filtered);
      }
    }

    // Cleanup message timestamps
    for (const [clientId, timestamps] of this.messageTimestamps) {
      const filtered = timestamps.filter(ts => now - ts < window);
      if (filtered.length === 0) {
        this.messageTimestamps.delete(clientId);
      } else {
        this.messageTimestamps.set(clientId, filtered);
      }
    }

    // Cleanup IP address data
    for (const ip in this.metrics.ipAddresses) {
      if (now - this.metrics.ipAddresses[ip].lastReset > window) {
        delete this.metrics.ipAddresses[ip];
      }
    }

    // Cleanup last auth attempts
    for (const clientId in this.metrics.lastAuthAttempts) {
      if (now - this.metrics.lastAuthAttempts[clientId] > window) {
        delete this.metrics.lastAuthAttempts[clientId];
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
} 