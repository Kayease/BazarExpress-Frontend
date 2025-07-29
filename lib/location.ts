// Location-based delivery and product filtering utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface DeliveryAddress extends LocationCoordinates {
  address?: string;
  building?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface WarehouseDeliveryInfo {
  warehouseId: string;
  warehouseName: string;
  warehouseAddress: string;
  distance: number;
  duration: number;
  method: string;
  fallback: boolean;
  deliverySettings: {
    maxDeliveryRadius: number;
    freeDeliveryRadius: number;
    isDeliveryEnabled: boolean;
  };
  isFreeDeliveryZone: boolean;
  canDeliver: boolean;
}

export interface LocationDeliveryResponse {
  success: boolean;
  deliveryAvailable: boolean;
  message: string;
  availableWarehouses: WarehouseDeliveryInfo[];
  location: LocationCoordinates;
  totalWarehouses?: number;
  deliverableWarehouses?: number;
  error?: string;
}

export interface ProductWithDelivery {
  _id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  warehouseId: {
    _id: string;
    name: string;
    address: string;
  };
  deliveryInfo: {
    distance: number;
    duration: number;
    isFreeDeliveryZone: boolean;
    warehouseName: string;
  } | null;
}

export interface LocationProductsResponse {
  success: boolean;
  deliveryAvailable: boolean;
  message: string;
  products: ProductWithDelivery[];
  totalProducts: number;
  location: LocationCoordinates;
  availableWarehouses: WarehouseDeliveryInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface CartValidationResponse {
  success: boolean;
  allItemsDeliverable: boolean;
  message: string;
  deliveryAddress: DeliveryAddress;
  validationResults: Array<{
    warehouseId: string;
    warehouseName: string;
    distance: number;
    maxRadius: number;
    canDeliver: boolean;
    itemCount: number;
    method: string;
  }>;
  undeliverableItems: Array<{
    _id: string;
    name: string;
    warehouseId: string;
    warehouseName: string;
    reason: string;
  }>;
  deliverableItemCount: number;
  totalItemCount: number;
  error?: string;
}

/**
 * Check if delivery is available to a specific location
 */
export async function checkLocationDelivery(coordinates: LocationCoordinates): Promise<LocationDeliveryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/location/check-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(coordinates),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking location delivery:', error);
    return {
      success: false,
      deliveryAvailable: false,
      message: 'Failed to check delivery availability',
      availableWarehouses: [],
      location: coordinates,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get products available for delivery to a specific location
 */
export async function getProductsByLocation(
  coordinates: LocationCoordinates,
  options: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<LocationProductsResponse> {
  try {
    const queryParams = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lng: coordinates.lng.toString(),
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString(),
    });

    if (options.category) {
      queryParams.append('category', options.category);
    }

    if (options.search) {
      queryParams.append('search', options.search);
    }

    const response = await fetch(`${API_BASE_URL}/location/products?${queryParams}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting products by location:', error);
    return {
      success: false,
      deliveryAvailable: false,
      message: 'Failed to get products for location',
      products: [],
      totalProducts: 0,
      location: coordinates,
      availableWarehouses: [],
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
 * Validate if all cart items can be delivered to the selected address
 */
export async function validateCartDelivery(
  cartItems: Array<{
    _id: string;
    name: string;
    warehouseId: string;
    quantity: number;
  }>,
  deliveryAddress: DeliveryAddress
): Promise<CartValidationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/location/validate-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartItems,
        deliveryAddress
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating cart delivery:', error);
    return {
      success: false,
      allItemsDeliverable: false,
      message: 'Failed to validate cart delivery',
      deliveryAddress,
      validationResults: [],
      undeliverableItems: [],
      deliverableItemCount: 0,
      totalItemCount: cartItems.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get user's current location using browser geolocation API
 */
export function getCurrentLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
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
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * Format duration for display
 */
export function formatDuration(duration: number): string {
  if (duration < 60) {
    return `${Math.round(duration)} min`;
  }
  const hours = Math.floor(duration / 60);
  const minutes = Math.round(duration % 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(coordinates: LocationCoordinates): boolean {
  return (
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180 &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng)
  );
}

/**
 * Get delivery zone status message
 */
export function getDeliveryZoneMessage(deliveryInfo: WarehouseDeliveryInfo): string {
  if (!deliveryInfo.canDeliver) {
    return `Outside delivery zone (${formatDistance(deliveryInfo.distance)} > ${deliveryInfo.deliverySettings.maxDeliveryRadius}km)`;
  }
  
  if (deliveryInfo.isFreeDeliveryZone) {
    return `Free delivery zone (${formatDistance(deliveryInfo.distance)})`;
  }
  
  return `Delivery available (${formatDistance(deliveryInfo.distance)})`;
}