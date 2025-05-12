"use client"

import { useState } from "react"
import { AlertCircle, ArrowDown, ArrowUp, Bell, Filter, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useContractAnalysis } from "@/lib/hooks/use-smart-contract-analysis"
import { Skeleton } from "@/components/ui/skeleton"
import { NetworkType } from "@/types/blockchain"

export default function SmartContractsPage() {
  const [contractAddress, setContractAddress] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("ethereum")
  const [activeTab, setActiveTab] = useState<"monitored" | "recent">("monitored")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: analysisData, isLoading, analyze } = useContractAnalysis()

  const handleAnalyze = () => {
    if (contractAddress) {
      analyze({
        address: contractAddress,
        network: selectedNetwork,
        options: {
          detailed: true,
          includeAuditHistory: true,
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
          <Skeleton className="h-10 w-full mb-6" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const contracts = analysisData?.contracts || [
    {
      name: "Uniswap V3 Pool",
      address: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
      chain: "Ethereum",
      status: "Secure",
      lastAudit: "2 days ago",
      riskLevel: "Low",
      issues: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 2,
      },
    },
    {
      name: "Aave V3 Lending Pool",
      address: "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",
      chain: "Ethereum",
      status: "Warning",
      lastAudit: "5 days ago",
      riskLevel: "Medium",
      issues: {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      },
    },
    {
      name: "PancakeSwap Router",
      address: "0x10ed43c718714eb63d5aa57b78b54704e256024e",
      chain: "BSC",
      status: "Critical",
      lastAudit: "15 days ago",
      riskLevel: "High",
      issues: {
        critical: 1,
        high: 2,
        medium: 1,
        low: 4,
      },
    },
  ]

  const filteredContracts = contracts.filter((contract) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        contract.name.toLowerCase().includes(query) ||
        contract.address.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Smart Contracts</h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search contracts..."
              className="pl-9 bg-white/5 border-white/10 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Contract Analysis Section */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Analyze Contract</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter contract address"
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as NetworkType)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
            </select>
            <Button
              onClick={handleAnalyze}
              disabled={!contractAddress}
              className={cn(
                "min-w-[120px]",
                contractAddress
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed",
              )}
            >
              <Shield className="mr-2 h-4 w-4" />
              Analyze
            </Button>
          </div>
        </div>

        {/* Contract List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("monitored")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium",
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
                  "rounded-full px-4 py-2 text-sm font-medium",
                  activeTab === "recent"
                    ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white",
                )}
              >
                Recent Analysis
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs font-medium text-gray-400">
                  <th className="pb-3 pl-4">Contract</th>
                  <th className="pb-3">Chain</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Issues</th>
                  <th className="pb-3">Last Audit</th>
                  <th className="pb-3">Risk Level</th>
                  <th className="pb-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContracts.map((contract) => (
                  <tr key={contract.address} className="text-sm">
                    <td className="py-4 pl-4">
                      <div>
                        <div className="font-medium text-white">{contract.name}</div>
                        <div className="text-xs text-gray-400">{contract.address}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-900"></div>
                        <span className="text-white">{contract.chain}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                          contract.status === "Secure"
                            ? "bg-green-400/10 text-green-400"
                            : contract.status === "Warning"
                            ? "bg-yellow-400/10 text-yellow-400"
                            : "bg-red-400/10 text-red-400",
                        )}
                      >
                        {contract.status}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        {contract.issues.critical > 0 && (
                          <div className="flex items-center text-xs text-red-400">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {contract.issues.critical} Critical
                          </div>
                        )}
                        {contract.issues.high > 0 && (
                          <div className="flex items-center text-xs text-orange-400">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {contract.issues.high} High
                          </div>
                        )}
                        {(contract.issues.medium > 0 || contract.issues.low > 0) && (
                          <div className="flex items-center text-xs text-gray-400">
                            {contract.issues.medium + contract.issues.low} Other
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-400">{contract.lastAudit}</td>
                    <td className="py-4">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          contract.riskLevel === "Low"
                            ? "text-green-400"
                            : contract.riskLevel === "Medium"
                            ? "text-yellow-400"
                            : "text-red-400",
                        )}
                      >
                        {contract.riskLevel}
                      </div>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 