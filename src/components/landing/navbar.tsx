"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "@/components/ui/use-toast"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { connectWallet, isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleConnectWallet = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // If already authenticated, navigate to dashboard
      if (isAuthenticated) {
        router.push("/dashboard")
        return
      }
      
      // Try to connect wallet
      const success = await connectWallet()
      
      if (success) {
        // If connection successful, navigate to dashboard
        router.push("/dashboard")
      } else {
        // Show error toast if connection failed
        toast({
          title: "Connection failed",
          description: "Could not connect to wallet. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, connectWallet, router])

  // Simple landing page navigation items
  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "About", href: "/about" },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="large" variant="bordered" singleLine={true} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6 text-sm">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-6"
            >
              {isLoading ? "Loading..." : isAuthenticated ? "Dashboard" : "Connect Wallet"}
            </Button>
          </div>

          {/* Mobile Navigation Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-6 space-y-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button
              onClick={async () => {
                setIsOpen(false)
                await handleConnectWallet()
              }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full mt-4"
            >
              {isLoading ? "Loading..." : isAuthenticated ? "Dashboard" : "Connect Wallet"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
} 