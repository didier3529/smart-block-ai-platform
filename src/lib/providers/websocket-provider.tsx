"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { marketDataAdapter } from '@/lib/services/market-data-adapter';
import { WebSocketConfig } from '@/config/websocket-config';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// WebSocket connection states
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Subscription types matching our data needs
type SubscriptionType =
  | 'portfolio'
  | 'market-trends'
  | 'nft-collection'
  | 'token-price';

type WebSocketHandler = (data: any) => void;

interface WebSocketContextType {
  isConnected: boolean;
  lastError: Error | null;
  reconnect: () => void;
  connectionState: ConnectionState;
  subscribe: <T>(channel: string, callback: WebSocketHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastError: null,
  reconnect: () => {},
  connectionState: 'disconnected',
  subscribe: () => () => {},
});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Component to display connection status
export function ConnectionStatus() {
  const { connectionState, isConnected, reconnect, lastError } = useWebSocket();
  
  if (connectionState === 'connecting') {
    return (
      <Alert className="bg-blue-500/10 text-blue-500 border-blue-500/20 mb-4 flex items-center">
        <Wifi className="h-4 w-4 mr-2 animate-pulse" />
        <div className="flex-1">
          <AlertTitle>Connecting to market data...</AlertTitle>
          <AlertDescription>
            Setting up real-time data connection
          </AlertDescription>
        </div>
      </Alert>
    );
  }
  
  if (connectionState === 'error') {
    return (
      <Alert className="bg-red-500/10 text-red-500 border-red-500/20 mb-4 flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        <div className="flex-1">
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {lastError?.message || "Unable to connect to market data service"}
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-4" 
          onClick={reconnect}
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Reconnect
        </Button>
      </Alert>
    );
  }
  
  if (!isConnected) {
    return (
      <Alert className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 mb-4 flex items-center">
        <WifiOff className="h-4 w-4 mr-2" />
        <div className="flex-1">
          <AlertTitle>Disconnected</AlertTitle>
          <AlertDescription>
            The real-time data connection has been lost
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-4" 
          onClick={reconnect}
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Reconnect
        </Button>
      </Alert>
    );
  }
  
  return null;
}

// Custom error fallback for websocket errors
function WebSocketErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-black/30 p-6 rounded-lg border border-white/10 max-w-md w-full mx-4">
        <AlertTitle className="text-xl font-semibold text-white mb-4">
          Connection Error
        </AlertTitle>
        <AlertDescription className="text-white/90 mb-6">
          {error.message || "Lost connection to the server. Please check your connection and try again."}
          
          {WebSocketConfig.useMock && (
            <div className="mt-4 p-2 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20">
              Running in mock mode. WebSocket errors are simulated.
            </div>
          )}
        </AlertDescription>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={resetErrorBoundary}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Dismiss
          </Button>
          <Button
            onClick={resetErrorBoundary}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastError, setLastError] = useState<Error | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const subscriptionsRef = useRef<Map<string, Set<WebSocketHandler>>>(new Map());
  const reconnectAttempts = useRef<number>(0);
  
  const handleConnect = () => {
    setConnectionState('connected');
    setLastError(null);
    reconnectAttempts.current = 0;
    console.log('🌐 WebSocket connected');
  };

  const handleDisconnect = (details?: any) => {
    setConnectionState('disconnected');
    console.log('🔌 WebSocket disconnected', details || '');
  };

  const handleError = (error: any) => {
    const errorObject = error instanceof Error 
      ? error 
      : new Error(error?.message || 'Unknown WebSocket error');
    
    setLastError(errorObject);
    setConnectionState('error');
    console.error('WebSocket error:', error);
  };

  const reconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    setConnectionState('connecting');
    
    try {
      marketDataAdapter.removeAllListeners();
      marketDataAdapter.disconnect();
      
      // Increment reconnect attempts and add exponential backoff
      reconnectAttempts.current += 1;
      const backoffTime = Math.min(
        WebSocketConfig.reconnectInterval * Math.pow(1.5, reconnectAttempts.current - 1),
        30000
      );
      
      console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${reconnectAttempts.current})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        
        // Re-register event listeners
        marketDataAdapter.on('connected', handleConnect);
        marketDataAdapter.on('disconnected', handleDisconnect);
        marketDataAdapter.on('error', handleError);
        
        // Reconnect
        marketDataAdapter.connect();
      }, backoffTime);
    } catch (error) {
      console.error('Error during reconnection:', error);
      setLastError(error instanceof Error ? error : new Error('Failed to reconnect'));
    }
  };

  const subscribe = <T,>(channel: string, callback: WebSocketHandler): (() => void) => {
    // Initialize set if it doesn't exist
    if (!subscriptionsRef.current.has(channel)) {
      subscriptionsRef.current.set(channel, new Set());
    }
    
    // Add callback to subscribers
    const subscribers = subscriptionsRef.current.get(channel)!;
    subscribers.add(callback);
    
    // Setup subscription
    const handleMessage = (data: T) => {
      subscribers.forEach(cb => cb(data));
    };
    
    marketDataAdapter.on(channel, handleMessage);
    
    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        marketDataAdapter.removeListener(channel, handleMessage);
      }
    };
  };

  useEffect(() => {
    // Handle component mount/unmount
    const setupConnection = () => {
      marketDataAdapter.on('connected', handleConnect);
      marketDataAdapter.on('disconnected', handleDisconnect);
      marketDataAdapter.on('error', handleError);

      // Set initial state to connecting
      setConnectionState('connecting');
      
      // Initialize connection
      try {
        marketDataAdapter.connect();
      } catch (err) {
        handleError(err);
      }
    };
    
    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Clean up event listeners
      marketDataAdapter.removeListener('connected', handleConnect);
      marketDataAdapter.removeListener('disconnected', handleDisconnect);
      marketDataAdapter.removeListener('error', handleError);
      
      try {
        marketDataAdapter.disconnect();
      } catch (err) {
        console.error('Error disconnecting WebSocket:', err);
      }
    };
    
    // Initialize on mount
    setupConnection();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  const contextValue = {
    isConnected: connectionState === 'connected',
    lastError,
    reconnect,
    connectionState,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      <ErrorBoundary 
        variant="websocket" 
        fallback={WebSocketErrorFallback}
      >
        {children}
      </ErrorBoundary>
    </WebSocketContext.Provider>
  );
}

// Utility hook for subscribing to real-time data
export function useSubscription<T>(channel: string, callback: WebSocketHandler<T>) {
  const { subscribe, connectionState } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe<T>(channel, callback);
    return unsubscribe;
  }, [channel, callback, subscribe]);

  return connectionState === 'connected';
} 