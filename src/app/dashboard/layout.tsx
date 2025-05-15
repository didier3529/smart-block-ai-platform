"use client"

import { UnifiedLayout } from "@/components/layout/unified-layout"
import { AuthProvider } from "@/lib/providers/auth-provider"
import { LoadingProvider } from "@/lib/providers/loading-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <LoadingProvider>
        <UnifiedLayout>
          <header className="border-b">
            <div className="flex h-16 items-center px-4">
              <div className="ml-auto flex items-center space-x-4">
                {/* <WebSocketStatus /> */}
              </div>
            </div>
          </header>
          {children}
        </UnifiedLayout>
      </LoadingProvider>
    </AuthProvider>
  )
}