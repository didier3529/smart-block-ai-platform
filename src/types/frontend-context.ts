import { BaseError } from './common';
import { AgentConfig, AgentState } from '../ai/types';

// Theme configuration
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  accentColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Dashboard types
export interface DashboardConfig {
  layout: 'grid' | 'list';
  refreshInterval: number;
  showTestnet: boolean;
  defaultChain: string;
  favoriteTokens: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'portfolio' | 'transactions' | 'nfts' | 'analytics' | 'custom';
  title: string;
  config?: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Portfolio types
export interface PortfolioStats {
  totalValue: number;
  dailyChange: number;
  dailyChangePercentage: number;
  assets: {
    tokens: number;
    nfts: number;
    defi: number;
  };
}

// Transaction types
export interface TransactionFilters {
  type?: 'all' | 'send' | 'receive' | 'swap' | 'nft' | 'defi';
  status?: 'all' | 'pending' | 'completed' | 'failed';
  dateRange?: {
    start: Date;
    end: Date;
  };
  chain?: string;
}

// Analytics types
export interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  interval: '1h' | '1d' | '1w' | '1m';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  height: number;
}

// Agent UI types
export interface AgentUIState extends AgentState {
  isMinimized: boolean;
  isMaximized: boolean;
  position?: {
    x: number;
    y: number;
  };
}

export interface AgentUIConfig extends AgentConfig {
  theme?: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  window?: {
    defaultSize: {
      width: number;
      height: number;
    };
    minSize: {
      width: number;
      height: number;
    };
    maxSize: {
      width: number;
      height: number;
    };
  };
}

// UI Error types
export interface UIError extends BaseError {
  component?: string;
  action?: string;
  recoverable: boolean;
  userMessage: string;
}

// Constants
export const SUPPORTED_CHAINS = [
  'ethereum',
  'polygon',
  'optimism',
  'arbitrum',
  'base'
] as const;

export const CHART_THEMES = {
  light: {
    background: '#ffffff',
    text: '#1f2937',
    grid: '#e5e7eb',
    tooltip: '#ffffff',
    colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444']
  },
  dark: {
    background: '#111827',
    text: '#f3f4f6',
    grid: '#374151',
    tooltip: '#1f2937',
    colors: ['#60a5fa', '#34d399', '#818cf8', '#fbbf24', '#f87171']
  }
} as const;

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  layout: 'grid',
  refreshInterval: 30000,
  showTestnet: false,
  defaultChain: 'ethereum',
  favoriteTokens: []
};

export const DEFAULT_THEME_CONFIG = {};  // Empty object since we're removing theme functionality

// Breakpoints (in pixels)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500
} as const;

// Z-index layers
export const Z_INDEX = {
  modal: 50,
  overlay: 40,
  dropdown: 30,
  sticky: 20,
  fixed: 10,
  base: 0
} as const; 