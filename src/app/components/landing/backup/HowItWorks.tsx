'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Cpu, Lightbulb, CheckCircle } from 'lucide-react'

interface Step {
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const steps: Step[] = [
  {
    title: 'Connect & Request',
    description: 'Connect your wallet and submit your query or task to our AI agents.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'bg-blue-500/10 text-blue-500'
  },
  {
    title: 'AI Processing',
    description: 'Our advanced AI agents analyze and process your request using neural networks.',
    icon: <Cpu className="w-6 h-6" />,
    color: 'bg-purple-500/10 text-purple-500'
  },
  {
    title: 'Smart Solutions',
    description: 'AI agents collaborate to generate intelligent, context-aware solutions.',
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'bg-amber-500/10 text-amber-500'
  },
  {
    title: 'Verified Results',
    description: 'Receive accurate, verified results backed by blockchain technology.',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-green-500/10 text-green-500'
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            How ChainOracle Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience a seamless process from query to solution with our intelligent AI agents.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card 
                key={index} 
                className="relative group hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className={`mb-4 p-2 inline-block rounded-lg ${step.color}`}>
                    {step.icon}
                  </div>
                  <Badge variant="secondary" className="mb-3">
                    Step {index + 1}
                  </Badge>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 border-t-2 border-r-2 border-border rotate-45" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 