// Warehouse-based location and delivery service
import { WarehouseInfo, ProductWithWarehouse } from './warehouse-validation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const USE_NEXTJS_API = true; // Use Next.js API routes for better error handling

export interface PincodeDeliveryCheck {
  success: boolean;
  pincode: string;
  mode: 'custom' | 'custom-disabled' | 'global';
  matchedWarehouse?: {
    _id: string;
    name: string;
    address: string;
    warehouseType: string;
    deliverySettings: {
      isDeliveryEnabled: boolean;
      disabledMessage: string;
      deliveryHours: {
        start: string;
        end: string;
      };
      deliveryDays: string[];
    };
  };
  deliveryStatus?: {
    isDelivering: boolean;
    message: string;
    shortMessage?: string;
    nextDeliveryDay?: string;
    nextDeliveryTime?: string;
    reason?: string;
  };
  customWarehouses: number;
  globalWarehouses: number;
  hasCustomWarehouse: boolean;
  hasGlobalWarehouse: boolean;
  error?: string;
}

export interface ProductsByPincode {
  success: boolean;
  products: ProductWithWarehouse[];
  totalProducts: number;
  deliveryMode: 'custom' | 'global';
  deliveryMessage: string;
  warehouses: WarehouseInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface LocationState {
  pincode: string | null;
  isLocationDetected: boolean;
  deliveryMode: 'custom' | 'global';
  deliveryMessage: string;
  showOverlay: boolean;
  overlayMessage: string;
  matchedWarehouse: WarehouseInfo | null;
  isGlobalMode: boolean;
}

/**
 * Check pincode delivery availability
 */
export async function checkPincodeDelivery(pincode: string): Promise<PincodeDeliveryCheck> {
  try {
    const apiUrl = USE_NEXTJS_API ? '/api/warehouses/check-pincode' : `${API_BASE_URL}/warehouses/check-pincode`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pincode }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking pincode delivery:', error);
    return {
      success: false,
      pincode,
      mode: 'global',
      customWarehouses: 0,
      globalWarehouses: 0,
      hasCustomWarehouse: false,
      hasGlobalWarehouse: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get products by pincode with warehouse filtering
 */
export async function getProductsByPincode(
  pincode: string,
  options: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    parentCategory?: string;
    search?: string;
    mode?: 'auto' | 'global';
    brand?: string[];
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<ProductsByPincode> {
  try {
    const queryParams = new URLSearchParams({
      pincode,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString(),
    });

    if (options.category) {
      queryParams.append('category', options.category);
    }

    if (options.subcategory) {
      queryParams.append('subcategory', options.subcategory);
    }

    if (options.parentCategory) {
      queryParams.append('parentCategory', options.parentCategory);
    }

    if (options.search) {
      queryParams.append('search', options.search);
    }

    if (options.mode) {
      queryParams.append('mode', options.mode);
    }
    
    if (options.brand && options.brand.length > 0) {
      queryParams.append('brand', options.brand.join(','));
    }
    
    if (options.sort) {
      queryParams.append('sort', options.sort);
    }
    
    if (options.minPrice) {
      queryParams.append('minPrice', options.minPrice.toString());
    }
    
    if (options.maxPrice) {
      queryParams.append('maxPrice', options.maxPrice.toString());
    }

    const apiUrl = USE_NEXTJS_API ? `/api/warehouses/products-by-pincode?${queryParams}` : `${API_BASE_URL}/warehouses/products-by-pincode?${queryParams}`;
    console.log('Fetching products from:', apiUrl);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Products API response:', data);
    return data;
  } catch (error) {
    console.error('Error getting products by pincode:', error);
    return {
      success: false,
      products: [],
      totalProducts: 0,
      deliveryMode: 'global',
      deliveryMessage: 'Failed to load products',
      warehouses: [],
      pagination: {
        page: options.page || 1,
        limit: options.limit || 20,
        total: 0,
        pages: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get delivery status for a warehouse
 */
export async function getDeliveryStatus(warehouseId: string, timezone = 'Asia/Kolkata') {
  try {
    const apiUrl = USE_NEXTJS_API ? '/api/warehouses/delivery-status' : `${API_BASE_URL}/warehouses/delivery-status`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ warehouseId, timezone }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting delivery status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract pincode from address string
 */
export function extractPincodeFromAddress(address: string): string | null {
  const pincodeMatch = address.match(/\b\d{6}\b/);
  return pincodeMatch ? pincodeMatch[0] : null;
}

/**
 * Validate pincode format
 */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

/**
 * Get user's pincode from geolocation using reverse geocoding
 */
export async function getPincodeFromGeolocation(): Promise<string | null> {
  try {
    // Get current position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve, 
        (error) => {
          let errorMessage = 'Unknown geolocation error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        }, 
        {
          enableHighAccuracy: false, // Changed to false for faster response
          timeout: 5000, // Reduced timeout from 8000ms to 5000ms for faster fallback
          maximumAge: 300000 // 5 minutes
        }
      );
    });

    const { latitude, longitude } = position.coords;

    // Use a reverse geocoding service to get pincode
    // You can use Google Maps API, OpenStreetMap Nominatim, or any other service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for API call
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.address) {
        const pincode = data.address.postcode;
        if (pincode && isValidPincode(pincode)) {
          return pincode;
        }
      }

      throw new Error('No valid pincode found in location data');
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Reverse geocoding request timed out');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error getting pincode from geolocation:', error);
    return null;
  }
}

/**
 * Store location state in localStorage
 */
export function saveLocationState(state: Partial<LocationState>) {
  try {
    const currentState = getLocationState();
    const newState = { ...currentState, ...state };
    localStorage.setItem('locationState', JSON.stringify(newState));
  } catch (error) {
    console.error('Error saving location state:', error);
  }
}

/**
 * Get location state from localStorage
 */
export function getLocationState(): LocationState {
  try {
    const stored = localStorage.getItem('locationState');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting location state:', error);
  }

  // Default state
  return {
    pincode: null,
    isLocationDetected: false,
    deliveryMode: 'global',
    deliveryMessage: '',
    showOverlay: false,
    overlayMessage: '',
    matchedWarehouse: null,
    isGlobalMode: false
  };
}

/**
 * Clear location state
 */
export function clearLocationState() {
  try {
    localStorage.removeItem('locationState');
  } catch (error) {
    console.error('Error clearing location state:', error);
  }
}

/**
 * Format delivery message based on mode and status
 */
export function formatDeliveryMessage(
  mode: 'custom' | 'global',
  deliveryStatus?: { isDelivering: boolean; message: string; nextDeliveryDay?: string }
): string {
  if (mode === 'global') {
    return 'May take few days';
  }

  if (deliveryStatus) {
    return deliveryStatus.message;
  }

  return 'Delivery information not available';
}