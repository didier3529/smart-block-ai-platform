import type { AppProps } from 'next/app';
import { RootProvider } from '@/lib/providers/root-provider';
import { ErrorBoundary } from '@/components/error-boundary';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <RootProvider>
        <Component {...pageProps} />
      </RootProvider>
    </ErrorBoundary>
  );
} 