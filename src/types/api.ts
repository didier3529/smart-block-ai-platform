import { z } from 'zod';

// Base request validation schemas
export const BaseRequestSchema = z.object({
  timestamp: z.number().optional(),
  requestId: z.string().optional(),
});

// Analysis request schema
export const AnalysisRequestSchema = BaseRequestSchema.extend({
  data: z.any(), // Will be refined by specific agent schemas
  options: z.object({
    priority: z.enum(['low', 'medium', 'high']).optional(),
    timeout: z.number().optional(),
  }).optional(),
});

// Analysis status schema
export const AnalysisStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number().optional(),
  error: z.string().optional(),
  completedAt: z.string().optional(),
  result: z.any().optional(),
});

// History query schema
export const HistoryQuerySchema = BaseRequestSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp?: number;
    batched?: boolean;
    performance?: {
      processingTime?: number;
      batchSize?: number;
      cacheHit?: boolean;
      retryCount?: number;
    };
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp?: number;
    batched?: boolean;
    performance?: {
      processingTime?: number;
      batchSize?: number;
      cacheHit?: boolean;
      retryCount?: number;
    };
  };
}

// Agent types
export enum AgentType {
  TrendSpotter = 'trend-spotter',
  SmartContractAnalyzer = 'smart-contract-analyzer',
  NFTAdvisor = 'nft-advisor'
}

// Export types from schemas
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>; 