'use client'

import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function FeatureShowcase() {
  return (
    <Section className="overflow-hidden">
      <div className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)] dark:[mask-image:radial-gradient(rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5" />

        {/* Content */}
        <div className="relative space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="glass-effect">
              Features
            </Badge>
            <h2 className="text-gradient-primary">
              Everything you need to build with blockchain
            </h2>
            <p className="max-w-[42rem] mx-auto text-lg">
              ChainOracle provides a comprehensive suite of tools and services to streamline your blockchain development workflow.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "group relative rounded-2xl p-6 glass-effect hover-glow",
                  index === 0 && "md:col-span-2 lg:col-span-1"
                )}
              >
                <div className="absolute inset-0 rounded-2xl gradient-primary-soft opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative space-y-4">
                  <div className="w-12 h-12 rounded-lg gradient-secondary flex items-center justify-center">
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm/relaxed">{feature.description}</p>
                  
                  <Button variant="gradient-outline" size="sm" className="w-full">
                    Learn more
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 ml-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-6">
            <h3 className="text-gradient-secondary">
              Ready to start building?
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button variant="gradient" size="lg">
                Get Started
              </Button>
              <Button variant="gradient-outline" size="lg">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

const features = [
  {
    title: "Smart Contract Integration",
    description: "Seamlessly connect and interact with smart contracts across multiple blockchain networks with our intuitive API.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
      </svg>
    ),
  },
  {
    title: "Real-time Data Feeds",
    description: "Access reliable, real-time blockchain data feeds with automatic updates and websocket support.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: "Advanced Analytics",
    description: "Gain deep insights into blockchain activity with our comprehensive analytics and visualization tools.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
] 