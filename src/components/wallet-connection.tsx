'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from './ui/loading-spinner'
import { connectWallet } from '@/lib/blockchain/walletConnection'

export function WalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      await connectWallet()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div>
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="min-w-[160px]"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
} 