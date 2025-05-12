import axios from 'axios';
import { getLocalStorage, removeLocalStorage } from '@/lib/utils/storage';

// Safely access browser APIs
const isBrowser = typeof window !== 'undefined';

// API base URL - should be configurable via environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Configure different timeouts for different types of requests
const TIMEOUT_CONFIG = {
  DEFAULT: 10000,
  LONG_RUNNING: 30000,
  UPLOAD: 60000
};

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504]
};

// Create API client
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: TIMEOUT_CONFIG.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to create AbortSignal with timeout
const createTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

// Helper function to implement exponential backoff
const getRetryDelay = (retryCount: number) => {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
};

// Mock data for development
const MOCK_DATA = {
  token: 'mock-jwt-token',
  user: {
    id: '0x1234567890abcdef1234567890abcdef12345678',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    networks: ['ethereum'],
    preferences: {
      defaultNetwork: 'ethereum',
      theme: 'dark',
      notifications: true,
    },
  },
  message: 'Sign this message to authenticate with Smart Block AI\nAddress: 0x1234567890abcdef1234567890abcdef12345678\nNonce: mock-nonce\nTimestamp: 1621234567890',
};

// Intercept requests in development mode
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('[API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Intercept responses
  apiClient.interceptors.response.use(
    (response) => {
      console.log(`[API] Response from ${response.config.url}:`, response.status);
      return response;
    },
    (error) => {
      console.error('[API] Response error:', error);
      
      // Mock responses for development when API endpoint fails
      if (process.env.NODE_ENV === 'development' && error.message === 'Network Error') {
        console.log('[API] Using mock data for failed request:', error.config.url);
        
        // Auth routes mocking
        if (error.config.url.includes('/api/auth/message')) {
          return Promise.resolve({ data: { message: MOCK_DATA.message } });
        }
        
        if (error.config.url.includes('/api/auth/wallet')) {
          return Promise.resolve({ data: { token: MOCK_DATA.token, user: MOCK_DATA.user } });
        }
        
        if (error.config.url.includes('/api/auth/verify')) {
          return Promise.resolve({ data: { valid: true } });
        }
        
        if (error.config.url.includes('/api/auth/me')) {
          return Promise.resolve({ data: MOCK_DATA.user });
        }
      }
      
      return Promise.reject(error);
    }
  );
}

// Export mock data for testing
export const mockData = MOCK_DATA;

// Request interceptor for adding auth token and handling timeouts
apiClient.interceptors.request.use((config) => {
  if (isBrowser) {
    const token = getLocalStorage('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set appropriate timeout based on request type
    if (config.url?.includes('/upload')) {
      config.timeout = TIMEOUT_CONFIG.UPLOAD;
    } else if (config.url?.includes('/portfolio/summary') || config.url?.includes('/market/data')) {
      config.timeout = TIMEOUT_CONFIG.LONG_RUNNING;
    }

    // Add abort signal for timeout
    config.signal = createTimeoutSignal(config.timeout || TIMEOUT_CONFIG.DEFAULT);
  }
  return config;
});

// Response interceptor for handling common errors and retries
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Don't retry if we've already retried the maximum number of times
    if (config._retryCount >= RETRY_CONFIG.MAX_RETRIES) {
      return Promise.reject(error);
    }

    // Initialize retry count
    config._retryCount = config._retryCount || 0;

    // Check if error is retryable
    const shouldRetry = error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      (error.response && RETRY_CONFIG.RETRY_STATUS_CODES.includes(error.response.status));

    if (shouldRetry) {
      config._retryCount += 1;

      // Calculate delay with exponential backoff
      const delay = getRetryDelay(config._retryCount);

      // Create new abort signal for retry
      config.signal = createTimeoutSignal(config.timeout || TIMEOUT_CONFIG.DEFAULT);

      // Wait for delay then retry request
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config);
    }

    // Handle authentication errors
    if (isBrowser && error.response?.status === 401) {
      removeLocalStorage('auth_token');
      window.location.href = '/';
    }

    // Format error response
    const errorResponse: ApiError = {
      message: getErrorMessage(error),
      code: error.code || 'UNKNOWN_ERROR',
      details: {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        retryCount: config._retryCount,
        timeout: error.code === 'ECONNABORTED'
      }
    };

    return Promise.reject(errorResponse);
  }
);

// Common response type for paginated data
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Common error response type
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Helper to extract error message from API responses
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiError)?.message || error.message;
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
}; 