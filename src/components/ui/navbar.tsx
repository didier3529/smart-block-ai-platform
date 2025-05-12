"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "@/components/ui/use-toast"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const router = useRouter()
  const { user, connectWallet, isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavigation = useCallback((path: string) => {
    startTransition(() => {
      router.push(path)
    })
  }, [router])

  const handleConnectWallet = useCallback(async () => {
    try {
      // If already authenticated, just navigate to dashboard
      if (isAuthenticated) {
        handleNavigation("/dashboard")
        return
      }
      
      // Try to connect wallet
      const success = await connectWallet()
      
      if (success) {
        // If connection successful, navigate to dashboard
        handleNavigation("/dashboard")
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
    }
  }, [isAuthenticated, connectWallet, handleNavigation])

  // Define navigation items based on authentication state
  const getNavItems = useCallback(() => {
    if (isAuthenticated) {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Portfolio", href: "/portfolio" },
        { label: "Market", href: "/market" },
        { label: "Smart Contracts", href: "/smart-contracts" },
        { label: "NFTs", href: "/nfts" },
      ]
    } else {
      return [
        { label: "Features", href: "/#features" },
        { label: "How it Works", href: "/#how-it-works" },
        { label: "About", href: "/about" },
      ]
    }
  }, [isAuthenticated])

  const navItems = getNavItems()

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
            <Logo size={isScrolled ? "small" : "medium"} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6 text-sm">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors ${
                    pathname === item.href || pathname.startsWith(item.href.split('#')[0] + '/')
                      ? "text-white font-medium" 
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Button
              onClick={handleConnectWallet}
              disabled={isPending || authLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-6"
            >
              {isPending || authLoading ? "Loading..." : isAuthenticated ? "Dashboard" : "Connect Wallet"}
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
                className={`block py-2 transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href.split('#')[0] + '/') 
                    ? "text-white font-medium" 
                    : "text-gray-300 hover:text-white"
                }`}
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
              disabled={isPending || authLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full mt-4"
            >
              {isPending || authLoading ? "Loading..." : isAuthenticated ? "Dashboard" : "Connect Wallet"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
} 