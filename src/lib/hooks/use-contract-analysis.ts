import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { NetworkType } from "@/types/blockchain"

export interface Contract {
  name: string
  address: string
  status: "Secure" | "Warning" | "High Risk"
  lastAudit: string
  risk: "Low" | "Medium" | "High"
  chain: string
  issues?: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export interface ContractAnalysisData {
  contracts: Contract[]
}

interface AnalysisOptions {
  detailed?: boolean
  includeAuditHistory?: boolean
  includeSimilar?: boolean
}

// Query keys for better cache management
export const contractKeys = {
  all: ['contracts'] as const,
  analysis: (address: string, network: NetworkType) =>
    [...contractKeys.all, 'analysis', network, address] as const,
  history: (address: string, network: NetworkType) =>
    [...contractKeys.all, 'history', network, address] as const,
  saved: () => [...contractKeys.all, 'saved'] as const,
}

// Main hook for contract analysis
export function useContractAnalysis(
  address?: string,
  network?: NetworkType,
  options?: AnalysisOptions
) {
  const queryClient = useQueryClient()

  const query = useQuery<ContractAnalysisData>({
    queryKey: address && network ? contractKeys.analysis(address, network) : contractKeys.all,
    queryFn: async () => {
      if (address && network) {
        const { data } = await api.get(`/api/contracts/${network}/${address}/analyze`, {
          params: options,
        })
        return data
      }
      const { data } = await api.get('/api/contracts/analysis')
      return data
    },
    enabled: !address || (!!address && !!network),
  })

  const mutation = useMutation({
    mutationFn: async (params: {
      address: string
      network: NetworkType
      options?: AnalysisOptions
    }) => {
      const { data } = await api.post('/api/contracts/analyze', params)
      return data
    },
    onSuccess: (newData) => {
      queryClient.setQueryData<ContractAnalysisData>(
        contractKeys.all,
        (old) => ({
          contracts: [...(old?.contracts || []), ...newData.contracts],
        })
      )
    },
  })

  return {
    ...query,
    analyze: mutation.mutate,
    isAnalyzing: mutation.isPending,
  }
}

// Hook for contract analysis history
export function useContractHistory(address: string, network: NetworkType) {
  return useQuery({
    queryKey: contractKeys.history(address, network),
    queryFn: async () => {
      const { data } = await api.get(`/api/contracts/${network}/${address}/history`)
      return data
    },
    enabled: Boolean(address && network),
  })
}

// Hook for saved contracts management
export function useSavedContracts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: contractKeys.saved(),
    queryFn: async () => {
      const { data } = await api.get('/api/contracts/saved')
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (params: {
      address: string
      network: NetworkType
      notes?: string
    }) => {
      const { data } = await api.post('/api/contracts/saved', params)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.saved() })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (params: { address: string; network: NetworkType }) => {
      await api.delete(`/api/contracts/saved/${params.network}/${params.address}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.saved() })
    },
  })

  return {
    ...query,
    saveContract: saveMutation.mutate,
    removeContract: removeMutation.mutate,
    isSaving: saveMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
} 