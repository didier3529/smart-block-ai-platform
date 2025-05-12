"use client"

import { ReactNode, createContext, useContext, useState } from 'react';
import { ErrorBoundary } from '../error/error-boundary';

interface ErrorContextType {
  handleError: (error: Error, errorInfo: React.ErrorInfo) => void;
  retryAttempt: number;
  resetError: () => void;
}

const ErrorContext = createContext<ErrorContextType>({
  handleError: () => {},
  retryAttempt: 0,
  resetError: () => {},
});

export const useError = () => useContext(ErrorContext);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [retryAttempt, setRetryAttempt] = useState(0);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Error caught by ErrorProvider:', error, errorInfo);
    // In a real app, you might want to log this to a service
  };

  const resetError = () => {
    setRetryAttempt(prev => prev + 1);
  };

  return (
    <ErrorContext.Provider value={{ handleError, retryAttempt, resetError }}>
      <ErrorBoundary
        onError={handleError}
        retryAttempt={retryAttempt}
        onReset={resetError}
      >
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
} 