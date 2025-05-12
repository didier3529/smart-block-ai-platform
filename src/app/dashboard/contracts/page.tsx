"use client"

import { SmartContractAnalyzer } from "@/components/dashboard/modules/smart-contract-analyzer"
import { useContractContext } from "@/lib/providers/contract-provider"

export default function ContractsPage() {
  const { isLoading } = useContractContext()

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Smart Contract Analysis</h1>
      <div className="space-y-6">
        <SmartContractAnalyzer isLoading={isLoading} />
        {/* Additional smart contract analysis components will be added here */}
      </div>
    </div>
  )
} 