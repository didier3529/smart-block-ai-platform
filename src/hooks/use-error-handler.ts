import { useState, useCallback } from 'react';
import { useErrorStore } from '../stores/error-store';
import {
  BaseError,
  ErrorCategory,
  isRetryableError,
  createErrorFromUnknown
} from '../types/errors';

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

interface ErrorHandlerOptions {
  retryConfig?: Partial<RetryConfig>;
  onError?: (error: BaseError) => void;
  context?: Record<string, unknown>;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { addError } = useErrorStore();
  
  const retryConfig = {
    ...defaultRetryConfig,
    ...options.retryConfig
  };

  const calculateBackoff = (attempt: number): number => {
    const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt);
    return Math.min(delay, retryConfig.maxDelay);
  };

  const handleError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    const baseError = createErrorFromUnknown(error);
    
    // Add context from options and call
    baseError.details.context = {
      ...options.context,
      ...context
    };

    // Add to error store
    addError({
      message: baseError.message,
      category: baseError.category,
      details: baseError.details
    });

    // Call custom error handler if provided
    options.onError?.(baseError);

    return baseError;
  }, [addError, options]);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> => {
    let attempt = 0;
    setIsLoading(true);

    try {
      while (attempt < retryConfig.maxAttempts) {
        try {
          const result = await operation();
          setIsLoading(false);
          return result;
        } catch (error) {
          const baseError = handleError(error, context);

          if (!isRetryableError(baseError) || attempt === retryConfig.maxAttempts - 1) {
            throw baseError;
          }

          await new Promise(resolve => 
            setTimeout(resolve, calculateBackoff(attempt))
          );
          attempt++;
        }
      }

      // This should never be reached due to the throw in the catch block
      throw new Error('Maximum retry attempts exceeded');
    } finally {
      setIsLoading(false);
    }
  }, [handleError, retryConfig]);

  const clearError = useCallback((category?: ErrorCategory) => {
    // Implementation would depend on your error store structure
  }, []);

  return {
    isLoading,
    handleError,
    withErrorHandling,
    clearError
  };
} 