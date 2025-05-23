"use client"

import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { RootProvider } from "@/lib/providers/root-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Smart Block AI</title>
        <meta
          name="description"
          content="AI-powered blockchain analytics platform for market insights, portfolio management, and smart contract security analysis."
        />
        <link rel="icon" href="/smart-block-favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/smart-block-favicon.svg" />
        <link rel="shortcut icon" href="/smart-block-favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-black font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <RootProvider>
            {children}
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}