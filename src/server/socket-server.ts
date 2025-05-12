import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import { performance } from 'perf_hooks';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/socket-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/socket.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

interface ServerMetrics {
  connections: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  avgResponseTime: number;
  activeSubscriptions: Map<string, number>;
  lastHealthCheck: Date;
}

interface SessionData {
  userId: string;
  authenticated: boolean;
  subscriptions: Set<string>;
  lastActivity: number;
  rateLimits: {
    messages: number;
    lastReset: number;
  };
}

interface NotificationHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  maxBatchSize: number;
  rateLimitWindow: number;
  maxNotificationsPerWindow: number;
}

export class SocketServer {
  private io: Server;
  private metrics: ServerMetrics;
  private sessions: Map<string, SessionData>;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly MESSAGE_RATE_LIMIT = 100; // messages per minute
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly SESSION_TIMEOUT = 1800000; // 30 minutes
  private notificationConfig: NotificationHandlerConfig;
  private notificationRateLimits: Map<string, { count: number; timestamp: number }>;

  constructor(httpServer: HttpServer) {
    this.setupRedis();
    this.initializeServer(httpServer);
    this.initializeMetrics();
    this.sessions = new Map();

    this.notificationConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      maxBatchSize: 10,
      rateLimitWindow: 60000, // 1 minute
      maxNotificationsPerWindow: 100
    };
    
    this.notificationRateLimits = new Map();

