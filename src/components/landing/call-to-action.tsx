'use client'

import { Button } from '@/components/ui/button'
import { WalletConnection } from '@/app/components/blockchain/WalletConnection'

export function CallToAction() {
  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />

      <div className="relative space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join the growing community of developers building with ChainOracle
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <WalletConnection />
          <Button
            variant="outline"
            size="lg"
            className="min-w-[200px]"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View Features
          </Button>
        </div>

        {/* Additional benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
          {[
            {
              title: 'Quick Setup',
              description: 'Connect your wallet and start building in minutes',
            },
            {
              title: 'AI-Powered',
              description: 'Leverage intelligent agents for blockchain development',
            },
            {
              title: '24/7 Support',
              description: 'Access community support and documentation anytime',
            },
          ].map((benefit) => (
            <div key={benefit.title} className="text-center">
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 