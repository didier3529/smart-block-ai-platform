'use client'

import { Button } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'
import { useState, useCallback } from 'react'

export function WalletConnection({ className, variant, size, ...props }: ButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to connect your wallet')
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  return (
    <div>
      <Button 
        onClick={connectWallet}
        disabled={isConnecting}
        className={className}
        variant={variant}
        size={size}
        {...props}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
} 