"use client"

import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative h-16 w-16 mb-8">
          {/* Outer ring with gradient */}
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#9333EA] border-r-[#9333EA]" />
          {/* Inner ring with opposite animation */}
          <div className="absolute inset-0 animate-spin-reverse rounded-full border-4 border-transparent border-b-[#9333EA] border-l-[#9333EA]" />
        </div>
        <p className="text-lg font-medium text-[#9333EA]">Loading...</p>
      </div>
    </div>
  )
} 