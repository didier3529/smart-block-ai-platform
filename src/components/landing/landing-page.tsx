'use client'

import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "./hero-section"
import { FeaturesSection } from "./features-section"
import { HowItWorksSection } from "./how-it-works-section"
import { MultiChainSection } from "./multi-chain-section"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      
      {/* Additional sections from current version */}
      <div className="pt-10 md:pt-16">
        <FeaturesSection />
        <HowItWorksSection />
        <MultiChainSection />
      </div>
    </div>
  )
} 