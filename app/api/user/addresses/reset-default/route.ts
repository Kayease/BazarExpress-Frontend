import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const token = (await headersList).get('cookie')?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Forward the request to reset all default addresses
    const response = await fetch(`${API_URL}/user/addresses/reset-default`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to reset default addresses' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/user/addresses/reset-default:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 