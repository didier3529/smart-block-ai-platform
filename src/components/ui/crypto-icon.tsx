"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"

interface CryptoIconProps {
  symbol: string
  size?: "sm" | "md" | "lg"
  className?: string
}

/**
 * A standardized component for displaying cryptocurrency icons with fallback
 * First tries to load from updated MCP logos, then falls back to existing icons
 */
export function CryptoIcon({ symbol, size = "md", className }: CryptoIconProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-10 w-10"
  }
  
  const [useFallback, setUseFallback] = useState(false)
  const symbolLower = symbol.toLowerCase()

  // Special case for Solana - use custom black background logo
  if (symbolLower === 'sol') {
    return (
      <svg 
        width="100" 
        height="100" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          sizeClasses[size],
          "rounded-full",
          className
        )}
      >
        <circle cx="50" cy="50" r="50" fill="#000000"/>
        <g transform="translate(20, 25)">
          <path d="M0 10 L45 0 L60 5 L15 15 L0 10Z" fill="url(#gradient1)"/>
          <path d="M0 25 L45 15 L60 20 L15 30 L0 25Z" fill="url(#gradient2)"/>
          <path d="M0 40 L45 30 L60 35 L15 45 L0 40Z" fill="url(#gradient3)"/>
        </g>
        <defs>
          <linearGradient id="gradient1" x1="0" y1="10" x2="60" y2="5" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9746FF"/>
            <stop offset="1" stopColor="#07F5DB"/>
          </linearGradient>
          <linearGradient id="gradient2" x1="0" y1="25" x2="60" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9746FF"/>
            <stop offset="1" stopColor="#07F5DB"/>
          </linearGradient>
          <linearGradient id="gradient3" x1="0" y1="40" x2="60" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#C935FF"/>
            <stop offset="1" stopColor="#5675FF"/>
          </linearGradient>
        </defs>
      </svg>
    )
  }

  // Try to load from the MCP logos directory first, fallback to existing icons
  const iconPath = useFallback
    ? `/crypto-icons/${symbolLower}.svg`
    : `/crypto-logos/mcp/${symbolLower}.svg`

  return (
    <img 
      src={iconPath}
      alt={symbol}
      className={cn(
        sizeClasses[size],
        "rounded-full",
        className
      )}
      onError={(e) => {
        if (!useFallback) {
          // First try the existing crypto-icons directory
          setUseFallback(true)
        } else {
          // If both fail, use svg fallback
          e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%233d3d3d'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='35' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3E${symbol.charAt(0)}%3C/text%3E%3C/svg%3E`;
        }
      }}
    />
  )
} 