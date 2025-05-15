import { useState } from 'react'
import { useAuth } from '@/lib/providers/auth-provider'

export function usePortfolio() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  return {
    isLoading,
    data: null
  }
} 