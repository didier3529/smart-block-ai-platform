"use client";

import React, { useState } from 'react';
import { Header } from "@/components/ui/header";
import { Drawer, DrawerContent, DrawerPortal } from "@/components/ui/drawer";
// import { DiagnosticErrorBoundary } from "@/components/DiagnosticErrorBoundary";

export function NavigationExample() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();

  // Mock wallet connection
  const handleConnectWallet = () => {
    setWalletAddress("0x1234567890abcdef");
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(undefined);
  };

  return (
    // <DiagnosticErrorBoundary>
      <div className="min-h-screen">
        {/* Header with wallet connection */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          walletAddress={walletAddress}
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet}
        />

        {/* Mobile navigation drawer - minimal version */}
        <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <DrawerPortal>
            <DrawerContent side="left">
              <div>Minimal Drawer Content</div>
            </DrawerContent>
          </DrawerPortal>
        </Drawer>

        {/* Main content area - minimal version */}
        <main className="container p-4">
          <div>Hello World</div>
        </main>
      </div>
    // </DiagnosticErrorBoundary>
  );
} 