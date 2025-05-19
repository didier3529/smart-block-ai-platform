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
        return "from-purple-400 to-purple-600"
      case "blue":
        return "from-blue-400 to-blue-600"
      case "teal":
        return "from-teal-400 to-teal-600"
      case "orange":
        return "from-orange-400 to-orange-600"
      default:
        return "from-purple-400 to-blue-600"
    }
  }

  const getBackgroundGradient = () => {
    switch (variant) {
      case "purple":
        return "from-purple-500/5 to-purple-900/20"
      case "blue":
        return "from-blue-500/5 to-blue-900/20"
      case "teal":
        return "from-teal-500/5 to-teal-900/20"
      case "orange":
        return "from-orange-500/5 to-orange-900/20"
      default:
        return "from-purple-500/5 to-blue-900/20"
    }
  }

  return (
    <div ref={ref} className="h-full">
      <BorderGlow
        glowColor={getGlowColor()}
        className={cn(
          "transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] h-full",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          className,
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <Card className={cn(
          "bg-gradient-to-br backdrop-blur-xl border-0 relative overflow-hidden h-full min-h-[280px]",
          `bg-gradient-to-br ${getBackgroundGradient()}`
        )}>
          {/* Enhanced background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-sm"></div>
          <div className="absolute -right-20 -bottom-20 w-60 h-60 opacity-[0.03] rotate-45 blur-3xl">
            <div className={`w-full h-full bg-gradient-to-r ${getTextGradientClass()}`}></div>
          </div>
          
          {/* Additional subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-900/10 rounded-xl"></div>

          <CardHeader className="relative z-10 pb-4 pt-7 px-7">
            <div
              className={cn(
                "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center mb-6",
                "transition-all duration-500 hover:scale-110 group",
                "shadow-lg",
                `bg-gradient-to-br ${getTextGradientClass()}`
              )}
            >
              <div className="p-3.5 text-white group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
            </div>
            <CardTitle className={cn(
              "text-2xl font-bold tracking-tight",
              "bg-gradient-to-r bg-clip-text text-transparent",
              getTextGradientClass()
            )}>
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 px-7 pt-0 pb-7">
            <p className="text-gray-300 leading-relaxed text-base">{description}</p>
          </CardContent>
          
          {/* Add subtle bottom glow effect */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        </Card>
      </BorderGlow>
    </div>
  )
}