import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ContractAnalysis, NetworkType } from '@/types/blockchain';
import { ContractAnalyzerResponse } from '@/types/ai';

// Query keys
export const contractKeys = {
  all: ['contracts'] as const,
  analysis: (address: string, network: NetworkType) =>
    [...contractKeys.all, 'analysis', network, address] as const,
  history: (address: string, network: NetworkType) =>
    [...contractKeys.all, 'history', network, address] as const,
  saved: () => [...contractKeys.all, 'saved'] as const,
};

interface AnalysisOptions {
  detailed?: boolean;
  includeSimilar?: boolean;
  includeAuditHistory?: boolean;
}

// Get contract analysis
export function useContractAnalysis(
  address: string,
  network: NetworkType,
  options?: AnalysisOptions
) {
  return useQuery({
    queryKey: contractKeys.analysis(address, network),
    queryFn: async (): Promise<ContractAnalyzerResponse> => {
      const { data } = await apiClient.get(
        `/api/contracts/${network}/${address}/analyze`,
        {
          params: options,
        }
      );
      return data;
    },
    enabled: Boolean(address && network),
    // Longer cache time for contract analysis
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Get contract analysis history
export function useContractHistory(address: string, network: NetworkType) {
  return useQuery({
    queryKey: contractKeys.history(address, network),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/api/contracts/${network}/${address}/history`
      );
      return data;
    },
    enabled: Boolean(address && network),
  });
}

// Save contract analysis
export function useSaveContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      network,
      notes,
    }: {
      address: string;
      network: NetworkType;
      notes?: string;
    }) => {
      const { data } = await apiClient.post('/api/contracts/saved', {
        address,
        network,
        notes,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.saved() });
    },
  });
}

// Remove saved contract
export function useRemoveSavedContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      network,
    }: {
      address: string;
      network: NetworkType;
    }) => {
      await apiClient.delete(`/api/contracts/saved/${network}/${address}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.saved() });
    },
  });
}

// Get saved contracts
export function useSavedContracts() {
  return useQuery({
    queryKey: contractKeys.saved(),
    queryFn: async (): Promise<
      Array<{
        address: string;
        network: NetworkType;
        analysis: ContractAnalysis;
        notes?: string;
        savedAt: string;
      }>
    > => {
      const { data } = await apiClient.get('/api/contracts/saved');
      return data;
    },
  });
}

// Compare multiple contracts
export function useCompareContracts(
  contracts: Array<{ address: string; network: NetworkType }>
) {
  return useQuery({
    queryKey: [
      ...contractKeys.all,
      'compare',
      contracts.map((c) => `${c.network}:${c.address}`).join(','),
    ],
    queryFn: async () => {
      const { data } = await apiClient.post('/api/contracts/compare', {
        contracts,
      });
      return data;
    },
    enabled: contracts.length > 0,
  });
} 