'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';

interface AuthEvent {
  timestamp: number;
  type: string;
  details: string;
}

// Add ethereum type declaration to the Window interface
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: any) => void;
      removeListener: (event: string, callback: any) => void;
    };
  }
}

export function AuthDebugger() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const authCheckCount = useRef(0);
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);
  const prevAuthState = useRef({ user, isLoading, isAuthenticated });
  const [isMounted, setIsMounted] = useState(false);
  
  // Only render on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addAuthEvent = (type: string, details: string) => {
    setAuthEvents(prev => {
      const newEvents = [...prev, { timestamp: Date.now(), type, details }];
      // Keep last 10 events
      return newEvents.slice(-10);
    });
    console.log(`[AUTH DEBUG] ${type}:`, details);
  };

  // Monitor auth state changes
  useEffect(() => {
    if (!isMounted) return;
    
    const prev = prevAuthState.current;
    
    if (prev.isLoading !== isLoading) {
      addAuthEvent('Loading State', `Changed from ${prev.isLoading} to ${isLoading}`);
    }
    
    if (prev.isAuthenticated !== isAuthenticated) {
      addAuthEvent('Auth State', `Changed from ${prev.isAuthenticated} to ${isAuthenticated}`);
    }
    
    if (JSON.stringify(prev.user) !== JSON.stringify(user)) {
      addAuthEvent('User State', user ? `User updated: ${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'User cleared');
    }
    
    prevAuthState.current = { user, isLoading, isAuthenticated };
  }, [user, isLoading, isAuthenticated, isMounted]);

  // Monitor localStorage changes - only on client
  useEffect(() => {
    if (!isMounted) return;
    
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalGetItem = localStorage.getItem;
    
    localStorage.setItem = function(key: string, value: string) {
      if (key.includes('auth') || key.includes('token') || key.includes('wallet')) {
        addAuthEvent('LocalStorage Set', `${key} = ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
      }
      originalSetItem.apply(this, [key, value]);
    };
    
    localStorage.removeItem = function(key: string) {
      if (key.includes('auth') || key.includes('token') || key.includes('wallet')) {
        addAuthEvent('LocalStorage Remove', key);
      }
      originalRemoveItem.apply(this, [key]);
    };
    
    localStorage.getItem = function(key: string) {
      const value = originalGetItem.apply(this, [key]);
      if (key.includes('auth') || key.includes('token') || key.includes('wallet')) {
        addAuthEvent('LocalStorage Get', `${key} ${value ? '(exists)' : '(missing)'}`);
      }
      return value;
    };
    
    return () => {
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      localStorage.getItem = originalGetItem;
    };
  }, [isMounted]);

  // Monitor navigation events - only on client
  useEffect(() => {
    if (!isMounted) return;
    
    const handleBeforeUnload = () => {
      addAuthEvent('Navigation', 'Page unload triggered');
    };

    const handleVisibilityChange = () => {
      addAuthEvent('Visibility', document.hidden ? 'Page hidden' : 'Page visible');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMounted]);

  // Monitor MetaMask events - only on client
  useEffect(() => {
    if (!isMounted) return;
    
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        addAuthEvent('MetaMask', `Accounts changed: ${accounts.length ? accounts[0] : 'none'}`);
      };

      const handleChainChanged = (chainId: string) => {
        addAuthEvent('MetaMask', `Chain changed: ${chainId}`);
      };

      const handleConnect = (connectInfo: { chainId: string }) => {
        addAuthEvent('MetaMask', `Connected to chain: ${connectInfo.chainId}`);
      };

      const handleDisconnect = () => {
        addAuthEvent('MetaMask', 'Disconnected');
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [isMounted]);

  // Don't render anything during SSR or in production
  if (!isMounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{ marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          maxHeight: '80vh',
          background: '#1a1a1a',
          color: '#fff',
          padding: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          borderLeft: '1px solid #333',
          borderBottom: '1px solid #333',
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
          <strong>🔐 Auth Debugger</strong>
        </div>
        
        {authEvents.map((event, index) => (
          <div key={index} style={{ marginBottom: '4px', borderBottom: '1px solid #222', paddingBottom: '4px' }}>
            <div style={{ color: '#888' }}>
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
            <div style={{ color: '#4caf50' }}>{event.type}</div>
            <div style={{ wordBreak: 'break-all' }}>{event.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 