    // Start periodic tasks
    setInterval(() => this.cleanupSessions(), 300000); // Every 5 minutes
    setInterval(() => this.checkHealth(), 30000); // Every 30 seconds
    setInterval(() => this.reportMetrics(), 60000); // Every minute
  }

  private async setupRedis() {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.io.adapter(createAdapter(pubClient, subClient));

      logger.info('Redis adapter configured successfully');
    } catch (error) {
      logger.error('Redis setup failed:', error);
    }
  }

  private initializeServer(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.ALLOWED_ORIGINS?.split(',') 
          : '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 10000,
      pingInterval: 25000
    });

    this.io.use(this.authMiddleware.bind(this));
    this.setupEventHandlers();
  }

  private initializeMetrics(): void {
    this.metrics = {
      connections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      avgResponseTime: 0,
      activeSubscriptions: new Map(),
      lastHealthCheck: new Date()
    };
  }

  private async authMiddleware(socket: Socket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      
      // Initialize session
      this.sessions.set(socket.id, {
        userId: decoded.userId,
        authenticated: true,
        subscriptions: new Set(),
        lastActivity: Date.now(),
        rateLimits: {
          messages: 0,
          lastReset: Date.now()
        }
      });

      next();
    } catch (error) {
      logger.error('Authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);

      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('subscribe', (channel: string) => this.handleSubscribe(socket, channel));
      socket.on('unsubscribe', (channel: string) => this.handleUnsubscribe(socket, channel));
      socket.on('message', (data: any) => this.handleMessage(socket, data));
      socket.on('error', (error: Error) => this.handleError(socket, error));

      // Handle notification subscription
      socket.on('subscribe:notifications', async (categories: string[]) => {
        try {
          await this.handleNotificationSubscription(socket, categories);
        } catch (error) {
          this.handleError(socket, error);
        }
      });

      // Handle notification acknowledgment
      socket.on('notification:ack', async (notificationId: string) => {
        try {
          await this.handleNotificationAcknowledgment(socket, notificationId);
        } catch (error) {
          this.handleError(socket, error);
        }
      });
    });
  }

  private handleConnection(socket: Socket): void {
    this.metrics.connections++;
    logger.info(`Client connected: ${socket.id}`);

    // Send initial state if needed
    socket.emit('connection_established', {
      id: socket.id,
      timestamp: Date.now()
    });
  }

  private handleDisconnect(socket: Socket): void {
    const session = this.sessions.get(socket.id);
    if (session) {
      // Cleanup subscriptions
      session.subscriptions.forEach(channel => {
        this.metrics.activeSubscriptions.set(
          channel,
          (this.metrics.activeSubscriptions.get(channel) || 1) - 1
        );
      });
      this.sessions.delete(socket.id);
    }

    this.metrics.connections--;
    logger.info(`Client disconnected: ${socket.id}`);
  }

  private async handleSubscribe(socket: Socket, channel: string): Promise<void> {
    const session = this.sessions.get(socket.id);
    if (!session) return;

    try {
      const start = performance.now();
      
      // Join the channel
      await socket.join(channel);
      session.subscriptions.add(channel);
      
      // Update metrics
      this.metrics.activeSubscriptions.set(
        channel,
        (this.metrics.activeSubscriptions.get(channel) || 0) + 1
      );
      
      const end = performance.now();
      this.updateResponseTime(end - start);

      logger.info(`Client ${socket.id} subscribed to ${channel}`);
    } catch (error) {
      this.handleError(socket, error as Error);
    }
  }

  private async handleUnsubscribe(socket: Socket, channel: string): Promise<void> {
    const session = this.sessions.get(socket.id);
    if (!session) return;

    try {
      await socket.leave(channel);
      session.subscriptions.delete(channel);
      
      // Update metrics
      this.metrics.activeSubscriptions.set(
        channel,
        (this.metrics.activeSubscriptions.get(channel) || 1) - 1
      );

      logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
    } catch (error) {
      this.handleError(socket, error as Error);
    }
  }

  private async handleMessage(socket: Socket, data: any): Promise<void> {
    const session = this.sessions.get(socket.id);
    if (!session) return;

    try {
      // Check rate limits
      if (!this.checkRateLimit(session)) {
        throw new Error('Rate limit exceeded');
      }

      const start = performance.now();
      
      // Process and broadcast message
      this.metrics.messagesReceived++;
      await this.processMessage(socket, data);
      
      const end = performance.now();
      this.updateResponseTime(end - start);
    } catch (error) {
      this.handleError(socket, error as Error);
    }
  }

  private handleError(socket: Socket, error: Error): void {
    this.metrics.errors++;
    logger.error(`Error for client ${socket.id}:`, error);
    
    // Notify client
    socket.emit('error', {
      message: 'An error occurred',
      code: error.name,
      timestamp: Date.now()
    });
  }

  private checkRateLimit(session: SessionData): boolean {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - session.rateLimits.lastReset > this.RATE_LIMIT_WINDOW) {
      session.rateLimits.messages = 0;
      session.rateLimits.lastReset = now;
    }

    // Check limit
    if (session.rateLimits.messages >= this.MESSAGE_RATE_LIMIT) {
      return false;
    }

    session.rateLimits.messages++;
    return true;
  }

  private async processMessage(socket: Socket, data: any): Promise<void> {
    // Add message processing logic here
    // For now, just broadcast to the specified channel
    if (data.channel && typeof data.payload !== 'undefined') {
      socket.to(data.channel).emit('message', {
        channel: data.channel,
        payload: data.payload,
        timestamp: Date.now(),
        sender: socket.id
      });
      this.metrics.messagesSent++;
    }
  }

  private updateResponseTime(duration: number): void {
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2;
  }

  private cleanupSessions(): void {
    const now = Date.now();
    for (const [socketId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
        this.sessions.delete(socketId);
      }
    }
  }

  private checkHealth(): void {
    this.metrics.lastHealthCheck = new Date();
    
    // Broadcast health status to monitoring clients
    this.io.to('monitoring').emit('health_status', {
      status: 'healthy',
      timestamp: Date.now(),
      metrics: {
        connections: this.metrics.connections,
        messagesSent: this.metrics.messagesSent,
        messagesReceived: this.metrics.messagesReceived,
        errors: this.metrics.errors,
        avgResponseTime: this.metrics.avgResponseTime
      }
    });
  }

  private reportMetrics(): void {
    logger.info('Server metrics:', {
      connections: this.metrics.connections,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      errors: this.metrics.errors,
      avgResponseTime: this.metrics.avgResponseTime,
      activeSubscriptions: Object.fromEntries(this.metrics.activeSubscriptions)
    });
  }

  private async handleNotificationSubscription(socket: Socket, categories: string[]): Promise<void> {
    const clientId = socket.data.clientId;
    
    // Validate categories
    const validCategories = categories.filter(category => 
      Object.values(NotificationCategory).includes(category as NotificationCategory)
    );

    // Join notification rooms for each category
    for (const category of validCategories) {
      await socket.join(`notifications:${category}`);
    }

    // Store subscription info
    await this.redis.sadd(`client:${clientId}:notifications`, ...validCategories);
    
    socket.emit('subscribed:notifications', {
      categories: validCategories,
      timestamp: Date.now()
    });
  }

  private async handleNotificationAcknowledgment(socket: Socket, notificationId: string): Promise<void> {
    const clientId = socket.data.clientId;
    
    // Mark notification as acknowledged in Redis
    await this.redis.sadd(`notifications:${notificationId}:acks`, clientId);
    
    socket.emit('notification:acked', {
      id: notificationId,
      timestamp: Date.now()
    });
  }

  public async broadcastNotification(notification: Notification): Promise<void> {
    try {
      // Check rate limits
      if (!this.checkNotificationRateLimit(notification.category)) {
        throw new Error(`Rate limit exceeded for category: ${notification.category}`);
      }

      // Store notification in Redis
      const notificationKey = `notification:${notification.id}`;
      await this.redis.set(notificationKey, JSON.stringify(notification));
      
      // Set TTL if specified
      if (notification.ttl) {
        await this.redis.expire(notificationKey, Math.floor(notification.ttl / 1000));
      }

      // Broadcast to relevant room
      this.io.to(`notifications:${notification.category}`).emit('notification', notification);

      // Track metrics
      this.metrics.notifications++;
      
    } catch (error) {
      this.logger.error('Failed to broadcast notification:', error);
      throw error;
    }
  }

  private checkNotificationRateLimit(category: string): boolean {
    const now = Date.now();
    const limit = this.notificationRateLimits.get(category);

    if (!limit) {
      this.notificationRateLimits.set(category, {
        count: 1,
        timestamp: now
      });
      return true;
    }

    if (now - limit.timestamp > this.notificationConfig.rateLimitWindow) {
      // Reset window
      this.notificationRateLimits.set(category, {
        count: 1,
        timestamp: now
      });
      return true;
    }

    if (limit.count >= this.notificationConfig.maxNotificationsPerWindow) {
      return false;
    }

    // Increment count
    limit.count++;
    return true;
  }
} 