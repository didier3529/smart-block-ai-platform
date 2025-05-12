"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { ResetKeysConfig } from '@/types/common';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FallbackProps {
  error: Error
  resetErrorBoundary: () => void
  variant?: "default" | "diagnostic" | "websocket"
}

// Export the ErrorFallback component
export function ErrorFallback({ error, resetErrorBoundary, variant = "default" }: FallbackProps) {
  if (variant === "websocket") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div className="bg-black/30 p-6 rounded-lg border border-white/10 max-w-md w-full mx-4">
          <AlertTitle className="text-xl font-semibold text-white mb-4">
            Connection Error
          </AlertTitle>
          <AlertDescription className="text-white/90 mb-6">
            {error.message || "Lost connection to the server. Please check your connection and try again."}
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
    )
  }

  if (variant === "diagnostic") {
    return (
      <div className="p-6 rounded-lg bg-black/30 backdrop-blur-md border border-white/10">
        <AlertTitle className="text-xl font-semibold text-white mb-4">
          Something went wrong
        </AlertTitle>
        <details className="cursor-pointer">
          <summary className="text-white/90 mb-4">Click for error details</summary>
          <pre className="whitespace-pre-wrap text-sm bg-black/20 p-4 rounded border border-white/10 text-white/80 overflow-auto">
            {error.toString()}
          </pre>
        </details>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={resetErrorBoundary}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Alert variant="destructive" className="bg-black/30 backdrop-blur-md border-destructive/20">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-white">Something went wrong</AlertTitle>
      <AlertDescription className="text-white/90 mt-2">
        {error.message}
      </AlertDescription>
    </Alert>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  variant?: "default" | "diagnostic" | "websocket";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by error boundary:", error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        );
      }
      
      // Otherwise use our default ErrorFallback
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          variant={this.props.variant}
        />
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for handling async errors
export function useAsyncError() {
  const setError = useStore((state) => state.setError);
  const clearError = useStore((state) => state.clearError);

  return React.useCallback(
    (key: string, fn: () => Promise<void>) => {
      return fn().catch((error: Error) => {
        console.error(`Async error (${key}):`, error);
        setError(key, error);
        // Clear error after 5 seconds
        setTimeout(() => clearError(key), 5000);
      });
    },
    [setError, clearError]
  );
} 