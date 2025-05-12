import { Context7Config } from '@upstash/context7-mcp';

export const context7Config: Context7Config = {
  // Core configuration
  appName: 'ChainOracle',
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.NODE_ENV === 'development',

  // Provider configuration
  providers: {
    error: {
      enabled: true,
      retryAttempts: 3,
      logErrors: true,
    },
    auth: {
      enabled: true,
      sessionTimeout: 3600,
      refreshThreshold: 300,
    },
    theme: {
      enabled: true,
      defaultTheme: 'light',
      persistTheme: true,
    },
    portfolio: {
      enabled: true,
      cacheTimeout: 300,
      refreshInterval: 60,
    },
  },

  // State management
  state: {
    persistence: {
      enabled: true,
      storage: 'localStorage',
      key: 'chainoracle_state',
    },
    rehydration: {
      enabled: true,
      timeout: 5000,
    },
  },

  // Performance monitoring
  monitoring: {
    enabled: true,
    sampleRate: 0.1,
    errorThreshold: 1000,
    metrics: ['fps', 'memory', 'network'],
  },

  // Event system
  events: {
    enabled: true,
    bufferSize: 100,
    flushInterval: 5000,
  },
}; 