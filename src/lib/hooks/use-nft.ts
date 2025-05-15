import { useState } from 'react'
import { useAuth } from '@/lib/providers/auth-provider'

export function useNFT() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  return {
    isLoading,
    data: null
  }
} 