"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BarChart3,
  LineChart,
  FileCode,
  Gem,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/providers/auth-provider"

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href: string
  description?: string
  isActive: boolean
}

const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of your portfolio and market",
  },
  {
    label: "Portfolio",
    href: "/dashboard/portfolio",
    icon: BarChart3,
    description: "Track and manage your assets",
  },
  {
    label: "Market Analysis",
    href: "/dashboard/market",
    icon: LineChart,
    description: "Market trends and analysis",
  },
  {
    label: "Smart Contracts",
    href: "/dashboard/contracts",
    icon: FileCode,
    description: "Smart contract security and analysis",
  },
  {
    label: "NFT Analysis",
    href: "/dashboard/nfts",
    icon: Gem,
    description: "NFT collections and analytics",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Account and application settings",
  },
]

function SidebarItem({ icon, label, href, description, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive
          ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white"
          : "text-gray-400 hover:text-white hover:bg-white/5",
      )}
    >
      <div className={cn("w-6 h-6 flex items-center justify-center", isActive && "text-purple-400")}>
        {icon}
      </div>
      <span>{label}</span>
      {isActive && <div className="ml-auto w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />}
    </Link>
  )
}

export function UnifiedSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-black/80 backdrop-blur-sm w-64"
      >
        {/* Header */}
        <div className="flex h-20 items-center border-b border-white/10 px-4">
          <Link href="/dashboard" className="flex items-center overflow-hidden">
            <Logo size="medium" variant="bordered" singleLine={true} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
              return (
                <li key={link.href}>
                  <SidebarItem
                    icon={<link.icon size={18} />}
                    label={link.label}
                    href={link.href}
                    description={link.description}
                    isActive={isActive}
                  />
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Disconnect</span>
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
} 