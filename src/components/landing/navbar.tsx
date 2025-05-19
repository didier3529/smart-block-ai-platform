"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, ChevronDown, Zap, TrendingUp, Code, ImageIcon, Layers, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FullPageMenu } from "@/components/ui/full-page-menu"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Full page menu states
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false)
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false)
  
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
      await connectWallet()
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [connectWallet, router, toast])

  // Close any open menus when mobile menu is toggled
  useEffect(() => {
    if (isOpen) {
      setFeaturesMenuOpen(false)
      setAboutMenuOpen(false)
    }
  }, [isOpen])

  // Close mobile menu when a full-page menu is opened
  useEffect(() => {
    if (featuresMenuOpen || aboutMenuOpen) {
      setIsOpen(false)
    }
  }, [featuresMenuOpen, aboutMenuOpen])

  const toggleFeaturesMenu = () => {
    setFeaturesMenuOpen(!featuresMenuOpen)
    if (aboutMenuOpen) setAboutMenuOpen(false)
  }

  const toggleAboutMenu = () => {
    setAboutMenuOpen(!aboutMenuOpen)
    if (featuresMenuOpen) setFeaturesMenuOpen(false)
  }

  const closeFeaturesMenu = () => {
    setFeaturesMenuOpen(false)
  }

  const closeAboutMenu = () => {
    setAboutMenuOpen(false)
  }

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
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/80 backdrop-blur-md py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Logo 
                size="large" 
                variant="bordered" 
                singleLine={true}
                className="py-1"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-8">
                <Button
                  variant="ghost"
                  className="text-white flex items-center gap-1 text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group relative"
                  onClick={toggleFeaturesMenu}
                >
                  <span className="group-hover:text-purple-400 transition-all duration-300">Features</span>
                  <ChevronDown className={`h-5 w-5 text-purple-400 transition-transform duration-300 ${featuresMenuOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 group-hover:w-full transition-all duration-300"></span>
                </Button>

                <Button
                  variant="ghost"
                  className="text-white flex items-center gap-1 text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group relative"
                  onClick={toggleAboutMenu}
                >
                  <span className="group-hover:text-purple-400 transition-all duration-300">About</span>
                  <ChevronDown className={`h-5 w-5 text-purple-400 transition-transform duration-300 ${aboutMenuOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 group-hover:w-full transition-all duration-300"></span>
                </Button>
              </div>

              <Button
                onClick={handleConnectWallet}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-8 py-6 text-lg font-medium"
              >
                {isLoading ? "Loading..." : isAuthenticated ? "Dashboard" : "Connect Wallet"}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-transparent"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Menu className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Full Page Features Menu */}
      <FullPageMenu 
        isOpen={featuresMenuOpen} 
        onClose={closeFeaturesMenu}
        title="Platform Features"
        subtitle="Discover the tools to enhance your blockchain experience"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
          {/* Feature Cards */}
          <div className="bg-black/30 rounded-xl p-6 hover:bg-black/50 transition-all duration-300 border border-purple-500/20 hover:border-purple-500/40 group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">Real-time Analytics</h3>
            <p className="text-gray-300">Track and analyze blockchain data with powerful real-time visualizations.</p>
          </div>

          <div className="bg-black/30 rounded-xl p-6 hover:bg-black/50 transition-all duration-300 border border-purple-500/20 hover:border-purple-500/40 group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Code className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">Smart Contracts Audit</h3>
            <p className="text-gray-300">Verify and analyze smart contracts for security vulnerabilities.</p>
          </div>

          <div className="bg-black/30 rounded-xl p-6 hover:bg-black/50 transition-all duration-300 border border-purple-500/20 hover:border-purple-500/40 group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">AI Predictions</h3>
            <p className="text-gray-300">Leverage AI-driven tools to forecast market trends and opportunities.</p>
          </div>

          <div className="bg-black/30 rounded-xl p-6 hover:bg-black/50 transition-all duration-300 border border-purple-500/20 hover:border-purple-500/40 group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">Market Insights</h3>
            <p className="text-gray-300">Access deep market analysis and insights based on blockchain data.</p>
          </div>
        </div>
      </FullPageMenu>

      {/* Full Page About Menu */}
      <FullPageMenu 
        isOpen={aboutMenuOpen} 
        onClose={closeAboutMenu}
        title="About Us"
        subtitle="Learn more about our mission and vision"
        centerContent={true}
      >
        <div className="max-w-3xl mx-auto grid gap-12 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Our Team</h3>
            <p className="text-gray-300 text-lg">A passionate group of blockchain experts and developers dedicated to making crypto accessible.</p>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Vision</h3>
            <p className="text-gray-300 text-lg">To create a seamless and intuitive platform that bridges the gap between complex blockchain technology and everyday users.</p>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Roadmap</h3>
            <p className="text-gray-300 text-lg">Our strategic plan for continuous development and innovation in the blockchain space.</p>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Partners</h3>
            <p className="text-gray-300 text-lg">Collaborating with leading blockchain networks and financial institutions to provide comprehensive solutions.</p>
          </div>
        </div>
      </FullPageMenu>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-lg z-40 pt-20">
          <div className="container mx-auto px-6 py-8 flex flex-col space-y-8 text-center">
            <Button
              variant="ghost"
              onClick={toggleFeaturesMenu}
              className="text-white py-4 text-xl font-medium hover:text-purple-400 hover:bg-transparent transition-colors"
            >
              Features
            </Button>
            <Button
              variant="ghost"
              onClick={toggleAboutMenu}
              className="text-white py-4 text-xl font-medium hover:text-purple-400 hover:bg-transparent transition-colors"
            >
              About
            </Button>
            <div className="pt-4">
              <Button
                onClick={handleConnectWallet}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-10 py-7 text-xl w-full"
              >
                {isLoading ? "Loading..." : isAuthenticated ? "Dashboard" : "Connect Wallet"}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-transparent"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-8 w-8" />
          </Button>
        </div>
      )}
    </>
  )
}