import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pincode } = body;

    // Validate required parameters
    if (!pincode) {
      return NextResponse.json(
        { error: 'Pincode is required' },
        { status: 400 }
      );
    }

    // Make request to backend API
    const backendUrl = `${API_BASE_URL}/warehouses/check-pincode`;
    console.log('Proxying pincode check to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pincode }),
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking pincode delivery:', error);
    return NextResponse.json(
      {
        success: false,
        pincode: '',
        mode: 'global',
        customWarehouses: 0,
        globalWarehouses: 0,
        hasCustomWarehouse: false,
        hasGlobalWarehouse: false,
        error: 'Failed to check pincode delivery'
      },
      { status: 500 }
    );
  }
}