"use client"

import { Component, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface ErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  retryAttempt?: number
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h2>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-4 overflow-auto text-sm">
                {this.state.error.toString()}
              </pre>
            )}
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {this.props.retryAttempt !== undefined && (
                <span className="block mb-2">
                  Retry attempt: {this.props.retryAttempt}
                </span>
              )}
              We apologize for the inconvenience. Please try again or contact support if the problem persists.
            </p>
            <button
              onClick={this.handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 