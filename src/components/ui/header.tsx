"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Menu } from "lucide-react";
import Link from 'next/link';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  onMenuClick?: () => void;
  walletAddress?: string;
  onConnectWallet?: () => void;
  onDisconnectWallet?: () => void;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, onMenuClick, walletAddress, onConnectWallet, onDisconnectWallet, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}
        {...props}
      >
        <div className="container flex h-14 items-center">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Logo/Brand */}
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold">Smart Block AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:flex-1">
            <ul className="flex items-center gap-6">
              <li>
                <a
                  href="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/agents"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  AI Agents
                </a>
              </li>
              <li>
                <a
                  href="/analytics"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Analytics
                </a>
              </li>
            </ul>
          </nav>

          {/* Wallet Connection */}
          <div className="ml-auto flex items-center gap-4">
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm md:inline-block">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnectWallet}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={onConnectWallet}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>
    );
  }
);
Header.displayName = "Header";

export { Header }; 