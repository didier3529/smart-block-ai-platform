import React from 'react';
import { useWebSocket } from './websocket-context';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

interface FallbackProps {
  error: Error | null;
  resetError: () => void;
}

const WebSocketFallbackUI: React.FC<FallbackProps> = ({ error, resetError }) => {
  const { connect } = useWebSocket();

  const handleRetry = async () => {
    try {
      await connect();
      resetError();
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-red-600 mb-4">
          WebSocket Connection Error
        </h3>
        <p className="text-gray-600 mb-4">
          {error?.message || 'An error occurred with the WebSocket connection.'}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export class WebSocketErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WebSocket Error:', error);
    console.error('Error Info:', errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <WebSocketFallbackUI
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
} 