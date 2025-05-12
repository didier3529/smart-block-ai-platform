"use client"

import { useState } from "react"
import { Bell, ChevronDown, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function WalletHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Mock wallet address
  const walletAddress = "0x1a2b3c4d5e6f7g8h9i0j"
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-black/90 px-6 backdrop-blur-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center rounded-full bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
          >
            <span className="mr-2">{shortAddress}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-gray-900 p-2 shadow-lg">
              <div className="mb-2 rounded-md bg-gray-800 p-3">
                <div className="mb-1 text-xs text-gray-400">Connected Wallet</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{shortAddress}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={copyToClipboard}
                      className={cn(
                        "rounded p-1 transition-colors",
                        isCopied ? "text-green-400" : "text-gray-400 hover:text-white",
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`https://etherscan.io/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-sm font-normal text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Switch Wallet
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-sm font-normal text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
