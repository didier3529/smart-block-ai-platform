import { EventEmitter } from 'events';
import { SubscriptionManager } from '../adapters/websocket/SubscriptionManager';

interface WebSocketContext {
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
  unsubscribe: (channel: string, callback?: (data: any) => void) => void;
  isConnected: boolean;
}

export interface NotificationConfig {
  maxRetries?: number;
  retryDelay?: number;
  defaultPriority?: NotificationPriority;
  defaultTTL?: number;
  batchSize?: number;
  batchDelay?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export enum NotificationPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum NotificationCategory {
  BLOCKCHAIN = 'blockchain',
  SECURITY = 'security',
  PRICE = 'price',
  SYSTEM = 'system',
  MARKET = 'market',
  CUSTOM = 'custom'
}

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  variables: string[];
  version: number;
}

export interface Notification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: any;
  timestamp: number;
  ttl?: number;
  read?: boolean;
  delivered?: boolean;
  error?: string;
  retryCount?: number;
}

export class NotificationService extends EventEmitter {
  private static instance: NotificationService;
  private wsContext: WebSocketContext;
  private subscriptionManager: SubscriptionManager;
  private config: Required<NotificationConfig>;
  private templates: Map<string, NotificationTemplate>;
  private notifications: Map<string, Notification>;
  private queue: Notification[];
  private isProcessing: boolean;
  private retryCount: Map<string, number>;
  private reconnectAttempts: number;
  private reconnectTimeout: NodeJS.Timeout | null;
  private unsubscribeCallback: (() => void) | null;

  private constructor(wsContext: WebSocketContext, config: NotificationConfig = {}) {
    super();
    this.wsContext = wsContext;
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      defaultPriority: config.defaultPriority || NotificationPriority.MEDIUM,
      defaultTTL: config.defaultTTL || 24 * 60 * 60 * 1000, // 24 hours
      batchSize: config.batchSize || 10,
      batchDelay: config.batchDelay || 100,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5
    };
    
    this.subscriptionManager = new SubscriptionManager({
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay
    });
    
    this.templates = new Map();
    this.notifications = new Map();
    this.queue = [];
    this.isProcessing = false;
    this.retryCount = new Map();
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.unsubscribeCallback = null;

