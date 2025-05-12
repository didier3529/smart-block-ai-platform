import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Contract {
  name: string
  address: string
  status: "Secure" | "Warning" | "High Risk"
  lastAudit: string
  risk: "Low" | "Medium" | "High"
  chain: string
}

export interface ContractAnalysisData {
  monitored: Contract[]
  recent: Contract[]
}

export function useContractAnalysis(type: "monitored" | "recent") {
  return useQuery<ContractAnalysisData>({
    queryKey: ["contract-analysis", type],
    queryFn: async () => {
      const { data } = await api.get(`/api/contracts/analysis?type=${type}`)
      return data
    },
  })
} 