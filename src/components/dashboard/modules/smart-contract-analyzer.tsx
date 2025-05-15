"use client"

import { useState } from "react"
import { CheckCircle, MoreHorizontal, Shield, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useContractContext } from "@/lib/providers/contract-provider"
import { chainIcons, ChainType } from "@/lib/constants/chain-icons"
import Image from "next/image"
import { useContractAnalysis } from "@/lib/hooks/use-contract-analysis"

interface SmartContractAnalyzerProps {
  isLoading?: boolean
}

export function SmartContractAnalyzer({ isLoading = false }: SmartContractAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<"monitored" | "recent">("monitored")
  const { data: analysisData, isLoading: isAnalysisLoading } = useContractAnalysis()

  const loading = isLoading || isAnalysisLoading
  const contracts = analysisData?.contracts || []

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="flex items-center gap-4 mb-6">
        <Shield className="h-6 w-6 text-green-400" />
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

      {contracts.length > 0 ? (
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
                      {contract.chain in chainIcons && (
                        <Image
                          src={chainIcons[contract.chain as ChainType]}
                          alt={`${contract.chain} logo`}
                          width={16}
                          height={16}
                          className="mr-2"
                        />
                      )}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 rounded-full bg-blue-500/10 p-3">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">Coming Soon</h3>
          <p className="max-w-sm text-sm text-gray-400">
            Smart contract security analysis will be available in the next update.
            Stay tuned for advanced security monitoring and risk assessment.
          </p>
        </div>
      )}
    </div>
  )
}
