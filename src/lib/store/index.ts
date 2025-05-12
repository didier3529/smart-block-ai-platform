import { create } from 'zustand';
import { NetworkType } from '@/types/blockchain';

interface UIState {
  // Selected network for blockchain operations
  selectedNetwork: NetworkType;
  setSelectedNetwork: (network: NetworkType) => void;

  // Active analysis states
  activeAnalyses: {
    portfolio?: boolean;
    contract?: string;
    nft?: string;
    trends?: boolean;
  };
  setAnalysisActive: (type: keyof UIState['activeAnalyses'], value: string | boolean) => void;
  clearActiveAnalysis: (type: keyof UIState['activeAnalyses']) => void;

  // UI panel states
  expandedPanels: Record<string, boolean>;
  togglePanel: (panelId: string) => void;
  setPanelExpanded: (panelId: string, expanded: boolean) => void;

  // Selected tabs
  selectedTabs: Record<string, string>;
  setSelectedTab: (tabGroupId: string, tabId: string) => void;

  // Filter and sort options
  filters: {
    portfolio?: {
      tokenType?: string[];
      minValue?: number;
      maxValue?: number;
      performance?: '24h' | '7d' | '30d';
      sortBy?: 'value' | 'performance' | 'name';
      sortDir?: 'asc' | 'desc';
    };
    nfts?: {
      category?: string[];
      minFloor?: number;
      maxFloor?: number;
      sortBy?: 'floor' | 'volume' | 'holders';
      sortDir?: 'asc' | 'desc';
    };
    trends?: {
      timeframe?: '24h' | '7d' | '30d';
      impact?: 'high' | 'medium' | 'low';
      confidence?: number;
      category?: string[];
    };
  };
  setFilter: <T extends keyof UIState['filters']>(
    type: T,
    filters: Partial<UIState['filters'][T]>
  ) => void;
  clearFilters: (type: keyof UIState['filters']) => void;

  // Loading states
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, isLoading: boolean) => void;

  // Error states
  errors: Record<string, Error | null>;
  setError: (key: string, error: Error | null) => void;
  clearError: (key: string) => void;
}

export const useStore = create<UIState>((set) => ({
  // Network selection
  selectedNetwork: 'ethereum',
  setSelectedNetwork: (network) => set({ selectedNetwork: network }),

  // Active analyses
  activeAnalyses: {},
  setAnalysisActive: (type, value) =>
    set((state) => ({
      activeAnalyses: {
        ...state.activeAnalyses,
        [type]: value,
      },
    })),
  clearActiveAnalysis: (type) =>
    set((state) => {
      const newAnalyses = { ...state.activeAnalyses };
      delete newAnalyses[type];
      return { activeAnalyses: newAnalyses };
    }),

  // Panel expansion states
  expandedPanels: {},
  togglePanel: (panelId) =>
    set((state) => ({
      expandedPanels: {
        ...state.expandedPanels,
        [panelId]: !state.expandedPanels[panelId],
      },
    })),
  setPanelExpanded: (panelId, expanded) =>
    set((state) => ({
      expandedPanels: {
        ...state.expandedPanels,
        [panelId]: expanded,
      },
    })),

  // Tab selection
  selectedTabs: {},
  setSelectedTab: (tabGroupId, tabId) =>
    set((state) => ({
      selectedTabs: {
        ...state.selectedTabs,
        [tabGroupId]: tabId,
      },
    })),

  // Filters
  filters: {},
  setFilter: (type, filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [type]: {
          ...state.filters[type],
          ...filters,
        },
      },
    })),
  clearFilters: (type) =>
    set((state) => {
      const newFilters = { ...state.filters };
      delete newFilters[type];
      return { filters: newFilters };
    }),

  // Loading states
  loadingStates: {},
  setLoading: (key, isLoading) =>
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: isLoading,
      },
    })),

  // Error states
  errors: {},
  setError: (key, error) =>
    set((state) => ({
      errors: {
        ...state.errors,
        [key]: error,
      },
    })),
  clearError: (key) =>
    set((state) => {
      const newErrors = { ...state.errors };
      delete newErrors[key];
      return { errors: newErrors };
    }),
})); 