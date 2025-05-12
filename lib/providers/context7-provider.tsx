'use client';

import { ReactNode } from 'react';
import { ErrorProvider } from './error-provider';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { ThemeProvider } from './theme-provider';
import { PortfolioProvider } from '@/lib/providers/portfolio-provider';

interface Context7ProviderProps {
  children: ReactNode;
}

export function Context7Provider({ children }: Context7ProviderProps) {
  return (
    <ErrorProvider>
      <AuthProvider>
        <ThemeProvider>
          <PortfolioProvider>
            {children}
          </PortfolioProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorProvider>
  );
} 