    this.setupEventListeners();
  }

  public static getInstance(wsContext: WebSocketContext, config?: NotificationConfig): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService(wsContext, config);
    }
    return NotificationService.instance;
  }

  private setupEventListeners(): void {
    // Handle WebSocket connection state changes
    this.handleConnectionStateChange(this.wsContext.connectionState);

    // Subscribe to notifications channel
    this.subscribeToNotifications();

    // Monitor WebSocket connection state
    this.monitorConnectionState();
  }

  private handleConnectionStateChange(state: string): void {
    this.emit('connectionStateChange', state);
    
    switch (state) {
      case 'connected':
        this.reconnectAttempts = 0;
        this.subscriptionManager.setConnectionState('connected');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.processQueue();
        break;
      
      case 'disconnected':
        this.subscriptionManager.setConnectionState('disconnected');
        this.handleDisconnection();
        break;
      
      case 'error':
        this.subscriptionManager.setConnectionState('disconnected');
        this.handleError(new Error('WebSocket connection error'));
        break;
    }
  }

  private handleDisconnection(): void {
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => {
        this.attemptReconnection();
      }, this.config.reconnectInterval);
    } else {
      this.emit('error', new Error('Max reconnection attempts reached'));
    }
  }

  private attemptReconnection(): void {
    if (this.wsContext.isConnected) {
      this.subscribeToNotifications();
    } else {
      this.handleDisconnection();
    }
  }

  private subscribeToNotifications(): void {
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
    }

    this.unsubscribeCallback = this.wsContext.subscribe('notifications', (data) => {
      this.handleNotificationEvent(data);
    });
  }

  private monitorConnectionState(): void {
    // Clean up existing subscription if any
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
    }

    // Subscribe to connection state changes
    this.unsubscribeCallback = this.wsContext.subscribe('connection_state', (state) => {
      this.handleConnectionStateChange(state);
    });
  }

  private handleNotificationEvent(data: any): void {
    try {
      switch (data.type) {
        case 'new':
          this.handleNewNotification(data.notification);
          break;
        case 'update':
          this.handleNotificationUpdate(data.notification);
          break;
        case 'error':
          this.handleError(new Error(data.message));
          break;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    console.error('Notification error:', error);
    this.emit('error', error);
  }

  private handleNewNotification(notification: Notification): void {
    this.notifications.set(notification.id, notification);
    this.emit('delivered', notification);
  }

  private handleNotificationUpdate(notification: Notification): void {
    const existing = this.notifications.get(notification.id);
    if (existing) {
      this.notifications.set(notification.id, { ...existing, ...notification });
      this.emit('updated', notification);
    }
  }

  public async createTemplate(template: Omit<NotificationTemplate, 'id' | 'version'>): Promise<NotificationTemplate> {
    const id = crypto.randomUUID();
    const newTemplate: NotificationTemplate = {
      ...template,
      id,
      version: 1
    };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  public async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    const updatedTemplate: NotificationTemplate = {
      ...template,
      ...updates,
      version: template.version + 1
    };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  public async createNotification(
    templateId: string,
    variables: Record<string, string>,
    options: Partial<Notification> = {}
  ): Promise<Notification> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let body = template.body;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(`{${key}}`, value);
    }

    const notification: Notification = {
      id: crypto.randomUUID(),
      category: template.category,
      priority: options.priority || this.config.defaultPriority,
      title: template.title,
      body,
      data: options.data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.defaultTTL,
      read: false,
      delivered: false
    };

    this.notifications.set(notification.id, notification);
    this.queue.push(notification);
    this.sortQueue();

    if (!this.isProcessing) {
      this.processQueue();
    }

    return notification;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const priorityOrder = {
        [NotificationPriority.HIGH]: 0,
        [NotificationPriority.MEDIUM]: 1,
        [NotificationPriority.LOW]: 2
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.wsContext.isConnected) {
      return;
    }

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.config.batchSize);
      try {
        await this.deliverBatch(batch);
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
      } catch (error) {
        this.handleDeliveryError(batch, error);
      }
    }
    this.isProcessing = false;
  }

  private async deliverBatch(notifications: Notification[]): Promise<void> {
    const deliveryPromises = notifications.map(notification => 
      this.deliverNotification(notification)
    );
    await Promise.all(deliveryPromises);
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      this.subscriptionManager.publish('notification', notification);
      notification.delivered = true;
      this.emit('delivered', notification);
    } catch (error) {
      notification.error = error instanceof Error ? error.message : 'Delivery failed';
      this.emit('error', error);
      throw error;
    }
  }

  private handleDeliveryError(batch: Notification[], error: Error): void {
    this.emit('error', { batch, error });
    batch.forEach(notification => {
      const retryCount = this.retryCount.get(notification.id) || 0;
      if (retryCount < this.config.maxRetries) {
        this.retryCount.set(notification.id, retryCount + 1);
        this.queue.unshift(notification);
      } else {
        notification.error = error.message;
        this.emit('deliveryFailed', { notification, error });
      }
    });
  }

  public markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.emit('read', notification);
    }
  }

  public getNotification(notificationId: string): Notification | undefined {
    return this.notifications.get(notificationId);
  }

  public getNotificationsByCategory(category: NotificationCategory): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.category === category)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public getUnreadNotifications(): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => !n.read)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public clearNotifications(category?: NotificationCategory): void {
    if (category) {
      for (const [id, notification] of this.notifications.entries()) {
        if (notification.category === category) {
          this.notifications.delete(id);
        }
      }
    } else {
      this.notifications.clear();
    }
    this.emit('cleared', { category });
  }

  public cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
    }
    this.subscriptionManager.cleanup();
    this.removeAllListeners();
    this.queue = [];
    NotificationService.instance = null;
  }
} 