'use client'

import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "./hero-section"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
    </div>
  )
} 