"use client"

import { useState } from "react"
import { CheckCircle, MoreHorizontal, Shield, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useContractContext } from "@/lib/providers/contract-provider"

interface SmartContractAnalyzerProps {
  isLoading?: boolean
}

export function SmartContractAnalyzer({ isLoading = false }: SmartContractAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<"monitored" | "recent">("monitored")
  const { contractData } = useContractContext()

  // Mock data - use as fallback if context data is missing
  const fallbackMonitored = [
    {
      name: "Uniswap V3",
      address: "0x1f9840a85d...5e5234cd",
      status: "Secure",
      lastAudit: "2 days ago",
      risk: "Low",
      chain: "Ethereum",
    },
    {
      name: "Aave V3",
      address: "0x7fc66500c8...a0c59fdc",
      status: "Secure",
      lastAudit: "1 week ago",
      risk: "Low",
      chain: "Ethereum",
    },
    {
      name: "PancakeSwap",
      address: "0x0e09fabb7...a6581e48",
      status: "Warning",
      lastAudit: "3 weeks ago",
      risk: "Medium",
      chain: "BSC",
    },
    {
      name: "SushiSwap",
      address: "0x6b3595068...3e5cce82",
      status: "Secure",
      lastAudit: "5 days ago",
      risk: "Low",
      chain: "Ethereum",
    },
  ]

  const recentContracts = [
    {
      name: "New DeFi Protocol",
      address: "0x8b3192f5e...9e7a1e23",
      status: "High Risk",
      lastAudit: "Never",
      risk: "High",
      chain: "Ethereum",
    },
    {
      name: "GameFi Token",
      address: "0x2a3b7b35c...1f5e8d9a",
      status: "Warning",
      lastAudit: "1 month ago",
      risk: "Medium",
      chain: "Polygon",
    },
    {
      name: "NFT Marketplace",
      address: "0x4c7f3e9d2...8b6a1c5d",
      status: "Secure",
      lastAudit: "2 weeks ago",
      risk: "Low",
      chain: "Ethereum",
    },
    {
      name: "Yield Aggregator",
      address: "0x9e8f7a1b3...2c5d4e6f",
      status: "Warning",
      lastAudit: "3 weeks ago",
      risk: "Medium",
      chain: "Avalanche",
    },
  ]

  // Use data from context or fallback to mock data
  const monitoredContracts = contractData?.contracts?.length ? 
    contractData.contracts.map(contract => ({
      name: contract.name,
      address: contract.address,
      status: contract.status || "Secure",
      lastAudit: contract.lastAudit || "Recently",
      risk: contract.risk || "Low",
      chain: contract.chain || "Ethereum",
    })) : fallbackMonitored;

  const contracts = activeTab === "monitored" ? monitoredContracts : recentContracts

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex animate-pulse flex-col space-y-4">
          <div className="h-6 w-48 rounded bg-gray-700"></div>
          <div className="h-8 w-full rounded bg-gray-700"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-gray-700"></div>
                <div className="h-4 w-20 rounded bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Smart Contract Security</h2>
        <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setActiveTab("monitored")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            activeTab === "monitored"
              ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white",
          )}
        >
          Monitored Contracts
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            activeTab === "recent"
              ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white",
          )}
        >
          Recent Analysis
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium text-gray-400">
              <th className="pb-2">Contract</th>
              <th className="pb-2">Chain</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Last Audit</th>
              <th className="pb-2">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contracts.map((contract) => (
              <tr key={contract.address} className="text-sm">
                <td className="py-3">
                  <div>
                    <div className="font-medium text-white">{contract.name}</div>
                    <div className="text-xs text-gray-400">{contract.address}</div>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-900"></div>
                    <span className="text-white">{contract.chain}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div
                    className={cn(
                      "flex items-center",
                      contract.status === "Secure"
                        ? "text-green-400"
                        : contract.status === "Warning"
                          ? "text-yellow-400"
                          : "text-red-400",
                    )}
                  >
                    {contract.status === "Secure" ? (
                      <CheckCircle className="mr-1 h-4 w-4" />
                    ) : contract.status === "Warning" ? (
                      <Shield className="mr-1 h-4 w-4" />
                    ) : (
                      <XCircle className="mr-1 h-4 w-4" />
                    )}
                    <span>{contract.status}</span>
                  </div>
                </td>
                <td className="py-3 text-white">{contract.lastAudit}</td>
                <td className="py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      contract.risk === "Low"
                        ? "bg-green-400/10 text-green-400"
                        : contract.risk === "Medium"
                          ? "bg-yellow-400/10 text-yellow-400"
                          : "bg-red-400/10 text-red-400",
                    )}
                  >
                    {contract.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
