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
          "transition-all duration-500 hover:-translate-y-2",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          className,
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <Card className="bg-black/40 border-0 relative overflow-hidden h-full">
          {/* Add subtle geometric shape in background */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 opacity-10 rotate-45 blur-sm">
            <div className={`w-full h-full gradient-${variant === "primary" ? "phantom" : variant}`}></div>
          </div>

          <CardHeader>
            <div
              className={`w-14 h-14 rounded-md gradient-${variant === "primary" ? "phantom" : variant} flex items-center justify-center mb-4 transition-transform duration-500 hover:scale-110 animate-pulse-glow`}
            >
              {icon}
            </div>
            <CardTitle className={`text-xl font-semibold ${getTextGradientClass()}`}>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{description}</p>
          </CardContent>
        </Card>
      </BorderGlow>
    </div>
  )
} 