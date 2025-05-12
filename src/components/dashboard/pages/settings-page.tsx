"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSettingsContext } from "@/lib/providers/settings-provider"
import { useTheme } from "next-themes"
import {
  Bell,
  User,
  Sun,
  Lock,
  Key,
  CreditCard,
  Save,
  Moon,
  Globe,
  ChevronDown
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SettingsPage() {
  const { settings, isLoading, updateProfile, updateSecurity, updateNotifications, updateBilling, regenerateApiKey } = useSettingsContext()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "notifications" | "security" | "api-keys" | "billing">("profile")

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <Input 
                  type="text" 
                  defaultValue={settings.profile.name} 
                  className="bg-[#1a1a1f] border-white/10 text-white w-full"
                  onChange={(e) => updateProfile({ name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <Input 
                  type="email" 
                  defaultValue={settings.profile.email} 
                  className="bg-[#1a1a1f] border-white/10 text-white w-full"
                  onChange={(e) => updateProfile({ email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <Input 
                  type="text" 
                  defaultValue={settings.profile.username} 
                  className="bg-[#1a1a1f] border-white/10 text-white w-full"
                  onChange={(e) => updateProfile({ username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
                <Input
                  type="text"
                  value={settings.profile.walletAddress}
                  disabled
                  className="bg-[#1a1a1f] border-white/10 text-white opacity-70 w-full"
                />
              </div>
            </div>
          </div>
        )

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Theme</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 transition-all",
                    theme === "light" ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"
                  )}
                >
                  <Sun className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">Light</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 transition-all",
                    theme === "dark" ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"
                  )}
                >
                  <Moon className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">Dark</span>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 transition-all",
                    theme === "system" ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"
                  )}
                >
                  <Globe className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Layout</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 transition-all",
                    settings.layout === "default" ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"
                  )}
                  onClick={() => updateSettings({ layout: "default" })}
                >
                  <div className="mb-2 h-20 w-full rounded bg-gradient-to-r from-primary/20 to-secondary/20"></div>
                  <span className="text-sm font-medium">Default</span>
                </button>

                <button 
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 transition-all",
                    settings.layout === "compact" ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"
                  )}
                  onClick={() => updateSettings({ layout: "compact" })}
                >
                  <div className="mb-2 h-20 w-full rounded bg-gradient-to-r from-primary/20 to-secondary/20"></div>
                  <span className="text-sm font-medium">Compact</span>
                </button>
              </div>
            </div>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-xs text-gray-400">Receive important notifications via email</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateNotifications({ email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Push Notifications</h4>
                    <p className="text-xs text-gray-400">Get notifications on your device</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => updateNotifications({ push: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Desktop Notifications</h4>
                    <p className="text-xs text-gray-400">Show notifications on your desktop</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.desktop}
                    onCheckedChange={(checked) => updateNotifications({ desktop: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Price Alerts</h4>
                    <p className="text-xs text-gray-400">Get notified about price changes</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(checked) => updateNotifications({ priceAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Security Alerts</h4>
                    <p className="text-xs text-gray-400">Get notified about security events</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.securityAlerts}
                    onCheckedChange={(checked) => updateNotifications({ securityAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Market Updates</h4>
                    <p className="text-xs text-gray-400">Receive market analysis and updates</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.marketUpdates}
                    onCheckedChange={(checked) => updateNotifications({ marketUpdates: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">New Features</h4>
                    <p className="text-xs text-gray-400">Learn about new features and updates</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.newFeatures}
                    onCheckedChange={(checked) => updateNotifications({ newFeatures: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Security Settings</h3>

              <div className="rounded-lg border border-white/10 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                    <p className="text-xs text-gray-400">Add an extra layer of security</p>
                  </div>
                  <Switch 
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => updateSecurity({ twoFactorEnabled: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Auto-Lock Timeout</label>
                  <Select 
                    value={settings.security.autoLockTimeout}
                    onValueChange={(value) => updateSecurity({ autoLockTimeout: value as Settings['security']['autoLockTimeout'] })}
                  >
                    <SelectTrigger className="bg-[#1a1a1f] border-white/10 text-white">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Login Alerts</h4>
                    <p className="text-xs text-gray-400">Get notified of new login attempts</p>
                  </div>
                  <Switch 
                    checked={settings.security.loginAlerts}
                    onCheckedChange={(checked) => updateSecurity({ loginAlerts: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case "api-keys":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">API Keys</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your API Key</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={settings.apiKeys.key}
                      disabled
                      className="bg-[#1a1a1f] border-white/10 text-white opacity-70 flex-1"
                    />
                    <Button
                      variant="outline"
                      className="border-white/10 bg-[#1a1a1f] text-white hover:bg-white/10"
                      onClick={regenerateApiKey}
                      disabled={isLoading}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Last generated: {new Date(settings.apiKeys.lastGenerated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case "billing":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Billing Settings</h3>
              
              <div className="rounded-lg border border-white/10 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium">Current Plan</h4>
                    <p className="text-xs text-gray-400">{settings.billing.plan.charAt(0).toUpperCase() + settings.billing.plan.slice(1)}</p>
                  </div>
                  <Button variant="outline" className="border-white/10 hover:bg-white/10">
                    Upgrade Plan
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Billing Cycle</span>
                    <span>{settings.billing.cycle.charAt(0).toUpperCase() + settings.billing.cycle.slice(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Next Billing Date</span>
                    <span>{new Date(settings.billing.nextBilling).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount</span>
                    <span>${settings.billing.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Billing History</h4>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr>
                        <td className="px-4 py-2 text-sm">{new Date().toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm">Monthly Subscription</td>
                        <td className="px-4 py-2 text-sm">${settings.billing.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium",
              activeTab === "profile"
                ? "bg-[#312e81] text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium",
              activeTab === "appearance"
                ? "bg-[#312e81] text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Sun className="mr-2 h-4 w-4" />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium",
              activeTab === "notifications"
                ? "bg-[#312e81] text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium",
              activeTab === "security"
                ? "bg-[#312e81] text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Lock className="mr-2 h-4 w-4" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("api-keys")}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium",
              activeTab === "api-keys"
                ? "bg-[#312e81] text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Key className="mr-2 h-4 w-4" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium",
              activeTab === "billing"
                ? "bg-[#312e81] text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
          {renderContent()}
        </div>
      </div>
    </div>
  )
} 