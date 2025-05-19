"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "@/components/ui/use-toast"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // State for dropdowns
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  
  // Refs for dropdown menus
  const featuresRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  const { connectWallet, isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (featuresRef.current && !featuresRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false)
      }
      if (aboutRef.current && !aboutRef.current.contains(event.target as Node)) {
        setAboutOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  // Features dropdown items
  const featuresItems = [
    { label: "Real-time Analytics", href: "#analytics" },
    { label: "Smart Contracts Audit", href: "#audit" },
    { label: "AI Predictions", href: "#predictions" },
    { label: "Market Insights", href: "#insights" },
  ]
  
  // About dropdown items
  const aboutItems = [
    { label: "Our Team", href: "/about#team" },
    { label: "Vision", href: "/about#vision" },
    { label: "Roadmap", href: "/about#roadmap" },
    { label: "Partners", href: "/about#partners" },
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
              {/* Features Dropdown */}
              <div className="relative" ref={featuresRef}>
                <button
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  Features <ChevronDown size={16} className={`ml-1 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {featuresOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-black/90 backdrop-blur-md border border-purple-900/50 overflow-hidden z-10">
                    <div className="py-1 divide-y divide-gray-800/50">
                      {featuresItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-purple-900/20 transition-colors"
                          onClick={() => setFeaturesOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="absolute inset-0 border border-purple-500/20 rounded-md pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-800/10 to-blue-800/10 rounded-md pointer-events-none"></div>
                  </div>
                )}
              </div>
              
              {/* About Dropdown */}
              <div className="relative" ref={aboutRef}>
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  About <ChevronDown size={16} className={`ml-1 transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {aboutOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-black/90 backdrop-blur-md border border-blue-900/50 overflow-hidden z-10">
                    <div className="py-1 divide-y divide-gray-800/50">
                      {aboutItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-blue-900/20 transition-colors"
                          onClick={() => setAboutOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="absolute inset-0 border border-blue-500/20 rounded-md pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-800/10 to-purple-800/10 rounded-md pointer-events-none"></div>
                  </div>
                )}
              </div>
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
            {/* Mobile Features */}
            <div>
              <button
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className="flex items-center justify-between w-full py-2 text-gray-300 hover:text-white transition-colors"
              >
                <span>Features</span>
                <ChevronDown size={16} className={`transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {featuresOpen && (
                <div className="pl-4 mt-2 space-y-2 border-l border-purple-800/30">
                  {featuresItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-2 text-sm text-gray-400 hover:text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Mobile About */}
            <div>
              <button
                onClick={() => setAboutOpen(!aboutOpen)}
                className="flex items-center justify-between w-full py-2 text-gray-300 hover:text-white transition-colors"
              >
                <span>About</span>
                <ChevronDown size={16} className={`transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {aboutOpen && (
                <div className="pl-4 mt-2 space-y-2 border-l border-blue-800/30">
                  {aboutItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-2 text-sm text-gray-400 hover:text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
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