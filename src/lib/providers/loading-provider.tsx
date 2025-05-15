"use client"

import React from 'react'
import { useAuthGuard } from '@/lib/hooks/use-auth-guard'
import { usePortfolio } from '@/lib/hooks/use-portfolio'
import { useMarket } from '@/lib/hooks/use-market'
import { useContractContext } from '@/lib/providers/contract-provider'
import { useNFT } from '@/lib/hooks/use-nft'
import { LoadingScreen } from '@/components/ui/loading-screen'

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
  const { isLoading: contractLoading } = useContractContext()
  const { isLoading: nftLoading } = useNFT()

  const isLoading = authLoading || portfolioLoading || marketLoading || contractLoading || nftLoading

  const loadingMessage = authLoading ? 'Verifying authentication...' :
    portfolioLoading ? 'Loading portfolio...' :
    marketLoading ? 'Loading market data...' :
    contractLoading ? 'Loading contracts...' :
    nftLoading ? 'Loading NFT data...' : ''

  if (isLoading) {
    return <LoadingScreen />
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