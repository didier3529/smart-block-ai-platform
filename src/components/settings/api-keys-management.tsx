"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Copy, Key, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { AI_CONFIG } from "@/config/ai-config"

interface ApiService {
  id: string
  name: string
  description: string
  apiKey: string
  status: ApiKeyStatus
  expanded: boolean
}

type ApiKeyStatus = "default" | "valid" | "invalid" | "testing"

export function ApiKeysManagement() {
  const [services, setServices] = useState<ApiService[]>([
    {
      id: "openai",
      name: "OpenAI API",
      description: "Primary AI service for analysis and predictions",
      apiKey: AI_CONFIG.openai.apiKey,
      status: "default",
      expanded: false,
    },
    {
      id: "anthropic",
      name: "Anthropic API",
      description: "Advanced AI service for complex analysis",
      apiKey: AI_CONFIG.anthropic.apiKey,
      status: "default",
      expanded: false,
    },
    {
      id: "perplexity",
      name: "Perplexity API",
      description: "Specialized AI service for market analysis",
      apiKey: AI_CONFIG.perplexity.apiKey,
      status: "default",
      expanded: false,
    },
    {
      id: "market",
      name: "Market Data API",
      description: "Real-time market data and price feeds",
      apiKey: "",
      status: "default",
      expanded: false,
    },
    {
      id: "blockchain",
      name: "Blockchain API",
      description: "Access blockchain data and smart contracts",
      apiKey: "",
      status: "default",
      expanded: false,
    },
  ])

  const toggleExpand = (id: string) => {
    setServices((prev) =>
      prev.map((service) => (service.id === id ? { ...service, expanded: !service.expanded } : service))
    )
  }

  const updateApiKey = (id: string, value: string) => {
    setServices((prev) => prev.map((service) => (service.id === id ? { ...service, apiKey: value } : service)))
  }

  const testApiKey = async (id: string) => {
    const service = services.find((s) => s.id === id)
    if (!service || !service.apiKey.trim()) return

    // Set status to testing
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "testing" } : s)))

    try {
      // Test the API key based on the service
      let isValid = false;
      
      switch (id) {
        case 'openai':
          isValid = await testOpenAIKey(service.apiKey);
          break;
        case 'anthropic':
          isValid = await testAnthropicKey(service.apiKey);
          break;
        case 'perplexity':
          isValid = await testPerplexityKey(service.apiKey);
          break;
        default:
          // Simulate API key testing with a delay for other services
          await new Promise(resolve => setTimeout(resolve, 1500));
          isValid = Math.random() > 0.3;
      }

      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: isValid ? "valid" : "invalid" } : s)))
    } catch (error) {
      console.error(`Error testing ${id} API key:`, error);
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "invalid" } : s)))
    }
  }

  const saveApiKey = async (id: string) => {
    const service = services.find((s) => s.id === id)
    if (!service) return

    if (!service.apiKey.trim()) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "default" } : s)))
      return
    }

    try {
      // If the key hasn't been tested, test it first
      if (service.status !== "valid" && service.status !== "invalid") {
        await testApiKey(id)
      }

      // Save the API key to the appropriate configuration
      switch (id) {
        case 'openai':
        case 'anthropic':
        case 'perplexity':
          await updateAIConfig(id, service.apiKey);
          break;
        default:
          // Save other API keys to the user's profile
          await saveApiKeyToProfile(id, service.apiKey);
      }

      console.log(`Saved API key for ${service.name}`);
    } catch (error) {
      console.error(`Error saving ${id} API key:`, error);
    }
  }

  const resetApiKey = (id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, apiKey: "", status: "default" } : s)))
  }

  const getStatusColor = (status: ApiKeyStatus) => {
    switch (status) {
      case "valid":
        return "bg-green-500"
      case "invalid":
        return "bg-red-500"
      case "testing":
        return "bg-yellow-500 animate-pulse"
      case "default":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">API Keys</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your API keys for different services. Keep your keys secure and never share them with others.
        </p>

        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="rounded-lg border">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleExpand(service.id)}
              >
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-muted-foreground mr-3" />
                  <div>
                    <h4 className="text-sm font-medium">{service.name}</h4>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {service.status !== "default" && (
                    <div className="flex items-center">
                      <div className={cn("h-2 w-2 rounded-full mr-2", getStatusColor(service.status))} />
                      <span className="text-xs capitalize">{service.status}</span>
                    </div>
                  )}
                  {service.expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {service.expanded && (
                <div className="border-t p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">API Key</label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={service.apiKey}
                          onChange={(e) => updateApiKey(service.id, e.target.value)}
                          placeholder="Enter your API key"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(service.apiKey)
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => testApiKey(service.id)}
                        disabled={!service.apiKey.trim() || service.status === "testing"}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Test Key
                      </Button>
                      <Button
                        onClick={() => saveApiKey(service.id)}
                        disabled={!service.apiKey.trim() || service.status === "testing"}
                      >
                        Save Key
                      </Button>
                      <Button variant="outline" onClick={() => resetApiKey(service.id)}>
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper functions for testing API keys
async function testOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function testAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1
      })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function testPerplexityKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function updateAIConfig(provider: string, apiKey: string): Promise<void> {
  // Update the AI configuration in the environment
  const response = await fetch('/api/settings/ai-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider,
      apiKey
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update AI configuration');
  }
}

async function saveApiKeyToProfile(service: string, apiKey: string): Promise<void> {
  // Save the API key to the user's profile
  const response = await fetch('/api/settings/api-keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service,
      apiKey
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save API key');
  }
} 