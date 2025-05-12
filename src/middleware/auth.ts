import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '../types/common';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function authenticateRequest(
  request: Request | NextRequest
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
        status: 401,
      };
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Since we're in a development/testing environment, 
      // we'll allow a mock token for development
      if (process.env.NODE_ENV === 'development' && token === 'mock-jwt-token') {
        return {
          user: {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            address: '0x1234567890abcdef1234567890abcdef12345678',
            role: 'user',
            permissions: ['read', 'write'],
          },
        };
      }

      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );

      // Add user info to request context
      return {
        user: {
          id: payload.sub,
          address: payload.sub,
          role: payload.role,
          permissions: payload.permissions,
        },
      };
    } catch (error) {
      return {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
        status: 401,
      };
    }
  } catch (error) {
    return {
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      status: 500,
    };
  }
}

// Define proper types for the handler function
type ApiHandler<T = unknown> = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void> | void;

export function withAuth<T>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => {
    try {
      // Auth validation logic here
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided'
          }
        });
      }

      // In development, accept mock token
      if (process.env.NODE_ENV === 'development' && token === 'mock-jwt-token') {
        return await handler(req, res);
      }

      try {
        await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        return await handler(req, res);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          }
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed'
        }
      });
    }
  };
} 