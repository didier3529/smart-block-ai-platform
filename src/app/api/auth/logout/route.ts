import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';

export async function POST(request: Request) {
  try {
    // Verify the request has a valid token
    const authResult = await authenticateRequest(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.status }
      );
    }

    // In a real implementation, you would invalidate the token in your backend
    // For now, we'll just return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 