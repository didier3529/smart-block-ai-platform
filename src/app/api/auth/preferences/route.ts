import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';

export async function PATCH(request: Request) {
  try {
    // Verify the request has a valid token
    const authResult = await authenticateRequest(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.status }
      );
    }

    // Get preferences from request body
    const preferences = await request.json();
    
    // Validate preferences
    const validPreferences = {};
    
    if ('theme' in preferences) {
      validPreferences['theme'] = ['light', 'dark'].includes(preferences.theme) 
        ? preferences.theme 
        : 'dark';
    }
    
    if ('notifications' in preferences) {
      validPreferences['notifications'] = Boolean(preferences.notifications);
    }
    
    if ('defaultNetwork' in preferences) {
      validPreferences['defaultNetwork'] = preferences.defaultNetwork;
    }

    // In a real implementation, you would update the user preferences in your database
    // For now, we'll just return the updated preferences
    return NextResponse.json(validPreferences);
  } catch (error) {
    console.error('Update preferences failed:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
} 