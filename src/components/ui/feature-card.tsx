import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import { BorderGlow } from "@/components/ui/border-glow"

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  delay: number
  variant?: "primary" | "purple" | "blue" | "teal" | "orange"
  className?: string
}

export function FeatureCard({ title, description, icon, delay, variant = "primary", className }: FeatureCardProps) {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  const getGlowColor = () => {
    switch (variant) {
      case "purple":
        return "purple"
      case "blue":
        return "blue"
      case "teal":
        return "teal"
      case "orange":
        return "orange"
      default:
        return "default"
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
    <div ref={ref}>
      <BorderGlow
        glowColor={getGlowColor()}
        className={cn(
          "transition-all duration-500 hover:-translate-y-2 h-full",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          className,
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <Card className="bg-black/40 border-0 relative overflow-hidden h-full flex flex-col">
          {/* Enhanced background effects */}
          <div className="absolute -right-20 -bottom-20 w-60 h-60 opacity-10 rotate-45 blur-xl">
            <div className={`w-full h-full gradient-${variant === "primary" ? "phantom" : variant}`}></div>
          </div>
          
          {/* Additional subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-900/10 rounded-xl"></div>

          <CardHeader className="pb-2">
            <div
              className={`w-16 h-16 rounded-lg gradient-${variant === "primary" ? "phantom" : variant} flex items-center justify-center mb-6 transition-transform duration-500 hover:scale-110 shadow-lg shadow-${variant}-500/20`}
            >
              {icon}
            </div>
            <CardTitle className={`text-2xl font-semibold ${getTextGradientClass()} mb-2`}>{title}</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-grow">
            <p className="text-gray-300 text-base leading-relaxed">{description}</p>
          </CardContent>
          
          {/* Add subtle bottom glow effect */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        </Card>
      </BorderGlow>
    </div>
  )
}