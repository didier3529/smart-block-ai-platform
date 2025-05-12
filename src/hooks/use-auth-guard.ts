import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';

interface AuthGuardState {
  isChecking: boolean;
  canAccess: boolean;
  lastCheck: number;
  redirectInProgress: boolean;
}

export function useAuthGuard(options = { redirectTo: '/' }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const guardState = useRef<AuthGuardState>({
    isChecking: true,
    canAccess: false,
    lastCheck: Date.now(),
    redirectInProgress: false,
  });
  const [state, setState] = useState<Pick<AuthGuardState, 'isChecking' | 'canAccess'>>({
    isChecking: true,
    canAccess: false,
  });

  // Debug logging in development
  const logDebug = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthGuard] ${message}`, data ? data : '');
    }
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (isLoading) {
      logDebug('Loading auth state...');
      return;
    }

    const currentTime = Date.now();
    guardState.current.lastCheck = currentTime;

    if (!isAuthenticated && !guardState.current.redirectInProgress) {
      logDebug('Not authenticated, initiating redirect', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });

      guardState.current.redirectInProgress = true;
      guardState.current.canAccess = false;

      // Use requestAnimationFrame for smoother transitions
      requestAnimationFrame(() => {
        router.replace(options.redirectTo);
      });
    } else if (isAuthenticated) {
      logDebug('Authentication verified', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });

      guardState.current.canAccess = true;
      guardState.current.redirectInProgress = false;
    }

    // Update state only if this is the most recent check
    if (guardState.current.lastCheck === currentTime) {
      setState({
        isChecking: false,
        canAccess: guardState.current.canAccess,
      });
    }
  }, [isAuthenticated, isLoading, router, user, options.redirectTo, logDebug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logDebug('AuthGuard unmounting, cleaning up state');
      guardState.current = {
        isChecking: true,
        canAccess: false,
        lastCheck: Date.now(),
        redirectInProgress: false,
      };
    };
  }, [logDebug]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoading && !isAuthenticated) {
        logDebug('Page visible, rechecking auth state');
        guardState.current.redirectInProgress = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading, isAuthenticated, logDebug]);

  return {
    isLoading: isLoading || state.isChecking,
    canAccess: state.canAccess,
    isAuthenticated,
    user,
  };
} 