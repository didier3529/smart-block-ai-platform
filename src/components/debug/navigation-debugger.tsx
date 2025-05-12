"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';

export function NavigationDebugger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    setNavigationHistory(prev => [...prev.slice(-4), currentPath]);
    
    console.log('[Navigation] Path changed:', {
      pathname,
      searchParams: searchParams.toString(),
      isAuthenticated,
      userId: user?.id,
    });
  }, [pathname, searchParams, isAuthenticated, user, mounted]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1a1a1a',
        color: '#fff',
        padding: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        borderTop: '1px solid #333',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>🔍 Navigation Debugger</span>
        <span style={{ color: isAuthenticated ? '#4caf50' : '#f44336' }}>
          {isLoading ? '⏳ Loading...' : isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span>Current:</span>
        <code style={{ background: '#333', padding: '2px 4px', borderRadius: '4px' }}>
          {pathname}{searchParams.toString() ? `?${searchParams.toString()}` : ''}
        </code>
      </div>

      {user && (
        <div style={{ marginTop: '4px', color: '#8bc34a' }}>
          <span>User: {user.address.slice(0, 6)}...{user.address.slice(-4)}</span>
        </div>
      )}

      <div style={{ marginTop: '4px', fontSize: '11px', color: '#888' }}>
        <span>History: </span>
        {navigationHistory.map((path, i) => (
          <span key={i} style={{ marginRight: '8px' }}>
            {i > 0 ? '→ ' : ''}{path}
          </span>
        ))}
      </div>
    </div>
  );
} 