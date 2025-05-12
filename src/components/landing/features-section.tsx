'use client'

import { BarChart3, Search, ShieldCheck, Gem } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { FeatureCard } from "@/components/ui/feature-card"
import { SectionHeading } from "@/components/ui/section-heading"
import { BorderGlow } from "@/components/ui/border-glow"

export function FeaturesSection() {
  const { ref: titleRef, isInView: titleInView } = useInView({ threshold: 0.1 })

  const features = [
    {
      title: "Portfolio Analyst",
      description: "Get deep insights into your crypto portfolio performance and optimization recommendations.",
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      variant: "purple" as const,
    },
    {
      title: "Trend Spotter",
      description:
        "Identify emerging patterns and opportunities across multiple blockchains before they go mainstream.",
      icon: <Search className="w-6 h-6 text-white" />,
      variant: "blue" as const,
    },
    {
      title: "Smart Contract Analyzer",
      description: "Evaluate contract security, efficiency, and potential vulnerabilities before you invest.",
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      variant: "teal" as const,
    },
    {
      title: "NFT Advisor",
      description: "Discover promising collections and receive personalized recommendations based on market data.",
      icon: <Gem className="w-6 h-6 text-white" />,
      variant: "orange" as const,
    },
  ]

  return (
    <section className="section-padding relative bg-black" id="features">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/5 to-black -z-10" />

      {/* Add geometric shapes in background */}
      <div className="absolute top-20 left-10 w-40 h-40 rotate-45 opacity-5 blur-xl">
        <div className="w-full h-full gradient-purple-blue"></div>
      </div>
      <div className="absolute bottom-20 right-10 w-60 h-60 -rotate-12 opacity-5 blur-xl">
        <div className="w-full h-full gradient-phantom"></div>
      </div>

      <BorderGlow containerClassName="container mx-auto max-w-7xl" className="container-padding">
        <div ref={titleRef} className={`transition-all duration-1000 ${titleInView ? "opacity-100" : "opacity-0"}`}>
          <SectionHeading
            title="Specialized AI Agents"
            description="Our AI-powered agents work together to provide comprehensive blockchain intelligence"
            gradientText="blue"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              delay={index * 100}
              variant={feature.variant}
            />
          ))}
        </div>
      </BorderGlow>
    </section>
  )
} 