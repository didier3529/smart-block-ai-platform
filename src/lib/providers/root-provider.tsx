"use client";

/**
 * RootProvider: Central provider component that wraps the entire application.
 * This is the main provider hierarchy that ensures all contexts are properly initialized.
 * All other providers are composed within this component.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { WebSocketProvider } from "./websocket-provider"
import { PortfolioProvider } from "@/lib/providers/portfolio-provider"
import { MarketProvider } from "./market-provider"
import { NFTProvider } from "./nft-provider"
import { ContractProvider } from "./contract-provider"
import { SettingsProvider } from "./settings-provider"
import { AuthProvider } from "@/lib/providers/auth-provider"
import { PriceProvider } from "./price-provider"
import { useState } from "react"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

export function RootProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // Data stays fresh for 1 minute
            cacheTime: 1000 * 60 * 5, // Cache persists for 5 minutes
            refetchOnWindowFocus: false, // Don't refetch on window focus
            retry: 1, // Only retry failed requests once
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <AuthProvider>
            <WebSocketProvider>
              <SettingsProvider>
                <PriceProvider>
                  <PortfolioProvider>
                    <MarketProvider>
                      <NFTProvider>
                        <ContractProvider>
                          {children}
                          <Toaster />
                        </ContractProvider>
                      </NFTProvider>
                    </MarketProvider>
                  </PortfolioProvider>
                </PriceProvider>
              </SettingsProvider>
            </WebSocketProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}