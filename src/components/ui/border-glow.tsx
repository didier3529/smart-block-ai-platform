"use client"

import { cn } from "@/lib/utils"
import type React from "react"

interface BorderGlowProps {
  children: React.ReactNode
  className?: string
  containerClassName?: string
  glowColor?: "purple" | "blue" | "teal" | "orange" | "default"
}

export function BorderGlow({ children, className, containerClassName, glowColor = "default" }: BorderGlowProps) {
  const getGlowColorClass = () => {
    switch (glowColor) {
      case "purple":
        return "from-purple-500/30 via-purple-500/20 to-purple-500/30"
      case "blue":
        return "from-blue-500/30 via-blue-500/20 to-blue-500/30"
      case "teal":
        return "from-teal-500/30 via-teal-500/20 to-teal-500/30"
      case "orange":
        return "from-orange-500/30 via-orange-500/20 to-orange-500/30"
      default:
        return "from-purple-500/30 via-purple-500/20 to-purple-500/30"
    }
  }

  return (
    <div className={cn("relative p-[1px] rounded-lg overflow-hidden", containerClassName)}>
      <div className={cn("absolute inset-0 rounded-lg bg-gradient-to-br", getGlowColorClass())} />
      <div className={cn("relative bg-black/80 backdrop-blur-sm rounded-lg z-10 h-full", className)}>{children}</div>
    </div>
  )
} 