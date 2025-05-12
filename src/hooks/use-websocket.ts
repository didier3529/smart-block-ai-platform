import { useEffect, useRef, useState, useCallback } from 'react'

type WebSocketHandler = (data: any) => void

interface WebSocketState {
  isConnected: boolean
  error: Error | null
}

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null
  })
  const subscribersRef = useRef<Map<string, Set<WebSocketHandler>>>(new Map())

  const subscribe = useCallback((channel: string, handler: WebSocketHandler) => {
    if (!subscribersRef.current.has(channel)) {
      subscribersRef.current.set(channel, new Set())
    }
    const handlers = subscribersRef.current.get(channel)!
    handlers.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = subscribersRef.current.get(channel)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          subscribersRef.current.delete(channel)
        }
      }
    }
  }, [])

  const unsubscribe = useCallback((channel: string) => {
    subscribersRef.current.delete(channel)
  }, [])

  return {
    isConnected: state.isConnected,
    error: state.error,
    subscribe,
    unsubscribe
  }
} 