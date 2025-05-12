import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ApiError, ApiResponse, Result, ValidationError, createApiResponse } from '@/types/common';
export { ApiError } from '@/types/common';

interface ApiContext {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
  requestId: string;
  timestamp: number;
}

export function createApiHandler<T>(config: {
  handler: (req: NextRequest, context: ApiContext) => Promise<Result<T, ApiError | ValidationError>>;
  validationSchema?: ZodSchema;
}) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const context: ApiContext = {
      requestId: uuidv4(),
      timestamp: Date.now()
    };

    try {
      // Validate request body if schema provided
      if (config.validationSchema) {
        try {
          const body = await req.json();
          config.validationSchema.parse(body);
        } catch (error) {
          if (error instanceof ZodError) {
            return NextResponse.json(
              createApiResponse(
                Result.error(
                  new ValidationError(
                    'VALIDATION_ERROR',
                    'Invalid request data',
                    { errors: error.errors }
                  )
                )
              ),
              { status: 400 }
            );
          }
          throw error;
        }
      }

      // Execute handler
      const result = await config.handler(req, context);
      
      // Create response based on result
      const response = createApiResponse(result);
      
      // Determine status code based on error type
      const status = result.fold(
        () => 200,
        (error) => {
          switch (error.type) {
            case 'validation-error':
              return 400;
            case 'api-error':
              return error instanceof ApiError ? error.code === 'NOT_FOUND' ? 404 : 400 : 400;
            default:
              return 500;
          }
        }
      );

      return NextResponse.json(response, { status });

    } catch (error) {
      // Handle unexpected errors
      console.error('Unexpected API error:', error);
      
      return NextResponse.json(
        createApiResponse(
          Result.error(
            new ApiError(
              'INTERNAL_ERROR',
              'An unexpected error occurred',
              process.env.NODE_ENV === 'development' ? { originalError: error } : undefined
            )
          )
        ),
        { status: 500 }
      );
    }
  };
}

// Helper to create route handlers with authentication
export function createProtectedApiHandler<T>(config: {
  handler: (req: NextRequest, context: ApiContext) => Promise<T>;
  validationSchema?: ZodSchema;
}) {
  const baseHandler = createApiHandler(config);
  return (req: NextRequest, context: ApiContext) => {
    if (!context.user) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          requestId: uuidv4(),
          timestamp: Date.now(),
        },
      };
      return NextResponse.json(response, { status: 401 });
    }
    return baseHandler(req, context);
  };
} 