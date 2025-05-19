'use client'

import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "./hero-section"
import { FeaturesSection } from "./features-section"
import { MultiChainSection } from "./multi-chain-section"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      
      {/* Only include Features and MultiChain sections */}
      <div className="pt-10 md:pt-16">
        <FeaturesSection />
        <MultiChainSection />
      </div>
    </div>
  )
} 