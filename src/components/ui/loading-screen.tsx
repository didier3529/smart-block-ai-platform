"use client"

import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <p className="mt-4 text-lg text-gray-300">Loading...</p>
      </div>
    </div>
  )
} 