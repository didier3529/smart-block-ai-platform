"use client"

import React from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { usePortfolio } from "@/lib/providers/portfolio-provider"
import { useMarket } from "@/lib/providers/market-provider"
import { useContract } from "@/lib/providers/contract-provider"
import { useNFT } from "@/lib/providers/nft-provider"

interface LoadingContextType {
  isLoading: boolean
  loadingMessage: string
}

export const LoadingContext = React.createContext<LoadingContextType>({
  isLoading: false,
  loadingMessage: ''
})

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, canAccess } = useAuthGuard()
  const { isLoading: portfolioLoading } = usePortfolio()
  const { isLoading: marketLoading } = useMarket()
  const { isLoading: contractLoading } = useContract()
  const { isLoading: nftLoading } = useNFT()

  const isLoading = authLoading || portfolioLoading || marketLoading || contractLoading || nftLoading

  const loadingMessage = authLoading ? 'Verifying authentication...' :
    portfolioLoading ? 'Loading portfolio...' :
    marketLoading ? 'Loading market data...' :
    contractLoading ? 'Loading contracts...' :
    nftLoading ? 'Loading NFT data...' : ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  if (!canAccess) {
    return null // Prevent flash while redirecting
  }

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage }}>
      {children}
    </LoadingContext.Provider>
  )
} 