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
  title: 'Smart Block AI',
  description: 'AI-powered blockchain analytics platform',
  icons: {
    icon: { url: '/brain-icon-v2.svg?v=2', type: 'image/svg+xml' },
    apple: '/brain-icon-v2.svg?v=2',
  },
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/brain-icon-v2.svg?v=2" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/brain-icon-v2.svg?v=2" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
} 