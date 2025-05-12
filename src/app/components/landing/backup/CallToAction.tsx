'use client'

import { Button } from '@/components/ui/button'
import { WalletConnection } from '@/app/components/blockchain/WalletConnection'
import { useWallet } from '@/app/hooks/useWallet'

export function CallToAction() {
  const { isConnected } = useWallet()

  return (
    <section className="py-24 bg-gradient-to-b from-background to-background/50">
      <div className="container px-4 mx-auto text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
          Ready to Experience the Future?
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Join the growing community of developers leveraging AI-powered blockchain solutions. 
          Connect your wallet to get started with ChainOracle today.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <WalletConnection className="min-w-[200px]" />
          {isConnected && (
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto"
              asChild
            >
              <a href="/dashboard">
                Go to Dashboard
              </a>
            </Button>
          )}
        </div>

        <div className="mt-12 flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">10k+</div>
            <div className="text-muted-foreground">Queries Processed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">500+</div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">99%</div>
            <div className="text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </div>
    </section>
  )
} 