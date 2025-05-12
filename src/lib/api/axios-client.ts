/**
 * Enhanced Axios Client with Context 7 patterns
 * Features:
 * - Robust error handling
 * - Automatic retry with exponential backoff
 * - Mock data fallbacks for development and testing
 * - Detailed error logging
 * - Network status detection
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // Base delay in ms before exponential backoff
  USE_MOCKS: process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true',
  MOCK_DELAY: 500, // Simulated delay for mock responses
};

// Track online status in the browser
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline = true; });
  window.addEventListener('offline', () => { isOnline = false; });
}

// Mock data repository
const mockDataRepository = {
  '/api/market/data': {
    data: {
      btcDominance: 48.2,
      totalMarketCap: 2.73,
      totalVolume24h: 142.5,
      markets: [
        { symbol: 'BTC', name: 'Bitcoin', price: 102982.57, change24h: 4.48 },
        { symbol: 'ETH', name: 'Ethereum', price: 6789.45, change24h: 3.76 },
        { symbol: 'SOL', name: 'Solana', price: 320.87, change24h: 7.51 },
        { symbol: 'DOGE', name: 'Dogecoin', price: 0.42, change24h: 7.69 },
        { symbol: 'ADA', name: 'Cardano', price: 2.34, change24h: 5.88 },
        { symbol: 'DOT', name: 'Polkadot', price: 42.67, change24h: 6.36 }
      ]
    }
  },
  '/api/portfolio/summary': {
    data: {
      totalValue: 298765.43,
      changePercent24h: 5.2,
      assets: [
        { symbol: 'BTC', name: 'Bitcoin', value: 205965.14, allocation: 68.9 },
        { symbol: 'ETH', name: 'Ethereum', value: 67894.50, allocation: 22.7 },
        { symbol: 'SOL', name: 'Solana', value: 16043.50, allocation: 5.4 },
        { symbol: 'ADA', name: 'Cardano', value: 8862.29, allocation: 3.0 }
      ]
    }
  },
  // Add more mock endpoints as needed
};

// Helper to simulate network delays for mocks
const simulateMockDelay = () => new Promise(resolve => setTimeout(resolve, API_CONFIG.MOCK_DELAY));

// Return mock data for a given endpoint
const getMockResponse = (url: string, config: AxiosRequestConfig) => {
  // Extract endpoint path from url
  const endpoint = url.replace(/^(https?:\/\/[^/]+)?/, '').split('?')[0];
  
  // Find mock data for this endpoint
  const mockData = mockDataRepository[endpoint];
  
  if (!mockData) {
    console.warn(`[Mock] No mock data found for endpoint: ${endpoint}`);
    return [404, { error: 'Not found', message: 'No mock data available for this endpoint' }];
  }
  
  console.log(`[Mock] Returning mock data for: ${endpoint}`);
  return [200, mockData];
};

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a unique request ID to each request for tracking
axiosInstance.interceptors.request.use(
  (config) => {
    // Don't continue if offline except for mock mode
    if (!isOnline && !API_CONFIG.USE_MOCKS) {
      return Promise.reject(new Error('Network offline'));
    }
    
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = uuidv4();
    
    // Use for debugging
    console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
      mockMode: API_CONFIG.USE_MOCKS ? 'Enabled' : 'Disabled',
      payload: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Handle response and implement retry logic
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Add retry count if not present
    if (originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }
    
    // Check if we should retry
    const shouldRetry = 
      originalRequest._retryCount < API_CONFIG.RETRY_ATTEMPTS && 
      (!error.response || [408, 429, 500, 502, 503, 504].includes(error.response.status));
    
    // If in mock mode, return mock data instead of real API errors
    if (API_CONFIG.USE_MOCKS && originalRequest.url) {
      console.log(`[Mock] Falling back to mock data due to API error:`, error.message);
      await simulateMockDelay();
      const [status, mockData] = getMockResponse(originalRequest.url, originalRequest);
      
      return Promise.resolve({
        status,
        data: mockData,
        headers: {},
        config: originalRequest,
        statusText: status === 200 ? 'OK' : 'Error'
      } as AxiosResponse);
    }
    
    // If we're not retrying, reject with error
    if (!shouldRetry) {
      return Promise.reject(error);
    }
    
    // Retry with exponential backoff
    originalRequest._retryCount += 1;
    
    const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest._retryCount - 1);
    console.log(`[API] Retrying request (${originalRequest._retryCount}/${API_CONFIG.RETRY_ATTEMPTS}) in ${delay}ms...`);
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(axiosInstance(originalRequest));
      }, delay);
    });
  }
);

// Enhanced API methods with type safety and mock support
export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    // If mock mode is enabled and we're in development, return mock data directly
    if (API_CONFIG.USE_MOCKS && !url.includes('/api/auth/')) {
      await simulateMockDelay();
      const [status, mockData] = getMockResponse(url, config || {});
      
      if (status !== 200) {
        throw new Error(`Mock API Error: ${mockData.error}`);
      }
      
      return mockData.data as T;
    }
    
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },
  
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    // For mock mode, simulate a successful response
    if (API_CONFIG.USE_MOCKS && !url.includes('/api/auth/')) {
      await simulateMockDelay();
      console.log(`[Mock] POST ${url}`, data);
      // Return the post data as if it was accepted
      return { success: true, ...data } as unknown as T;
    }
    
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },
  
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    // For mock mode, simulate a successful response
    if (API_CONFIG.USE_MOCKS && !url.includes('/api/auth/')) {
      await simulateMockDelay();
      console.log(`[Mock] PUT ${url}`, data);
      return { success: true, ...data } as unknown as T;
    }
    
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },
  
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    // For mock mode, simulate a successful response
    if (API_CONFIG.USE_MOCKS && !url.includes('/api/auth/')) {
      await simulateMockDelay();
      console.log(`[Mock] DELETE ${url}`);
      return { success: true } as unknown as T;
    }
    
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },
  
  // Network status check
  isOnline: () => isOnline,
  
  // Reset the client (useful for testing)
  resetClient: () => {
    axiosInstance.defaults.headers.common = {};
  },
  
  // Set auth token
  setAuthToken: (token: string) => {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  // Remove auth token
  removeAuthToken: () => {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
}; 