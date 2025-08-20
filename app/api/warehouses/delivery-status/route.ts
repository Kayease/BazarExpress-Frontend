import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { warehouseId, timezone = 'Asia/Kolkata' } = body;

    // Validate required parameters
    if (!warehouseId) {
      return NextResponse.json(
        { error: 'Warehouse ID is required' },
        { status: 400 }
      );
    }

    // Make request to backend API
    const backendUrl = `${API_BASE_URL}/warehouses/delivery-status`;
    console.log('Proxying delivery status check to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ warehouseId, timezone }),
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting delivery status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get delivery status'
      },
      { status: 500 }
    );
  }
}