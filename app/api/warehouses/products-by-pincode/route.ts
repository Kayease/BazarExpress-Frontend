import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract all query parameters
    const pincode = searchParams.get('pincode');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const parentCategory = searchParams.get('parentCategory');
    const search = searchParams.get('search');
    const mode = searchParams.get('mode') || 'auto';
    const brand = searchParams.get('brand');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const includeOutOfStock = searchParams.get('includeOutOfStock');

    // Validate required parameters
    if (!pincode) {
      return NextResponse.json(
        { error: 'Pincode is required' },
        { status: 400 }
      );
    }

    // Build query parameters for backend API
    const backendParams = new URLSearchParams({
      pincode,
      page,
      limit,
      mode
    });

    // Add optional parameters if they exist
    if (category) {
      backendParams.append('category', category);
    }
    
    if (subcategory) {
      backendParams.append('subcategory', subcategory);
    }
    
    if (parentCategory) {
      backendParams.append('parentCategory', parentCategory);
    }
    
    if (search) {
      backendParams.append('search', search);
    }
    
    if (brand) {
      backendParams.append('brand', brand);
    }
    
    if (sort) {
      backendParams.append('sort', sort);
    }
    
    if (minPrice) {
      backendParams.append('minPrice', minPrice);
    }
    
    if (maxPrice) {
      backendParams.append('maxPrice', maxPrice);
    }
    
    if (includeOutOfStock) {
      backendParams.append('includeOutOfStock', includeOutOfStock);
    }

    // Make request to backend API
    const backendUrl = `${API_BASE_URL}/warehouses/products-by-pincode?${backendParams.toString()}`;
    console.log('Proxying request to:', backendUrl);
    console.log('includeOutOfStock parameter:', includeOutOfStock);
    console.log('All backend params:', Object.fromEntries(backendParams.entries()));

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Log product stock information for debugging
    if (data.products && Array.isArray(data.products)) {
      const outOfStockCount = data.products.filter((p: any) => p.stock === 0 || p.stock < 0).length;
      const inStockCount = data.products.filter((p: any) => p.stock > 0).length;
      console.log('Products returned from backend:', {
        total: data.products.length,
        inStock: inStockCount,
        outOfStock: outOfStockCount,
        includeOutOfStockParam: includeOutOfStock
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products by pincode:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch products by pincode',
        products: [],
        totalProducts: 0,
        deliveryMode: 'global',
        deliveryMessage: 'Failed to load products',
        warehouses: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      },
      { status: 500 }
    );
  }
}