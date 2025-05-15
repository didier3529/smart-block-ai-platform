import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/providers/auth-provider'

export interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export function useMarket() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  return {
    isLoading,
    data: null
  }
} 