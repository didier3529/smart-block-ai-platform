"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { BarChart3, Briefcase, CreditCard, ImageIcon, LayoutDashboard, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"

const navLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Portfolio",
    href: "/dashboard/portfolio",
    icon: Briefcase,
  },
  {
    name: "Market",
    href: "/dashboard/market",
    icon: BarChart3,
  },
  {
    name: "NFTs",
    href: "/dashboard/nfts",
    icon: ImageIcon,
  },
  {
    name: "Contracts",
    href: "/dashboard/contracts",
    icon: CreditCard,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="border-b border-white/10 bg-black/90">
      <div className="flex h-20 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="small" variant="bordered" singleLine={true} />
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-white/10 px-2 py-3">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon className="mr-3 h-5 w-5" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
