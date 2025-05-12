'use client'

import { Button } from '@/components/ui/button'
import { WalletConnection } from '@/app/components/blockchain/WalletConnection'
import { Section } from '@/components/ui/section'

export function HeroSection() {
  return (
    <Section
      className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-background to-background/80"
      noSpacing
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Main heading */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-gray-200/90 to-gray-400/90">
          Your AI Agents Ecosystem for{' '}
          <span className="gradient-primary gradient-text">Web3 Innovation</span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-lg sm:text-xl lg:text-2xl max-w-2xl text-muted-foreground">
          Build, deploy, and orchestrate AI agents that seamlessly interact with blockchain technology. 
          Unlock new possibilities in DeFi, NFTs, and smart contracts.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <WalletConnection />
          <Button
            variant="outline"
            size="lg"
            className="min-w-[200px]"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Features
          </Button>
        </div>

        {/* Key metrics */}
        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:mt-24">
          {[
            ['10x Faster', 'Development'],
            ['100% Secure', 'Transactions'],
            ['24/7', 'Automation'],
          ].map(([metric, label]) => (
            <div key={metric} className="flex flex-col items-center">
              <dt className="text-2xl font-bold leading-7 gradient-text gradient-primary">{metric}</dt>
              <dd className="text-sm text-muted-foreground">{label}</dd>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
} 