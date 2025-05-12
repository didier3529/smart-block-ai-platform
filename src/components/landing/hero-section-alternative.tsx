'use client'

import { Button } from '@/components/ui/button'
import { WalletConnection } from '@/app/components/blockchain/WalletConnection'

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            AI-Powered{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Blockchain Analysis
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground">
            Leverage intelligent AI agents to analyze smart contracts, track portfolios, and spot market trends with unprecedented accuracy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WalletConnection />
            <Button
              variant="outline"
              size="lg"
              className="min-w-[200px]"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 