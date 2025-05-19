"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/config';
import { NetworkType } from '@/types/blockchain';
import Cookies from 'js-cookie';

// Constants
const TOKEN_KEY = 'auth_token';
const WALLET_KEY = 'wallet_address';
const TOKEN_VERIFY_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Types
interface User {
  id: string;
  address: string;
  networks: NetworkType[];
  preferences: {
    defaultNetwork: NetworkType;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  login: (address: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  connectWallet: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isInitialized: false,
    isAuthenticated: false,
    error: null,
  });
  
  const router = useRouter();
  const verifyInterval = useRef<NodeJS.Timeout>();

  // Debug logging
  const logDebug = useCallback((message: string, data?: Record<string, unknown> | Error | null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Auth] ${message}`, data ? data : '');
    }
  }, []);

  // Token verification
  const verifyToken = useCallback(async () => {
    try {
      const token = Cookies.get(TOKEN_KEY);
      if (!token) {
        logDebug('No token found');
        return false;
      }

      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token with API
      const { data } = await apiClient.post('/api/auth/verify');
      
      if (!data?.valid) {
        logDebug('Token invalid');
        throw new Error('Invalid token');
      }

      return true;
    } catch (error) {
      logDebug('Token verification failed', error);
      // Clear invalid token
      Cookies.remove(TOKEN_KEY);
      Cookies.remove(WALLET_KEY);
      delete apiClient.defaults.headers.common['Authorization'];
      return false;
    }
  }, [logDebug]);

  // Login function
  const login = useCallback(async (address: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      logDebug('Initiating login', { address });

      // Get message to sign
      const { data: messageData } = await apiClient.get(`/api/auth/message?address=${address}`);
      const message = messageData.message;

      // Request signature from wallet
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Browser or ethereum provider not available');
      }
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Authenticate with backend
      const { data: authData } = await apiClient.post('/api/auth/wallet', {
        address,
        signature,
        message,
      });

      if (!authData?.token || !authData?.user) {
        throw new Error('Invalid authentication response');
      }

      // Store auth data in cookies
      Cookies.set(TOKEN_KEY, authData.token, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      Cookies.set(WALLET_KEY, address, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;

      // Update state
      setState(prev => ({
        ...prev,
        user: authData.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));

      logDebug('Login successful', { userId: authData.user.id });
      return true;
    } catch (error) {
      logDebug('Login failed', error);
      // Clear any partial auth data
      Cookies.remove(TOKEN_KEY);
      Cookies.remove(WALLET_KEY);
      delete apiClient.defaults.headers.common['Authorization'];

      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Login failed'),
      }));

      return false;
    }
  }, [logDebug]);

  // Logout function
  const logout = useCallback(async () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(WALLET_KEY);
    delete apiClient.defaults.headers.common['Authorization'];
    
    setState({
      user: null,
      isLoading: false,
      isInitialized: true,
      isAuthenticated: false,
      error: null,
    });

    router.replace('/');
  }, [router]);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      logDebug('Connecting wallet');

      // Check if metamask is installed
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to connect your wallet');
      }

      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please check your MetaMask and try again');
      }

      const address = accounts[0];
      logDebug('Wallet connected', { address });

      // Proceed with login
      const success = await login(address);
      return success;
    } catch (error) {
      logDebug('Wallet connection failed', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Wallet connection failed'),
      }));
      return false;
    }
  }, [login, logDebug]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get(TOKEN_KEY);
        if (!token) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            isInitialized: true 
          }));
          return;
        }

        const isValid = await verifyToken();
        if (!isValid) {
          throw new Error('Invalid token');
        }

        // Get user data
        const { data: user } = await apiClient.get('/api/auth/me');
        
        setState({
          user,
          isLoading: false,
          isInitialized: true,
          isAuthenticated: true,
          error: null,
        });
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setState({
          user: null,
          isLoading: false,
          isInitialized: true,
          isAuthenticated: false,
          error: error instanceof Error ? error : new Error('Auth initialization failed'),
        });
      }
    };

    initAuth();

    // Set up periodic token verification
    verifyInterval.current = setInterval(verifyToken, TOKEN_VERIFY_INTERVAL);

    return () => {
      if (verifyInterval.current) {
        clearInterval(verifyInterval.current);
      }
    };
  }, [verifyToken]);

  const value = {
    ...state,
    login,
    logout,
    verifyToken,
    connectWallet,
    updatePreferences: async (preferences) => {
      // Placeholder implementation
      console.log('Update preferences', preferences);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 