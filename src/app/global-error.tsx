"use client"

import { Inter } from "next/font/google"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Critical Error</h2>
            <div className="mb-4 p-4 bg-red-50 rounded text-sm">
              <p className="text-red-700">
                A critical error has occurred. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              )}
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
} 