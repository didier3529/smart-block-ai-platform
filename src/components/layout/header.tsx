"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, logout, connectWallet } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-[var(--header-height)] items-center justify-end">
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button onClick={() => connectWallet()} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-6">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 