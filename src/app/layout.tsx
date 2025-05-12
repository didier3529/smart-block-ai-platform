import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Use RootProvider which includes QueryClientProvider and all other providers
import { RootProvider } from '@/lib/providers/root-provider';

const inter = Inter({ subsets: ['latin'] });

// Metadata can't be in a client component, so we keep RootLayout as server
// and use a client component wrapper for pathname logic if needed,
// or pass pathname down. For now, let's try conditional rendering here.

// export const metadata: Metadata = { // This needs to be top-level or in a server component
//   title: "Smart Block AI",
//   description: "AI-powered blockchain analytics platform",
// }

export const metadata: Metadata = {
  title: 'ChainOracle',
  description: 'AI-powered blockchain analytics platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
} 