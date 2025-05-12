"use client";

import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { UnifiedSidebar } from "./unified-sidebar";
import { Header } from "./header";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ErrorBoundary } from 'react-error-boundary';
import { MobileNavbar } from "@/components/dashboard/mobile-navbar";
import { usePathname } from 'next/navigation';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="mb-6 text-gray-400">{error.message || "An unexpected error occurred"}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

interface UnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  fullWidth?: boolean;
  containerSize?: 'default' | 'small' | 'large';
  noSpacing?: boolean;
  className?: string;
}

export function UnifiedLayout({
  children,
  title,
  description,
  actions,
  fullWidth = false,
  containerSize = 'default',
  noSpacing = false,
  className,
}: UnifiedLayoutProps) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Paths that should use dashboard layout
  const dashboardPaths = [
    '/dashboard',
    '/dashboard/portfolio',
    '/dashboard/market',
    '/dashboard/nfts',
    '/dashboard/contracts',
    '/dashboard/settings'
  ];

  const isDashboardLayout = dashboardPaths.some(p => pathname.startsWith(p));

  // Dashboard Layout
  if (isDashboardLayout) {
    return (
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          window.location.href = '/dashboard';
        }}
      >
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
          {!isMobile && <UnifiedSidebar />}
          <main className={cn("transition-all duration-300", isMobile ? '' : 'ml-64')}>
            {isMobile ? <MobileNavbar /> : <Header />}
            <div className="p-8">
              {(title || description || actions) && (
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    {title && (
                      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    )}
                    {description && (
                      <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                  {actions && <div className="flex items-center gap-4">{actions}</div>}
                </div>
              )}
              <div className="space-y-6">{children}</div>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  // Landing/Default Layout
  return (
    <div
      className={cn(
        'relative',
        !noSpacing && 'py-16 md:py-20 lg:py-24',
        className
      )}
    >
      {fullWidth ? (
        children
      ) : (
        <Container size={containerSize}>
          {(title || description || actions) && (
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                {title && (
                  <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-4">{actions}</div>}
            </div>
          )}
          {children}
        </Container>
      )}
    </div>
  );
} 