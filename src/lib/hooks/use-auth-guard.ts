import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/auth-provider'

export function useAuthGuard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [canAccess, setCanAccess] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      setCanAccess(isAuthenticated)
    }
  }, [isAuthenticated, authLoading])

  return {
    canAccess,
    isLoading: authLoading
  }
} 