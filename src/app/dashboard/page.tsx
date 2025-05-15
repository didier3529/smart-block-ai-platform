"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { useAuth } from "@/lib/providers/auth-provider"
import { LoadingScreen } from "@/components/ui/loading-screen"

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
    return <LoadingScreen />
  }

  // Only render dashboard content if authenticated and auth is not loading
  return isAuthenticated ? (
    <div>
      <DashboardPage authLoading={authIsLoading} />
    </div>
  ) : null
} 