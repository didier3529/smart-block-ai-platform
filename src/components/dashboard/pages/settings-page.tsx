"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSettingsContext } from "@/lib/providers/settings-provider"
import {
  User,
  Lock,
  Key,
  CreditCard,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SettingsPage() {
  const { settings, isLoading, updateProfile, updateSecurity, updateNotifications, updateBilling, regenerateApiKey, updateSettings } = useSettingsContext()
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "api-keys" | "billing">("profile")

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