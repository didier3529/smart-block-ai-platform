import { EventEmitter } from "events"
import WebSocket from "ws"
import { BaseDataSource } from "./BaseDataSource"
import { Cache } from "@/lib/cache"

interface MarketDataConfig {
  wsUrl: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

interface MarketUpdate {
  type: string
  data: any
  timestamp: number
}

export class MarketDataSource extends BaseDataSource {
  private ws: WebSocket | null = null
  private reconnectAttempts: number = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private subscriptions: Set<string> = new Set()
  private cache: Cache
  private metrics: {
    connectionsTotal: number
    disconnectsTotal: number
    messagesReceived: number
    messagesSent: number
    errors: number
    lastError?: Error
    lastErrorTime?: number
  }

  constructor(config: MarketDataConfig) {
    super()
    this.config = config
    this.isConnected = false
    this.cache = new Cache({
      ttl: 1000 * 60 * 5, // 5 minutes
      maxSize: 1000,
    })
    this.metrics = {
      connectionsTotal: 0,
      disconnectsTotal: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
    }
  }

  async connect(): Promise<void> {
    if (this.ws) {
      return
    }

    try {
      this.ws = new WebSocket(this.config.wsUrl!)

      this.ws.on("open", () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.metrics.connectionsTotal++
        this.emit("connected")
        
        // Start heartbeat
        this.startHeartbeat()
        
        // Resubscribe to previous subscriptions
        this.resubscribe()
      })

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString())
          this.metrics.messagesReceived++
          this.handleMessage(message)
        } catch (error) {
          this.handleError(error as Error, "WebSocket message parsing")
        }
      })

      this.ws.on("close", () => {
        this.isConnected = false
        this.metrics.disconnectsTotal++
        this.emit("disconnected")
        this.cleanup()
        this.scheduleReconnect()
      })

      this.ws.on("error", (error: Error) => {
        this.handleError(error, "WebSocket error")
        this.scheduleReconnect()
      })

    } catch (error) {
      this.handleError(error as Error, "WebSocket connection")
      this.scheduleReconnect()
      throw error
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "heartbeat" }))
        this.metrics.messagesSent++
      }
    }, this.config.heartbeatInterval)
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit("maxReconnectAttemptsReached")
      return
    }

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30000
    )

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect().catch((error) => {
        this.handleError(error, "Reconnection attempt")
      })
    }, delay)
  }

  private resubscribe(): void {
    for (const symbol of this.subscriptions) {
      this.subscribeToSymbol(symbol).catch((error) => {
        this.handleError(error, `Symbol resubscription: ${symbol}`)
      })
    }
  }

  async subscribeToSymbol(symbol: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to WebSocket")
    }

    try {
      const message = JSON.stringify({
        type: "subscribe",
        symbol,
      })

      this.ws!.send(message)
      this.metrics.messagesSent++
      this.subscriptions.add(symbol)
    } catch (error) {
      this.handleError(error as Error, `Symbol subscription: ${symbol}`)
      throw error
    }
  }

  async unsubscribeFromSymbol(symbol: string): Promise<void> {
    if (!this.isConnected) {
      return
    }

    try {
      const message = JSON.stringify({
        type: "unsubscribe",
        symbol,
      })

      this.ws!.send(message)
      this.metrics.messagesSent++
      this.subscriptions.delete(symbol)
    } catch (error) {
      this.handleError(error as Error, `Symbol unsubscription: ${symbol}`)
      throw error
    }
  }

  private handleMessage(message: MarketUpdate): void {
    try {
      // Update cache
      const cacheKey = `${message.type}-${message.data?.symbol}`
      this.cache.set(cacheKey, {
        ...message.data,
        timestamp: message.timestamp,
      })

      // Emit update event
      this.emit("marketUpdate", message)
    } catch (error) {
      this.handleError(error as Error, "Message handling")
    }
  }

  protected handleError(error: Error, context: string): void {
    this.metrics.errors++
    this.metrics.lastError = error
    this.metrics.lastErrorTime = Date.now()

    console.error(`[MarketDataSource] ${context}:`, error)
    this.emit("error", { error, context })
  }

  getFromCache(type: string, symbol: string): any {
    return this.cache.get(`${type}-${symbol}`)
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheHitRate: this.cache.getHitRate(),
      activeSubscriptions: this.subscriptions.size,
    }
  }

  private cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.removeAllListeners()
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close()
      }
      this.ws = null
    }
  }

  async disconnect(): Promise<void> {
    this.cleanup()
    this.subscriptions.clear()
    this.cache.clear()
    this.isConnected = false
  }
} 