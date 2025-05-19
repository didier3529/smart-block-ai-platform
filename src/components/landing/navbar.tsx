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
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white flex items-center gap-1 text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group"
                  >
                    <span className="group-hover:text-purple-400 transition-all duration-300">Features</span>
                    <ChevronDown className="h-5 w-5 text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[800px] bg-[#141428] backdrop-blur-md text-white border border-purple-500/10 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.15)] p-0 overflow-hidden mt-2"
                  sideOffset={10}
                >
                  <div className="p-6 relative z-10">
                    <h2 className="text-3xl font-bold text-purple-400 mb-8 tracking-tight px-2">
                      Features
                    </h2>

                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
                      <div className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300">
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

                      <div className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300">
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

                      <div className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300">
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

                      <div className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                            <ImageIcon size={24} />
                          </div>
                          <h3 className="font-semibold text-orange-400 text-xl">
                            NFT Advisor
                          </h3>
                        </div>
                        <p className="text-base text-gray-300">
                          Discover promising NFT collections with valuation analysis
                        </p>
                      </div>

                      <div className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <Layers size={24} />
                          </div>
                          <h3 className="font-semibold text-purple-400 text-xl">
                            Multi-Chain Support
                          </h3>
                        </div>
                        <p className="text-base text-gray-300">
                          Cross-chain analytics for Ethereum, Polygon, and more
                        </p>
                      </div>

                      <div className="group bg-[#181830] rounded-xl p-5 hover:bg-[#1c1c3a] transition-all duration-300">
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
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white flex items-center gap-1 text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group"
                  >
                    <span className="group-hover:text-purple-400 transition-all duration-300">About</span>
                    <ChevronDown className="h-5 w-5 text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[500px] bg-[#141428] backdrop-blur-md text-white border border-purple-500/10 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.15)] p-0 overflow-hidden mt-2"
                  sideOffset={10}
                >
                  <div className="p-6 relative z-10">
                    <h2 className="text-3xl font-bold text-purple-400 mb-4 tracking-tight">
                      About
                    </h2>

                    <p className="text-base text-gray-200 mb-6">
                      <span className="text-purple-400 font-semibold">Smart Block AI</span> is an AI-powered blockchain
                      analytics platform providing intelligence across multiple blockchains.
                    </p>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-[#181830] rounded-xl p-4 hover:bg-[#1c1c3a] transition-all duration-300">
                        <h3 className="font-medium text-purple-400 text-lg mb-2">Our Mission</h3>
                        <p className="text-base text-gray-300">Democratize blockchain analytics with AI-driven insights</p>
                      </div>

                      <div className="bg-[#181830] rounded-xl p-4 hover:bg-[#1c1c3a] transition-all duration-300">
                        <h3 className="font-medium text-purple-400 text-lg mb-2">Our Vision</h3>
                        <p className="text-base text-gray-300">Lead the future of blockchain intelligence</p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white flex items-center gap-1 text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group"
                  >
                    <span className="group-hover:text-purple-400 transition-all duration-300">Features</span>
                    <ChevronDown className="h-5 w-5 text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[calc(100vw-2rem)] bg-[#141428] backdrop-blur-md text-white border border-purple-500/10 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.15)] p-0 overflow-hidden"
                  sideOffset={10}
                >
                  <div className="p-6 relative z-10">
                    <h2 className="text-3xl font-bold text-purple-400 mb-8 tracking-tight">
                      Features
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Mobile Features content - simplified for mobile */}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white flex items-center gap-1 text-lg font-medium hover:text-purple-400 hover:bg-transparent transition-colors group"
                  >
                    <span className="group-hover:text-purple-400 transition-all duration-300">About</span>
                    <ChevronDown className="h-5 w-5 text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[calc(100vw-2rem)] bg-[#141428] backdrop-blur-md text-white border border-purple-500/10 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.15)] p-0 overflow-hidden"
                  sideOffset={10}
                >
                  <div className="p-6 relative z-10">
                    <h2 className="text-3xl font-bold text-purple-400 mb-4 tracking-tight">
                      About
                    </h2>
                    {/* Mobile About content - simplified for mobile */}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
  )
} 