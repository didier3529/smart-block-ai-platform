import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ContractAnalysisResult, NetworkType } from "@/types/blockchain"
import { api } from "@/lib/api"

interface AnalysisParams {
  address: string
  network: NetworkType
  options?: {
    detailed?: boolean
    includeAuditHistory?: boolean
  }
}

interface ContractAnalysisData {
  contracts: ContractAnalysisResult[]
}

export function useContractAnalysis() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<ContractAnalysisData>({
    queryKey: ["contract-analysis"],
    queryFn: async () => {
      // In production, fetch monitored contracts from your backend
      return {
        contracts: [],
      }
    },
    // Add caching configuration
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  })

  const { mutate: analyze, isPending } = useMutation({
    mutationFn: async (params: AnalysisParams) => {
      // Implement request batching
      const batchKey = `batch_${Date.now()}`
      const batchedRequests = queryClient.getQueryData<any[]>([batchKey]) || []
      
      if (batchedRequests.length < 5) {
        batchedRequests.push(params)
        queryClient.setQueryData([batchKey], batchedRequests)
        
        // Wait for more requests to batch
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const finalBatch = queryClient.getQueryData<any[]>([batchKey]) || []
        if (finalBatch.length < 5) {
          // If no more requests came in, process the batch
          const response = await api.post("/api/contracts/analyze-batch", { contracts: finalBatch })
          queryClient.removeQueries({ queryKey: [batchKey] })
          return response.data.find((r: any) => r.address === params.address)
        }
      }
      
      // Process the batch
      const response = await api.post("/api/contracts/analyze-batch", { contracts: batchedRequests })
      queryClient.removeQueries({ queryKey: [batchKey] })
      return response.data.find((r: any) => r.address === params.address)
    },
    onSuccess: (newContract) => {
      queryClient.setQueryData<ContractAnalysisData>(
        ["contract-analysis"],
        (old) => ({
          contracts: [...(old?.contracts || []), newContract],
        }),
      )
    },
  })

  return {
    data,
    isLoading: isLoading || isPending,
    error,
    analyze,
  }
} 