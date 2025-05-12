'use client'

import type React from "react"
import { Brain, Wallet, BarChartIcon as ChartBar, Zap } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { SectionHeading } from "@/components/ui/section-heading"
import { BorderGlow } from "@/components/ui/border-glow"

interface StepProps {
  number: number
  title: string
  description: string
  icon: React.ReactNode
  delay: number
  variant: "purple" | "blue" | "teal" | "orange"
}

function Step({ number, title, description, icon, delay, variant }: StepProps) {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  const getGradientClass = () => {
    switch (variant) {
      case "purple":
        return "gradient-purple-blue"
      case "blue":
        return "gradient-blue-teal"
      case "teal":
        return "gradient-teal-green"
      case "orange":
        return "gradient-orange-pink"
      default:
        return "gradient-primary"
    }
  }

  const getTextGradientClass = () => {
    switch (variant) {
      case "purple":
        return "gradient-text-purple"
      case "blue":
        return "gradient-text-blue"
      case "teal":
        return "gradient-text-blue"
      case "orange":
        return "gradient-text-orange"
      default:
        return "gradient-text"
    }
  }

  return (
    <BorderGlow
      glowColor={variant}
      className={`p-8 transition-all duration-700 relative overflow-hidden ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Add geometric shape in background */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 opacity-10 rotate-45 blur-sm">
        <div className={`w-full h-full ${getGradientClass()}`}></div>
      </div>

      <div ref={ref} className="flex flex-col items-center text-center relative z-10">
        <div className="relative">
          <div
            className={`w-16 h-16 rounded-md ${getGradientClass()} flex items-center justify-center mb-4 transition-transform duration-500 hover:scale-110`}
          >
            {icon}
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center animate-pulse">
            {number}
          </div>
        </div>
        <h3 className={`text-2xl font-semibold mt-4 mb-3 ${getTextGradientClass()}`}>{title}</h3>
        <p className="text-gray-300 text-lg">{description}</p>
      </div>
    </BorderGlow>
  )
}

export function HowItWorksSection() {
  const { ref: titleRef, isInView: titleInView } = useInView({ threshold: 0.1 })

  const steps = [
    {
      number: 1,
      title: "Connect Wallet",
      description: "Securely connect your crypto wallet to grant access to your portfolio data.",
      icon: <Wallet className="w-6 h-6 text-white" />,
      variant: "purple" as const,
    },
    {
      number: 2,
      title: "AI Analysis",
      description: "Our specialized AI agents analyze your holdings and relevant market data.",
      icon: <Brain className="w-6 h-6 text-white" />,
      variant: "blue" as const,
    },
    {
      number: 3,
      title: "Get Insights",
      description: "Receive personalized insights, recommendations, and opportunity alerts.",
      icon: <ChartBar className="w-6 h-6 text-white" />,
      variant: "teal" as const,
    },
    {
      number: 4,
      title: "Take Action",
      description: "Make informed decisions based on AI-powered blockchain intelligence.",
      icon: <Zap className="w-6 h-6 text-white" />,
      variant: "orange" as const,
    },
  ]

  return (
    <section className="section-padding relative bg-black" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/5 to-black -z-10" />

      {/* Add geometric shapes in background */}
      <div className="absolute top-40 right-10 w-60 h-60 rotate-12 opacity-5 blur-xl">
        <div className="w-full h-full gradient-blue-teal"></div>
      </div>
      <div className="absolute bottom-40 left-10 w-40 h-40 -rotate-20 opacity-5 blur-xl">
        <div className="w-full h-full gradient-purple-blue"></div>
      </div>

      <BorderGlow containerClassName="container mx-auto max-w-7xl" className="container-padding">
        <div ref={titleRef} className={`transition-all duration-1000 ${titleInView ? "opacity-100" : "opacity-0"}`}>
          <SectionHeading
            title="How SmartBlockAI Works"
            description="Simple steps to unlock powerful blockchain intelligence"
            gradientText="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Step
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              delay={index * 150}
              variant={step.variant}
            />
          ))}
        </div>
      </BorderGlow>
    </section>
  )
} 