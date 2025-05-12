import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/components/ui/use-toast'

interface WebSocketState {
  isConnected: boolean
  isPolling: boolean
  error: Error | null
  lastMessage: any
  useHardcodedPrices: boolean
}

interface WebSocketHook {
  subscribe: (url: string, onMessage: (data: any) => void) => void
  unsubscribe: () => void
  isConnected: boolean
  isPolling: boolean
  error: Error | null
  useHardcodedPrices: boolean
}

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_INTERVAL = 2000 // 2 seconds
const CONNECTION_TIMEOUT = 5000 // 5 seconds
const POLLING_INTERVAL = 10000 // 10 seconds

// Check if we're using hardcoded prices
const isUsingHardcodedPrices = process.env.NEXT_PUBLIC_USE_HARDCODED_PRICES === 'true' || 
  process.env.NODE_ENV === 'development' // Default to hardcoded in dev

export function useWebSocket(): WebSocketHook {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isPolling: false,
    error: null,
    lastMessage: null,
    useHardcodedPrices: isUsingHardcodedPrices
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const connectionTimeoutRef = useRef<NodeJS.Timeout>()
  const pollingIntervalRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const messageHandlerRef = useRef<((data: any) => void) | null>(null)
  const urlRef = useRef<string>('')

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch (error) {
        console.warn('Closing WebSocket:', error)
      }
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      error: null
    }))
    reconnectAttemptsRef.current = 0
    messageHandlerRef.current = null
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const handleError = useCallback((error: Event | Error, context: string) => {
    // Don't log or show errors if we're using hardcoded prices
    if (state.useHardcodedPrices) {
      return
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = {
      context,
      timestamp: new Date().toISOString(),
      url: urlRef.current,
      reconnectAttempts: reconnectAttemptsRef.current,
      readyState: wsRef.current?.readyState,
      error: errorMessage
    }
    
    // Only log error if not using hardcoded prices
    if (!state.useHardcodedPrices) {
      console.error('WebSocket error:', errorDetails)
    }
    
    setState(prev => ({
      ...prev,
      error: error instanceof Error ? error : new Error(context)
    }))

    // Only show toast for critical errors when not using hardcoded prices
    if (!state.useHardcodedPrices && context !== 'Connection error') {
      toast({
        title: "WebSocket Error",
        description: `${context}. Using fallback price updates.`,
        variant: "destructive",
      })
    }
  }, [state.useHardcodedPrices])

  const connect = useCallback((url: string): WebSocket | null => {
    // If using hardcoded prices, don't attempt WebSocket connection
    if (state.useHardcodedPrices) {
      console.log('Using hardcoded prices, skipping WebSocket connection')
      return null
    }

    cleanup() // Clean up any existing connection
    urlRef.current = url

    try {
      console.log('🚀 Attempting WebSocket connection to:', url)
      const ws = new WebSocket(url)
      wsRef.current = ws

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (!state.isConnected) {
          handleError(new Error('Connection timeout'), 'Connection timed out')
          ws.close()
        }
      }, CONNECTION_TIMEOUT)

      ws.onopen = () => {
        console.log('🚀 WebSocket connected successfully')
        setState(prev => ({ ...prev, isConnected: true, error: null }))
        reconnectAttemptsRef.current = 0
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
        }

        try {
          ws.send(JSON.stringify({ type: 'ping' }))
        } catch (error) {
          handleError(error as Error, 'Failed to send initial ping')
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'pong') {
            console.log('📡 WebSocket connection verified')
            return
          }
          if (messageHandlerRef.current) {
            messageHandlerRef.current(data)
          }
          setState(prev => ({ ...prev, lastMessage: data }))
        } catch (error) {
          handleError(error as Error, 'Failed to process message')
        }
      }

      ws.onclose = (event) => {
        const closeReason = event.reason || 'Unknown reason'
        console.log(`WebSocket disconnected: ${closeReason} (code: ${event.code})`)
        setState(prev => ({ ...prev, isConnected: false }))
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
        }
        
        if (!state.useHardcodedPrices && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Attempting reconnect ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS}...`)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
              connect(urlRef.current)
            }
          }, RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current))
        } else {
          if (!state.useHardcodedPrices) {
            handleError(
              new Error(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`),
              'Max reconnection attempts reached'
            )
          }
          cleanup()
        }
      }

      ws.onerror = (error) => {
        if (!state.useHardcodedPrices) {
          handleError(error, 'Connection error')
        }
      }

      return ws
    } catch (error) {
      if (!state.useHardcodedPrices) {
        handleError(error as Error, 'Failed to create WebSocket')
      }
      return null
    }
  }, [cleanup, handleError, state.useHardcodedPrices, state.isConnected])

  const subscribe = useCallback((url: string, onMessage: (data: any) => void) => {
    messageHandlerRef.current = onMessage

    // If using hardcoded prices, don't attempt WebSocket connection
    if (state.useHardcodedPrices) {
      console.log('Using hardcoded prices for updates')
      return
    }

    try {
      connect(url)
    } catch (error) {
      handleError(error as Error, 'Subscription error')
    }
  }, [connect, handleError, state.useHardcodedPrices])

  const unsubscribe = useCallback(() => {
    cleanup()
  }, [cleanup])

  return {
    subscribe,
    unsubscribe,
    isConnected: state.isConnected,
    isPolling: state.isPolling,
    error: state.error,
    useHardcodedPrices: state.useHardcodedPrices
  }
} 