import React from "react"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Market Analysis - SmartBlockAI',
  description: 'Real-time market analysis and trends powered by AI.',
}

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 