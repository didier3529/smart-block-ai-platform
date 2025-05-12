import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BlockchainWebSocketAdapter, BlockchainEvent, BlockchainSubscription } from '../adapters/blockchain-websocket-adapter';

interface UseBlockchainWebSocketOptions {
  chainId: number;
  eventTypes: string[];
  onMessage?: (event: BlockchainEvent) => void;
  onError?: (error: Error) => void;
}

export function useBlockchainWebSocket({
  chainId,
  eventTypes,
  onMessage,
  onError
}: UseBlockchainWebSocketOptions) {
  const adapterRef = useRef<BlockchainWebSocketAdapter>();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!adapterRef.current) {
      adapterRef.current = new BlockchainWebSocketAdapter();
    }

    const adapter = adapterRef.current;

    // Connect to the blockchain WebSocket
    adapter.connect(chainId).catch(error => {
      console.error(`Failed to connect to chain ${chainId}:`, error);
      onError?.(error);
    });

    // Subscribe to events
    const subscriptions: BlockchainSubscription[] = eventTypes.map(eventType => ({
      chainId,
      eventType,
      callback: (event: BlockchainEvent) => {
        // Update React Query cache based on event type
        updateQueryCache(event);
        // Call custom message handler if provided
        onMessage?.(event);
      }
    }));

    // Set up subscriptions
    subscriptions.forEach(subscription => {
      adapter.subscribe(subscription).catch(error => {
        console.error(`Failed to subscribe to ${subscription.eventType}:`, error);
        onError?.(error);
      });
    });

    // Handle errors
    adapter.on('error', (error: Error) => {
      console.error('Blockchain WebSocket error:', error);
      onError?.(error);
    });

    // Handle max reconnect attempts reached
    adapter.on('maxReconnectAttemptsReached', (chainId: number) => {
      console.error(`Max reconnect attempts reached for chain ${chainId}`);
      onError?.(new Error(`Max reconnect attempts reached for chain ${chainId}`));
    });

    return () => {
      // Cleanup subscriptions
      subscriptions.forEach(subscription => {
        adapter.unsubscribe(subscription).catch(console.error);
      });
      // Disconnect
      adapter.disconnect(chainId).catch(console.error);
    };
  }, [chainId, eventTypes, onMessage, onError]);

  const updateQueryCache = useCallback((event: BlockchainEvent) => {
    const { type, data } = event;

    // Update different query cache keys based on event type
    switch (type) {
      case 'block':
        queryClient.setQueryData(['blocks', chainId], (old: any) => ({
          ...old,
          latest: data
        }));
        break;
      case 'transaction':
        queryClient.setQueryData(['transactions', chainId, data.hash], data);
        break;
      case 'token':
        queryClient.setQueryData(['tokens', chainId, data.address], data);
        break;
      case 'contract':
        queryClient.setQueryData(['contracts', chainId, data.address], data);
        break;
      default:
        // For unknown event types, update a generic events cache
        queryClient.setQueryData(['events', chainId, type], (old: any[]) => 
          old ? [data, ...old.slice(0, 99)] : [data]
        );
    }
  }, [queryClient]);

  const getMetrics = useCallback(() => {
    return adapterRef.current?.getMetrics(chainId);
  }, [chainId]);

  return {
    getMetrics
  };
} 