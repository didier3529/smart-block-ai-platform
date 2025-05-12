"use client"

import React, { createContext, useContext, useState } from "react"
import { apiClient } from "@/lib/api/config"

interface Settings {
  theme: "light" | "dark" | "system"
  layout: "default" | "compact"
  security: {
    twoFactorEnabled: boolean
    loginAlerts: boolean
    autoLockTimeout: "5" | "15" | "30" | "60" | "never"
  }
  profile: {
    name: string
    email: string
    username: string
    walletAddress: string
  }
  apiKeys: {
    key: string
    lastGenerated: string
  }
  billing: {
    plan: "free" | "pro" | "enterprise"
    cycle: "monthly" | "yearly"
    nextBilling: string
    amount: number
  }
}

interface SettingsContextType {
  isLoading: boolean
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>
  regenerateApiKey: () => Promise<void>
  updateProfile: (profile: Partial<Settings['profile']>) => Promise<void>
  updateSecurity: (security: Partial<Settings['security']>) => Promise<void>
  updateBilling: (billing: Partial<Settings['billing']>) => Promise<void>
}

const defaultSettings: Settings = {
  theme: "dark",
  layout: "default",
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
    autoLockTimeout: "15"
  },
  profile: {
    name: "",
    email: "",
    username: "",
    walletAddress: ""
  },
  apiKeys: {
    key: "",
    lastGenerated: new Date().toISOString()
  },
  billing: {
    plan: "free",
    cycle: "monthly",
    nextBilling: "",
    amount: 0
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  const updateSettings = async (newSettings: Partial<Settings>) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/api/settings', newSettings)
      setSettings((prev) => ({ ...prev, ...response.data }))
    } catch (error) {
      console.error("Failed to update settings:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateApiKey = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/api/settings/regenerate-api-key')
      setSettings((prev) => ({
        ...prev,
        apiKeys: {
          key: response.data.key,
          lastGenerated: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error("Failed to regenerate API key:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (profile: Partial<Settings['profile']>) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/api/settings/profile', profile)
      setSettings((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...response.data }
      }))
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateSecurity = async (security: Partial<Settings['security']>) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/api/settings/security', security)
      setSettings((prev) => ({
        ...prev,
        security: { ...prev.security, ...response.data }
      }))
    } catch (error) {
      console.error("Failed to update security settings:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateBilling = async (billing: Partial<Settings['billing']>) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/api/settings/billing', billing)
      setSettings((prev) => ({
        ...prev,
        billing: { ...prev.billing, ...response.data }
      }))
    } catch (error) {
      console.error("Failed to update billing settings:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        isLoading,
        settings,
        updateSettings,
        regenerateApiKey,
        updateProfile,
        updateSecurity,
        updateBilling
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettingsContext must be used within a SettingsProvider")
  }
  return context
} 