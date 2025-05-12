import { ComponentType } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface WithAuthGuardOptions {
  redirectTo?: string;
  LoadingComponent?: ComponentType;
}

const DefaultLoadingComponent = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-sm text-gray-600">Verifying authentication...</p>
    </div>
  </div>
);

export function withAuthGuard<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthGuardOptions = {}
) {
  const {
    redirectTo = '/',
    LoadingComponent = DefaultLoadingComponent
  } = options;

  return function WithAuthGuardComponent(props: P) {
    const { isLoading, canAccess } = useAuthGuard({ redirectTo });

    if (isLoading) {
      return <LoadingComponent />;
    }

    if (!canAccess) {
      return null; // Prevent flash while redirecting
    }

    return <WrappedComponent {...props} />;
  };
} 