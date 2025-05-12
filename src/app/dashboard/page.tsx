"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { useAuth } from "@/lib/providers/auth-provider"

export default function Dashboard() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth()
  const router = useRouter()

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, authIsLoading, router])

  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Only render dashboard content if authenticated and auth is not loading
  return isAuthenticated ? <DashboardPage authLoading={authIsLoading} /> : null
} 