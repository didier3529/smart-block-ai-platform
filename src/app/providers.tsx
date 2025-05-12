"use client";

import { AuthProvider } from '@/lib/providers/auth-provider'
import { PortfolioProvider } from '@/lib/providers/portfolio-provider'
import { SettingsProvider } from '@/lib/providers/settings-provider'
import { MarketProvider } from '@/lib/providers/market-provider'
import { ContractProvider } from '@/lib/providers/contract-provider'
import { NFTProvider } from '@/lib/providers/nft-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React, { useState, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

interface ProvidersProps {
  children: React.ReactNode;
}

// Custom error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div role="alert" className="p-4">
      <p className="text-red-500 font-bold">Something went wrong:</p>
      <pre className="text-sm overflow-auto">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  )
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Global query configuration
            staleTime: 1000 * 30, // Data stays fresh for 30 seconds
            cacheTime: 1000 * 60 * 5, // Cache persists for 5 minutes
            refetchOnWindowFocus: true, // Refetch on window focus for real-time data
            refetchOnReconnect: true, // Refetch on reconnect
            refetchOnMount: true, // Refetch on mount
            retry: (failureCount, error: any) => {
              // Don't retry on 404s or other client errors
              if (error?.response?.status >= 400 && error?.response?.status < 500) return false
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            suspense: false, // Disable suspense by default
            useErrorBoundary: (error: any) => {
              // Use error boundary for server errors
              return error?.response?.status >= 500
            },
          },
          mutations: {
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            useErrorBoundary: true,
          },
        },
      })
  )

  const handleError = useCallback((error: Error, info: { componentStack: string }) => {
    // Log error to monitoring service
    console.error("Provider Error:", error)
    console.error("Error Info:", info)
  }, [])

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <PortfolioProvider>
              <MarketProvider>
                <ContractProvider>
                  <NFTProvider>
                    {children}
                  </NFTProvider>
                </ContractProvider>
              </MarketProvider>
            </PortfolioProvider>
          </SettingsProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom-right"
            buttonPosition="bottom-right"
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  )
} 