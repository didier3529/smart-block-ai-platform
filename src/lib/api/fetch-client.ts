/**
 * Enhanced Fetch Client with Context 7 patterns
 * Features:
 * - Robust error handling
 * - Automatic retry with exponential backoff
 * - Mock data fallbacks for development and testing
 * - Detailed error serialization
 * - Network status detection
 */

import { v4 as uuidv4 } from 'uuid';

// Configuration
const FETCH_CONFIG = {
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

// Standard request options
interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  baseDelay?: number;
  mockDelay?: number;
  useMock?: boolean;
}

// Error with additional fields for fetch client
class FetchError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
  retryCount?: number;
  requestId?: string;
  body?: any;

  constructor(message: string, options: Partial<FetchError> = {}) {
    super(message);
    this.name = 'FetchError';
    Object.assign(this, options);
  }
}

// Mock data repository - same as in axios-client.ts to maintain consistency
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
const simulateMockDelay = (delay = FETCH_CONFIG.MOCK_DELAY) => 
  new Promise(resolve => setTimeout(resolve, delay));

// Return mock data for a given endpoint
const getMockResponse = (url: string) => {
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

// Serialize errors for better logging and debugging
const serializeError = (error: any): Record<string, any> => {
  if (!error) return { message: 'Unknown error (empty error object)' };
  
  try {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof FetchError ? {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          retryCount: error.retryCount,
          requestId: error.requestId
        } : {})
      };
    }
    
    // For non-Error objects
    return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
  } catch (e) {
    // Fallback for non-serializable errors
    return { 
      message: 'Error object could not be serialized',
      errorType: typeof error,
      errorToString: String(error)
    };
  }
};

// Core fetch function with enhancements
async function enhancedFetch<T>(
  url: string,
  options: FetchOptions = {},
  retryCount = 0
): Promise<T> {
  // Prepare request options
  const requestId = uuidv4();
  const isFullUrl = url.startsWith('http');
  const fullUrl = isFullUrl ? url : `${FETCH_CONFIG.BASE_URL}${url}`;
  
  // Request timeout handling
  const timeout = options.timeout || FETCH_CONFIG.TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Only continue if online unless mock mode is enabled
  const useMock = options.useMock !== undefined ? options.useMock : FETCH_CONFIG.USE_MOCKS;
  if (!isOnline && !useMock) {
    throw new FetchError('Network offline', { 
      requestId, 
      url: fullUrl 
    });
  }
  
  // Logging
  console.log(`[API] ${options.method || 'GET'} ${url}`, {
    retry: retryCount,
    mockMode: useMock ? 'Enabled' : 'Disabled',
    requestId
  });
  
  // Return mock data when appropriate
  if (useMock && !url.includes('/api/auth/')) {
    await simulateMockDelay(options.mockDelay);
    const [status, mockData] = getMockResponse(url);
    
    if (status !== 200) {
      throw new FetchError(`Mock API Error: ${mockData.error}`, {
        status,
        url: fullUrl,
        requestId
      });
    }
    
    clearTimeout(timeoutId);
    return mockData.data as T;
  }
  
  try {
    // Add request headers
    options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': requestId,
      ...(options.headers || {})
    };
    
    // Add abort signal
    options.signal = controller.signal;
    
    // Make the request
    const response = await fetch(fullUrl, options);
    clearTimeout(timeoutId);
    
    // Handle error responses
    if (!response.ok) {
      throw new FetchError(`Request failed with status ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        requestId,
        retryCount
      });
    }
    
    // Parse and return the response data
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return await response.json();
    }
    
    // Handle text responses
    return await response.text() as unknown as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Check if it's an abort error (timeout)
    if (error.name === 'AbortError') {
      throw new FetchError(`Request timeout after ${timeout}ms`, {
        status: 408,
        url: fullUrl,
        requestId,
        retryCount
      });
    }
    
    // Handle all other errors
    const maxRetries = options.retries || FETCH_CONFIG.RETRY_ATTEMPTS;
    const shouldRetry = retryCount < maxRetries;
    
    // Log the error
    console.error(`[API] Fetch error ${shouldRetry ? '(will retry)' : '(max retries reached)'}:`, 
      serializeError(error));
    
    // Mock fallback in development if real request failed
    if (useMock) {
      console.log(`[Mock] Falling back to mock data due to fetch error`);
      await simulateMockDelay(options.mockDelay);
      const [status, mockData] = getMockResponse(url);
      
      if (status !== 200) {
        throw new FetchError(`Mock API Error: ${mockData.error}`, {
          status,
          url: fullUrl,
          requestId
        });
      }
      
      return mockData.data as T;
    }
    
    // Retry the request if appropriate
    if (shouldRetry) {
      const baseDelay = options.baseDelay || FETCH_CONFIG.RETRY_DELAY;
      const delay = baseDelay * Math.pow(2, retryCount);
      
      console.log(`[API] Retrying request (${retryCount + 1}/${maxRetries}) in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return enhancedFetch<T>(url, options, retryCount + 1);
    }
    
    // If retries exhausted, rethrow with enhanced info
    throw new FetchError(`${error.message || 'Fetch failed'} after ${maxRetries} retries`, {
      status: error.status,
      statusText: error.statusText,
      url: fullUrl,
      requestId,
      retryCount,
      body: options.body
    });
  }
}

// Export fetch client with type-safe methods
export const fetchClient = {
  get: <T>(url: string, options: Omit<FetchOptions, 'body' | 'method'> = {}): Promise<T> => {
    return enhancedFetch<T>(url, { ...options, method: 'GET' });
  },
  
  post: <T>(url: string, data: any, options: Omit<FetchOptions, 'body' | 'method'> = {}): Promise<T> => {
    return enhancedFetch<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put: <T>(url: string, data: any, options: Omit<FetchOptions, 'body' | 'method'> = {}): Promise<T> => {
    return enhancedFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: <T>(url: string, options: Omit<FetchOptions, 'body' | 'method'> = {}): Promise<T> => {
    return enhancedFetch<T>(url, { ...options, method: 'DELETE' });
  },
  
  // Network status check
  isOnline: () => isOnline,
  
  // Mock mode getters
  isMockMode: () => FETCH_CONFIG.USE_MOCKS,
  
  // For debugging
  serializeError
}; 