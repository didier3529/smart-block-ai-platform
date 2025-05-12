import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: Request) {
  try {
    // Verify the request has a valid token
    const authResult = await authenticateRequest(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.status }
      );
    }

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Decode the token to get user data
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; chainId: string };
    
    // Create a user object with data from the token
    const user = {
      id: decoded.sub,
      address: decoded.sub,
      networks: [decoded.chainId],
      preferences: {
        defaultNetwork: decoded.chainId,
        theme: 'dark',
        notifications: true,
      },
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user data:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
} 