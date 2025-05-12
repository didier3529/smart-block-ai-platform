export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  BLOCKCHAIN = 'blockchain',
  WEBSOCKET = 'websocket',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal',
  UNKNOWN = 'unknown'
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorRate: number;
  recentErrors: Array<{
    id: string;
    message: string;
    category: ErrorCategory;
    timestamp: Date;
    resolved: boolean;
  }>;
}

export interface ErrorDetails {
  code?: string;
  retryable: boolean;
  source?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class BaseError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public details: ErrorDetails
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  public isRetryable(): boolean {
    return this.details.retryable;
  }

  public toJSON(): Record<string, unknown> {
    return {
      message: this.message,
      category: this.category,
      name: this.name,
      details: this.details,
      stack: this.stack
    };
  }
}

export class NetworkError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.NETWORK, {
      retryable: true,
      timestamp: new Date(),
      ...details
    });
  }
}

export class ApiError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.API, {
      retryable: false,
      timestamp: new Date(),
      ...details
    });
  }
}

export class BlockchainError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.BLOCKCHAIN, {
      retryable: true,
      timestamp: new Date(),
      ...details
    });
  }
}

export class WebSocketError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.WEBSOCKET, {
      retryable: true,
      timestamp: new Date(),
      ...details
    });
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.VALIDATION, {
      retryable: false,
      timestamp: new Date(),
      ...details
    });
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.AUTHENTICATION, {
      retryable: false,
      timestamp: new Date(),
      ...details
    });
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.AUTHORIZATION, {
      retryable: false,
      timestamp: new Date(),
      ...details
    });
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.RATE_LIMIT, {
      retryable: true,
      timestamp: new Date(),
      ...details
    });
  }
}

export class InternalError extends BaseError {
  constructor(message: string, details: Partial<ErrorDetails> = {}) {
    super(message, ErrorCategory.INTERNAL, {
      retryable: false,
      timestamp: new Date(),
      ...details
    });
  }
}

// Error handling utilities
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof BaseError) {
    return error.isRetryable();
  }
  return false;
};

export const categorizeError = (error: unknown): ErrorCategory => {
  if (error instanceof BaseError) {
    return error.category;
  }
  return ErrorCategory.UNKNOWN;
};

export const createErrorFromUnknown = (error: unknown): BaseError => {
  if (error instanceof BaseError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new InternalError(message, {
    context: { originalError: error }
  });
}; 