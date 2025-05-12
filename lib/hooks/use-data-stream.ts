import { useEffect, useRef, useState, useCallback } from 'react';
import { DataStreamManager } from '../streaming/data-stream-manager';
import type { StreamConfig, StreamMetrics } from '../streaming/data-stream-manager';

interface UseDataStreamOptions extends StreamConfig {
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onMetrics?: (metrics: StreamMetrics) => void;
}

export function useDataStream(streamId: string, options: UseDataStreamOptions = {}) {
  const streamManager = useRef<DataStreamManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<StreamMetrics | null>(null);

  // Memoize callbacks to prevent unnecessary re-renders
  const onData = useCallback(options.onData || (() => {}), [options.onData]);
  const onError = useCallback(options.onError || (() => {}), [options.onError]);
  const onMetrics = useCallback(options.onMetrics || (() => {}), [options.onMetrics]);

  useEffect(() => {
    let isMounted = true;

    const initializeStream = async () => {
      try {
        // Create stream manager with performance-optimized defaults
        streamManager.current = new DataStreamManager({
          batchSize: options.batchSize || 100,
          batchTimeout: options.batchTimeout || 50,
          maxQueueSize: options.maxQueueSize || 1000,
          priorityLevels: options.priorityLevels || 3,
          rateLimit: options.rateLimit || 1000
        });

        // Set up event listeners
        streamManager.current.on('data', (data: any) => {
          if (isMounted) {
            onData(data);
          }
        });

        streamManager.current.on('error', (err: Error) => {
          if (isMounted) {
            setError(err);
            onError(err);
          }
        });

        streamManager.current.on('metrics:update', (newMetrics: StreamMetrics) => {
          if (isMounted) {
            setMetrics(newMetrics);
            onMetrics(newMetrics);
          }
        });

        // Create the stream
        await streamManager.current.createStream(streamId, options);
        if (isMounted) {
          setIsConnected(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          onError(err as Error);
        }
      }
    };

    initializeStream();

    // Cleanup function
    return () => {
      isMounted = false;
      if (streamManager.current) {
        streamManager.current.cleanup().catch(console.error);
      }
    };
  }, [streamId, options.batchSize, options.batchTimeout, options.maxQueueSize, 
      options.priorityLevels, options.rateLimit, onData, onError, onMetrics]);

  // Memoized push function to prevent unnecessary re-renders
  const push = useCallback(async (data: any, priority: 'high' | 'normal' | 'low' = 'normal') => {
    try {
      if (!streamManager.current) {
        throw new Error('Stream not initialized');
      }
      await streamManager.current.pushToStream(streamId, data, priority);
    } catch (err) {
      setError(err as Error);
      onError(err as Error);
    }
  }, [streamId, onError]);

  return {
    push,
    isConnected,
    error,
    metrics,
    // Expose cleanup function for manual cleanup if needed
    cleanup: useCallback(async () => {
      if (streamManager.current) {
        await streamManager.current.cleanup();
        streamManager.current = null;
        setIsConnected(false);
      }
    }, [])
  };
} 