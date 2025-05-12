'use client'

import { Card } from '@/components/ui/card'

const features = [
  {
    title: 'Portfolio Analysis',
    description: 'Get deep insights into your crypto portfolio with AI-powered analysis and recommendations.',
    icon: '📊',
  },
  {
    title: 'Smart Contract Auditing',
    description: 'Automatically analyze smart contracts for vulnerabilities and optimization opportunities.',
    icon: '🔍',
  },
  {
    title: 'Market Trend Detection',
    description: 'Spot emerging market trends and opportunities with our advanced AI algorithms.',
    icon: '📈',
  },
  {
    title: 'Multi-Chain Support',
    description: 'Seamlessly analyze data across multiple blockchain networks in one place.',
    icon: '🔗',
  },
  {
    title: 'Real-Time Alerts',
    description: 'Receive instant notifications about important changes in your tracked assets.',
    icon: '🔔',
  },
  {
    title: 'Custom Reports',
    description: 'Generate detailed reports tailored to your specific analysis needs.',
    icon: '📑',
  },
]

export function FeatureShowcase() {
  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Powerful Features
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Everything you need to analyze and optimize your blockchain investments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="p-6 bg-card hover:shadow-lg transition-shadow duration-300"
          >
            <div className="space-y-4">
              <div className="text-4xl">{feature.icon}</div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 