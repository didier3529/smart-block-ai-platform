"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "@/components/ui/use-toast"

export function HeroSection() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { connectWallet, isAuthenticated } = useAuth()

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true)
      
      // If already authenticated, navigate to dashboard
      if (isAuthenticated) {
        router.push("/dashboard")
        return
      }
      
      // Connect wallet and authenticate
      const success = await connectWallet()
      
      if (success) {
        // Only navigate to dashboard if connection was successful
        router.push("/dashboard")
      } else {
        toast({
          title: "Connection failed",
          description: "Could not connect to wallet. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Connection error:", error)
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive", 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 to-transparent opacity-50"></div>

      <div className="container mx-auto px-4 pt-20 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">UNLEASH THE</span>
            <br />
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              POWER OF BLOCKCHAIN
            </span>
            <br />
            <span className="text-white">INTELLIGENCE</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Advanced analytics and insights for blockchain assets, powered by cutting-edge AI technology.
          </p>

          <div className="flex justify-center">
            <Button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 rounded-full text-lg"
            >
              {isLoading ? "Connecting..." : isAuthenticated ? "Enter Dashboard" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 