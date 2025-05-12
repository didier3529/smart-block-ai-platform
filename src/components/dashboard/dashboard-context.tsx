'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';

// Define strict types for user data
interface UserData {
  address: string;
  // Add other user properties as needed, maintaining type safety
}

interface DashboardContextValue {
  user: UserData;
  // Add other dashboard-specific values here
  formatAddress: (address: string) => string;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  
  if (!context) {
    throw new Error(
      'useDashboard must be used within a DashboardProvider. ' +
      'Ensure all components using this hook are wrapped in the DashboardProvider.'
    );
  }
  
  return context;
}

interface DashboardProviderProps {
  children: React.ReactNode;
  user: UserData;
}

export function DashboardProvider({ children, user }: DashboardProviderProps) {
  // Memoize utility functions to prevent unnecessary re-renders
  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    formatAddress,
  }), [user, formatAddress]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
} 