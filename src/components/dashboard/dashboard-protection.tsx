'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { DashboardProvider } from './dashboard-context';

interface DashboardProtectionProps {
  children: React.ReactNode;
}

export function DashboardProtection({ children }: DashboardProtectionProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const initializeDashboard = useCallback(async () => {
    try {
      if (!isLoading) {
        if (!isAuthenticated) {
          console.log('Dashboard: User not authenticated, redirecting to landing page');
          router.replace('/');
          return;
        }

        // Add any additional dashboard initialization logic here
        // For example, loading user preferences, recent activity, etc.
        
        console.log('Dashboard: User authenticated, initializing dashboard');
        setIsInitializing(false);
      }
    } catch (err) {
      console.error('Dashboard initialization error:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize dashboard'));
      setIsInitializing(false);
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // Handle loading state
  if (isLoading || (isInitializing && !error)) {
    return <LoadingScreen />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Dashboard Error</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!isAuthenticated || !user) {
    return null;
  }

  // Render dashboard with provider
  return (
    <DashboardProvider user={user}>
      {children}
    </DashboardProvider>
  );
} 