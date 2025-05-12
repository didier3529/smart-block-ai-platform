"use client"

import React from 'react'
import { usePathname } from 'next/navigation'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class DevelopmentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Development Error Boundary caught an error:', {
        error,
        errorInfo,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  private cleanCache = async () => {
    try {
      // Clear localStorage
      window.localStorage.clear()
      
      // Reload the page
      window.location.reload()
    } catch (error) {
      console.error('Failed to clean cache:', error)
    }
  }

  private restartApp = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Development Mode Error</h1>
            
            <div className="mb-6">
              <h2 className="text-xl text-white mb-2">Error Details:</h2>
              <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm text-gray-300">
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.errorInfo && (
              <div className="mb-6">
                <h2 className="text-xl text-white mb-2">Component Stack:</h2>
                <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm text-gray-300">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.cleanCache}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Clean Cache & Reload
              </button>
              <button
                onClick={this.restartApp}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Restart Application
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <p className="mt-4 text-sm text-gray-400">
                This error boundary is only active in development mode. In production, errors will be handled by the global error boundary.
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 