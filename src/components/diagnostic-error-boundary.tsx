"use client";

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class DiagnosticErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log("=== DIAGNOSTIC ERROR BOUNDARY CAUGHT ERROR ===");
    console.log("Error:", error);
    console.log("Component Stack:", errorInfo.componentStack);
    console.log("===========================================");
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 border border-red-500 rounded-lg bg-red-50">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <details className="cursor-pointer">
            <summary className="text-red-600 mb-2">Click for error details</summary>
            <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border border-red-200">
              {this.state.error.toString()}
              {"\n\nComponent Stack:\n"}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
} 