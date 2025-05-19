"use client"

import { useState, useEffect, useCallback } from "react"
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

            {/* Mobile Navigation Toggle */}
            <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isOpen && (
            <div className="md:hidden pt-4 pb-6 space-y-4">
              <div className="flex flex-col space-y-4">
                <Button
                  variant="ghost"
                  className="text-white flex items-center justify-between w-full text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group"
                  onClick={toggleFeaturesMenu}
                >
                  <span className="group-hover:text-purple-400 transition-all duration-300">Features</span>
                  <ChevronDown className={`h-5 w-5 text-purple-400 transition-transform duration-300 ${featuresMenuOpen ? 'rotate-180' : ''}`} />
                </Button>

                <Button
                  variant="ghost"
                  className="text-white flex items-center justify-between w-full text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group"
                  onClick={toggleAboutMenu}
                >
                  <span className="group-hover:text-purple-400 transition-all duration-300">About</span>
                  <ChevronDown className={`h-5 w-5 text-purple-400 transition-transform duration-300 ${aboutMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              <Button
                onClick={async () => {
                  setIsOpen(false)
                  await handleConnectWallet()
                }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full py-6 text-lg font-medium"
              >
                {isLoading ? "Loading..." : isAuthenticated ? "Dashboard" : "Connect Wallet"}
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Full-page Features Menu */}
      <FullPageMenu isOpen={featuresMenuOpen} onClose={closeFeaturesMenu} title="Features">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-4">
          <div 
            onClick={() => {
              closeFeaturesMenu();
              router.push('/dashboard/portfolio');
            }}
            className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <Zap size={24} />
              </div>
              <h3 className="font-semibold text-purple-400 text-xl">
                Portfolio Analyst
              </h3>
            </div>
            <p className="text-base text-gray-300">
              Deep insights and optimization for your crypto portfolio
            </p>
          </div>

          <div 
            onClick={() => {
              closeFeaturesMenu();
              router.push('/dashboard/market');
            }}
            className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp size={24} />
              </div>
              <h3 className="font-semibold text-blue-400 text-xl">
                Trend Spotter
              </h3>
            </div>
            <p className="text-base text-gray-300">
              Early detection of market opportunities and patterns
            </p>
          </div>

          <div 
            onClick={() => {
              closeFeaturesMenu();
              router.push('/dashboard/contracts');
            }}
            className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                <Code size={24} />
              </div>
              <h3 className="font-semibold text-teal-400 text-xl">
                Smart Contract Analyzer
              </h3>
            </div>
            <p className="text-base text-gray-300">
              Security analysis and optimization for smart contracts
            </p>
          </div>

          <div 
            onClick={() => {
              closeFeaturesMenu();
              router.push('/dashboard/nfts');
            }}
            className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ImageIcon size={24} />
              </div>
              <h3 className="font-semibold text-emerald-400 text-xl">
                NFT Analytics
              </h3>
            </div>
            <p className="text-base text-gray-300">
              Valuation and trends for your NFT collections
            </p>
          </div>

          <div 
            onClick={() => {
              closeFeaturesMenu();
              router.push('/dashboard/settings');
            }}
            className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
                <Layers size={24} />
              </div>
              <h3 className="font-semibold text-pink-400 text-xl">
                Multi-chain Support
              </h3>
            </div>
            <p className="text-base text-gray-300">
              Unified analysis across multiple blockchain networks
            </p>
          </div>

          <div 
            onClick={() => {
              closeFeaturesMenu();
              router.push('/dashboard/ai');
            }}
            className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <Brain size={24} />
              </div>
              <h3 className="font-semibold text-blue-400 text-xl">
                AI-Powered Intelligence
              </h3>
            </div>
            <p className="text-base text-gray-300">
              Specialized AI agents providing predictive insights
            </p>
          </div>
        </div>
      </FullPageMenu>

      {/* Full-page About Menu */}
      <FullPageMenu isOpen={aboutMenuOpen} onClose={closeAboutMenu} title="About">
        <div className="space-y-6 max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
            <span className="text-purple-400 font-semibold">Smart Block AI</span> is an AI-powered blockchain
            analytics platform providing intelligence across multiple blockchains to help you make smarter investment decisions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <div className="bg-[#181830] rounded-xl p-6 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg text-center">
              <h3 className="font-medium text-purple-400 text-xl mb-3">Our Mission</h3>
              <p className="text-lg text-gray-300">Democratize blockchain analytics with AI-driven insights, making complex data accessible to everyone.</p>
            </div>

            <div className="bg-[#181830] rounded-xl p-6 hover:bg-[#1c1c3a] transition-all duration-300 hover:shadow-lg text-center">
              <h3 className="font-medium text-purple-400 text-xl mb-3">Our Vision</h3>
              <p className="text-lg text-gray-300">Lead the future of blockchain intelligence by combining artificial intelligence with blockchain data.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center mt-12 space-y-6">
            <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 text-center">Ready to elevate your blockchain experience?</h3>
            <Button 
              onClick={() => {
                closeAboutMenu();
                handleConnectWallet();
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-12 py-6 text-xl font-medium"
            >
              {isLoading ? "Loading..." : isAuthenticated ? "Go to Dashboard" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </FullPageMenu>
    </>
  )
} 