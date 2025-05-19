'use client'

import { Zap, TrendingUp, Code, ImageIcon, Layers, Brain } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { FeatureCard } from "@/components/ui/feature-card"
import { SectionHeading } from "@/components/ui/section-heading"
import { BorderGlow } from "@/components/ui/border-glow"

export function FeaturesSection() {
  const { ref: titleRef, isInView: titleInView } = useInView({ threshold: 0.1 })

  const features = [
    {
      title: "Portfolio Analyst",
      description: "Advanced portfolio analytics and optimization strategies powered by machine learning algorithms.",
      icon: <Zap className="w-7 h-7 text-purple-400" />,
      variant: "purple" as const,
    },
    {
      title: "Trend Spotter",
      description: "Real-time market pattern detection and predictive analytics for emerging opportunities.",
      icon: <TrendingUp className="w-7 h-7 text-blue-400" />,
      variant: "blue" as const,
    },
    {
      title: "Smart Contract Analyzer",
      description: "Comprehensive security auditing and optimization analysis for blockchain contracts.",
      icon: <Code className="w-7 h-7 text-teal-400" />,
      variant: "teal" as const,
    },
    {
      title: "NFT Advisor",
      description: "Advanced valuation metrics and collection analytics for informed NFT investments.",
      icon: <ImageIcon className="w-7 h-7 text-orange-400" />,
      variant: "orange" as const,
    },
    {
      title: "Multi-Chain Support",
      description: "Unified analytics across major blockchains including Ethereum, Polygon, and emerging networks.",
      icon: <Layers className="w-7 h-7 text-purple-400" />,
      variant: "purple" as const,
    },
    {
      title: "AI-Powered Intelligence",
      description: "Enterprise-grade insights powered by advanced machine learning models and neural networks.",
      icon: <Brain className="w-7 h-7 text-blue-400" />,
      variant: "blue" as const,
    },
  ]

  return (
    <section className="section-padding relative bg-black py-24" id="features">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/5 to-black -z-10" />

      {/* Enhanced geometric shapes in background */}
      <div className="absolute top-20 left-10 w-96 h-96 rotate-45 opacity-[0.03] blur-3xl">
        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
      </div>
      <div className="absolute bottom-20 right-10 w-[32rem] h-[32rem] -rotate-12 opacity-[0.03] blur-3xl">
        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
      </div>

      <BorderGlow containerClassName="container mx-auto max-w-7xl" className="container-padding">
        <div ref={titleRef} className={`transition-all duration-1000 mb-16 ${titleInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionHeading
            title="Enterprise Features"
            description="Advanced blockchain analytics powered by cutting-edge artificial intelligence"
            gradientText="blue"
            className="mb-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 px-4 md:px-8">
          {features.map((feature, index) => (
            <div key={index} className="h-full">
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                delay={index * 100}
                variant={feature.variant}
                className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 h-full"
              />
            </div>
          ))}
        </div>
      </BorderGlow>
    </section>
  )
} 