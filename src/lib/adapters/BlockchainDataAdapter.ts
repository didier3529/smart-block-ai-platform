import { WebSocket } from 'ws'
import { BlockchainEventHandler } from '@/types/common'

export abstract class BlockchainDataAdapter {
  private eventHandlers: Map<string, BlockchainEventHandler[]> = new Map()
  private wsConnection: WebSocket | null = null

  constructor(protected readonly wsUrl: string) {
    this.connect()
  }

  private connect() {
    try {
      this.wsConnection = new WebSocket(this.wsUrl)

      this.wsConnection.onopen = () => {
        console.log('Blockchain WebSocket connected')
        this.initializeSubscriptions()
      }

      this.wsConnection.onclose = () => {
        console.log('Blockchain WebSocket disconnected')
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000)
      }

      this.wsConnection.onerror = (error) => {
        console.error('Blockchain WebSocket error:', error)
      }

      this.wsConnection.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data)
          this.handleEvent(type, data)
        } catch (error) {
          console.error('Error handling blockchain event:', error)
        }
      }
    } catch (error) {
      console.error('Error connecting to blockchain WebSocket:', error)
    }
  }

  protected subscribeToEvent<T>(event: string, handler: BlockchainEventHandler<T>) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)?.push(handler as BlockchainEventHandler)
  }

  protected unsubscribeFromEvent<T>(event: string, handler: BlockchainEventHandler<T>) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler as BlockchainEventHandler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private handleEvent(event: string, data: unknown) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  protected sendWebSocketMessage<T>(event: string, payload: T) {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({ type: event, data: payload }))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  protected abstract initializeSubscriptions(): void
} 