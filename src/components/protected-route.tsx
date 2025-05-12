'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';

interface RouteState {
  initialCheckComplete: boolean;
  redirectInProgress: boolean;
  lastAuthState: {
    isAuthenticated: boolean;
    isLoading: boolean;
    userId: string | null;
  } | null;
}

export function ProtectedRoute({ 
  children,
  redirectTo = '/',
  loadingComponent
}: { 
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const routeState = useRef<RouteState>({
    initialCheckComplete: false,
    redirectInProgress: false,
    lastAuthState: null
  });

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const currentState = {
      isAuthenticated,
      isLoading,
      userId: user?.id ?? null
    };

    // Track state changes for debugging
    if (process.env.NODE_ENV === 'development') {
      const prevState = routeState.current.lastAuthState;
      if (prevState) {
        if (prevState.isLoading !== currentState.isLoading) {
          console.log('[ProtectedRoute] Loading state changed:', { 
            from: prevState.isLoading, 
            to: currentState.isLoading 
          });
        }
        if (prevState.isAuthenticated !== currentState.isAuthenticated) {
          console.log('[ProtectedRoute] Auth state changed:', { 
            from: prevState.isAuthenticated, 
            to: currentState.isAuthenticated 
          });
        }
        if (prevState.userId !== currentState.userId) {
          console.log('[ProtectedRoute] User changed:', { 
            from: prevState.userId, 
            to: currentState.userId 
          });
        }
      }
    }
    
    routeState.current.lastAuthState = currentState;

    // Skip if loading
    if (isLoading) {
      return;
    }

    // Handle initial auth check
    if (!routeState.current.initialCheckComplete) {
      routeState.current.initialCheckComplete = true;

      if (!isAuthenticated) {
        if (!routeState.current.redirectInProgress) {
          routeState.current.redirectInProgress = true;
          
          // Use requestAnimationFrame for smoother transitions
          requestAnimationFrame(() => {
            router.replace(redirectTo);
          });
        }
        return;
      }

      setIsReadyToRender(true);
      return;
    }

    // Handle subsequent auth changes
    if (!isAuthenticated && !routeState.current.redirectInProgress) {
      routeState.current.redirectInProgress = true;
      
      requestAnimationFrame(() => {
        router.replace(redirectTo);
      });
      return;
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, isMounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProtectedRoute] Component unmounting, cleaning up state');
      }
      routeState.current = {
        initialCheckComplete: false,
        redirectInProgress: false,
        lastAuthState: null
      };
    };
  }, []);

  // Show loading state
  if (isLoading || !routeState.current.initialCheckComplete || routeState.current.redirectInProgress) {
    return loadingComponent ?? (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">
            {isLoading ? 'Checking authentication...' : 
             routeState.current.redirectInProgress ? 'Redirecting...' : 
             'Initializing...'}
          </p>
        </div>
      </div>
    );
  }

  // Only render children when authenticated and ready
  return isReadyToRender ? <>{children}</> : null;
}

// HOC for protecting routes
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; loadingComponent?: React.ReactNode }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
} 