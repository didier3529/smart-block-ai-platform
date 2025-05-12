"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@tanstack/react-query"

interface ContractContextType {
  isLoading: boolean
  contractData: any // Replace with proper type
  error: Error | null
  refetch: () => void
}

const ContractContext = createContext<ContractContextType | undefined>(undefined)

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const {
    data: contractData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contract"],
    queryFn: async () => {
      try {
        // Safely implement contract data fetching with proper error handling
        // For now, return mock data instead of empty object
        return {
          contracts: [
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
            }
          ]
        }
      } catch (err) {
        console.error("Failed to fetch contract data:", err);
        // Return fallback data instead of throwing error
        return { contracts: [] };
      }
    },
    // Don't fail on error, handle gracefully
    retry: 2,
    retryDelay: 1000,
  })

  return (
    <ContractContext.Provider
      value={{
        isLoading,
        contractData: contractData || { contracts: [] },
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </ContractContext.Provider>
  )
}

export function useContractContext() {
  const context = useContext(ContractContext)
  if (context === undefined) {
    throw new Error("useContractContext must be used within a ContractProvider")
  }
  return context
}

export function useContract() {
  return useContractContext();
} 