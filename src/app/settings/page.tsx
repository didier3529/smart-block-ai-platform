"use client"

import { useState } from "react"
import { Bell, ChevronDown, CreditCard, Globe, Key, Lock, Moon, Save, Sun, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ApiKeysManagement } from "@/components/settings/api-keys-management"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "appearance" | "notifications" | "security" | "billing" | "api-keys"
  >("profile")
  const { theme, setTheme } = useTheme()

  // Mock user data - replace with real data in production
  const userData = {
    name: "Alex Johnson",
    email: "alex@example.com",
    username: "alexj",
    walletAddress: "0x1a2b3c4d5e6f7g8h9i0j",
    joinDate: "January 15, 2023",
    apiKey: "sk-1234567890abcdef1234567890abcdef",
  }

  const notificationSettings = {
    emailAlerts: true,
    priceAlerts: true,
    securityAlerts: true,
    marketUpdates: false,
    newFeatures: true,
  }

  const securitySettings = {
    twoFactorEnabled: false,
    lastLogin: "June 15, 2023, 14:32 UTC",
    loginAlerts: true,
    autoLockTimeout: "15 minutes",
  }

  const billingPlan = {
    currentPlan: "Pro",
    billingCycle: "Monthly",
    nextBilling: "July 15, 2023",
    amount: "$19.99",
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                <Input type="text" defaultValue={userData.name} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <Input type="email" defaultValue={userData.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Username</label>
                <Input type="text" defaultValue={userData.username} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Wallet Address</label>
                <Input type="text" defaultValue={userData.walletAddress} disabled />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">API Key</label>
              <div className="flex gap-2">
                <Input type="password" defaultValue={userData.apiKey} disabled />
                <Button variant="outline">Regenerate</Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Your API key provides access to the Smart Block AI API. Keep it secure.
              </p>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
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
                    theme === "light" ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <Sun className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">Light</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 transition-all",
                    theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <Moon className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">Dark</span>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-4 transition-all",
                    theme === "system" ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <Globe className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Dashboard Layout</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center rounded-lg border p-4 hover:bg-accent">
                  <div className="mb-2 h-20 w-full rounded bg-gradient-to-r from-primary/20 to-secondary/20"></div>
                  <span className="text-sm font-medium">Default</span>
                </button>

                <button className="flex flex-col items-center justify-center rounded-lg border p-4 hover:bg-accent">
                  <div className="mb-2 h-20 w-full rounded bg-gradient-to-r from-primary/20 to-secondary/20"></div>
                  <span className="text-sm font-medium">Compact</span>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
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
                    <h4 className="text-sm font-medium">Email Alerts</h4>
                    <p className="text-xs text-muted-foreground">Receive important notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={notificationSettings.emailAlerts} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Price Alerts</h4>
                    <p className="text-xs text-muted-foreground">Get notified when assets reach your target price</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={notificationSettings.priceAlerts} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Security Alerts</h4>
                    <p className="text-xs text-muted-foreground">Receive alerts about security issues with your assets</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={notificationSettings.securityAlerts} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Market Updates</h4>
                    <p className="text-xs text-muted-foreground">Daily and weekly market summaries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={notificationSettings.marketUpdates} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">New Features</h4>
                    <p className="text-xs text-muted-foreground">Stay updated on new platform features</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={notificationSettings.newFeatures} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        )

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Security Settings</h3>

              <div className="rounded-lg border p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline">
                    {securitySettings.twoFactorEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Change Password</label>
                  <Input type="password" placeholder="Current password" className="mb-2" />
                  <Input type="password" placeholder="New password" className="mb-2" />
                  <Input type="password" placeholder="Confirm new password" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Auto-Lock Timeout</label>
                  <div className="relative">
                    <select className="w-full h-10 rounded-md border bg-background px-3 py-2 appearance-none">
                      <option>5 minutes</option>
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>Never</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your session will automatically lock after this period of inactivity.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Login Alerts</h4>
                    <p className="text-xs text-muted-foreground">Receive email notifications for new login attempts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={securitySettings.loginAlerts} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="mt-4 rounded-lg border p-4">
                <h4 className="text-sm font-medium mb-2">Session Information</h4>
                <p className="text-xs text-muted-foreground">Last login: {securitySettings.lastLogin}</p>
                <div className="mt-2">
                  <Button variant="outline" size="sm">
                    Log Out All Other Sessions
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        )

      case "billing":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Subscription Plan</h3>

              <div className="rounded-lg border p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">{billingPlan.currentPlan} Plan</h4>
                    <p className="text-xs text-muted-foreground">
                      {billingPlan.billingCycle} billing · {billingPlan.amount} · Next billing on{" "}
                      {billingPlan.nextBilling}
                    </p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-4">Payment Methods</h3>

              <div className="rounded-lg border p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 text-muted-foreground mr-3" />
                    <div>
                      <h4 className="text-sm font-medium">•••• •••• •••• 4242</h4>
                      <p className="text-xs text-muted-foreground">Expires 12/24</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>

              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>

              <h3 className="text-lg font-medium mt-6 mb-4">Billing History</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                      <th className="pb-3 pl-2">Date</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="text-sm">
                      <td className="py-4 pl-2">June 15, 2023</td>
                      <td className="py-4">Pro Plan - Monthly</td>
                      <td className="py-4">$19.99</td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                          Download
                        </Button>
                      </td>
                    </tr>
                    <tr className="text-sm">
                      <td className="py-4 pl-2">May 15, 2023</td>
                      <td className="py-4">Pro Plan - Monthly</td>
                      <td className="py-4">$19.99</td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                          Download
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case "api-keys":
        return <ApiKeysManagement />

      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium",
              activeTab === "profile"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 rounded-xl border p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
} 