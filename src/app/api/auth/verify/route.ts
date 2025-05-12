import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { authenticateRequest } from '@/middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    // Verify the request has a valid token
    const authResult = await authenticateRequest(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { valid: false, error: authResult.error.message },
        { status: authResult.status }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { valid: false, error: 'Token verification failed' },
      { status: 500 }
    );
  }
} 