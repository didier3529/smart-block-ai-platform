import { Result } from 'typescript-result';
export { Result } from 'typescript-result';

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
}

export interface WebSocketHandler<T = unknown> {
  (data: T): void;
}

export interface WebSocketSubscription {
  channel: string;
  handler: WebSocketHandler;
}

// Base error interface with discriminated union type
export interface BaseError {
  type: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  retryable?: boolean;
}

// API specific errors
export class ApiError extends Error implements BaseError {
  readonly type = 'api-error';
  readonly timestamp: number;
  
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.timestamp = Date.now();
  }
}

// Validation error
export class ValidationError extends Error implements BaseError {
  readonly type = 'validation-error';
  readonly timestamp: number;
  
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.timestamp = Date.now();
    this.retryable = false;
  }
}

// Network error
export class NetworkError extends Error implements BaseError {
  readonly type = 'network-error';
  readonly timestamp: number;
  
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
    this.timestamp = Date.now();
  }
}

// Result types using the Result monad pattern
export type AsyncResult<T, E extends BaseError = BaseError> = Promise<Result<T, E>>;

export type ApiResult<T> = Result<T, ApiError>;
export type ValidationResult<T> = Result<T, ValidationError>;
export type NetworkResult<T> = Result<T, NetworkError>;

// Helper function to wrap async operations
export async function wrapAsync<T, E extends BaseError>(
  operation: () => Promise<T>,
  errorTransform: (error: unknown) => E
): AsyncResult<T, E> {
  try {
    const result = await operation();
    return Result.ok(result);
  } catch (error) {
    return Result.error(errorTransform(error));
  }
}

// Helper to create API responses
export function createApiResponse<T>(result: Result<T, BaseError>): ApiResponse<T> {
  return result.fold(
    (value) => ({
      success: true,
      data: value,
      meta: {
        timestamp: Date.now()
      }
    }),
    (error) => ({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      meta: {
        timestamp: error.timestamp
      }
    })
  );
}

export interface PaginatedResponse<T> {
  entries: T[];
  total: number;
  nextCursor?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  balance: string;
  value: number;
  valueChange24h: number;
}

export interface MetricsData {
  value: number;
  label: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'transaction' | 'event' | 'alert';
  status?: 'success' | 'warning' | 'error';
}

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (params?: unknown) => void) => void;
  removeListener: (event: string, callback: (params?: unknown) => void) => void;
}

export interface BlockchainEventHandler<T = unknown> {
  (data: T): void;
}

export interface ResetKeysConfig {
  keys: string[];
  resetCallback?: () => void;
}

// Blockchain Types
export type ChainId = number | string;
export type Address = string;
export type TransactionHash = string;

export type BlockchainEvent = {
  type: string;
  chainId: ChainId;
  data: Record<string, unknown>;
  timestamp: number;
};

// Configuration Types
export type Config = {
  key: string;
  value: unknown;
  metadata?: Record<string, unknown>;
};

// Processing Types
export type ProcessingResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: ErrorType;
  meta?: Record<string, unknown>;
};

export type ProcessingStep = {
  name: string;
  handler: (input: unknown) => Promise<ProcessingResult>;
  options?: Record<string, unknown>;
};

// Cache Types
export type CacheEntry<T = unknown> = {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number;
};

// Subscription Types
export type Subscription = {
  id: string;
  type: string;
  callback: (data: unknown) => void;
  filters?: Record<string, unknown>;
};

// Message Types
export type Message = {
  id: string;
  type: string;
  content: unknown;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

// State Types
export type State = {
  key: string;
  value: unknown;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

// Agent Types
export type AgentConfig = {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AgentResponse = {
  success: boolean;
  data?: unknown;
  error?: ErrorType;
  meta?: Record<string, unknown>;
};

// Model Types
export type ModelConfig = {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ModelResponse = {
  success: boolean;
  data?: unknown;
  error?: ErrorType;
  meta?: Record<string, unknown>;
};

// API Response format
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: ApiError;
}

// API Error format
export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

// Auth Error response
export interface AuthError {
  error: ApiError;
  status: number;
}

// Auth Success response
export interface AuthSuccess<T = any> {
  user: T;
  token?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
} 