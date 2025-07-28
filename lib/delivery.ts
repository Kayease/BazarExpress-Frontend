// Delivery calculation utilities

export interface DeliverySettings {
  freeDeliveryMinAmount: number;
  freeDeliveryRadius: number;
  baseDeliveryCharge: number;
  minimumDeliveryCharge: number;
  maximumDeliveryCharge: number;
  perKmCharge: number;
  codAvailable: boolean;
  codExtraCharge: number;
  calculationMethod: 'haversine' | 'straight_line';
}

export interface DeliveryCalculationResult {
  distance: number;
  deliveryCharge: number;
  codCharge: number;
  totalDeliveryCharge: number;
  isFreeDelivery: boolean;
  freeDeliveryEligible: boolean;
  amountNeededForFreeDelivery: number;
  settings: DeliverySettings;
}

export interface Location {
  lat: number;
  lng: number;
}

// Haversine formula for distance calculation
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  method: 'haversine' | 'straight_line' = 'haversine'
): number {
  if (method === 'straight_line') {
    // Simple straight line distance (less accurate but faster)
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const distance = Math.sqrt(dLat * dLat + dLon * dLon) * R;
    return distance;
  } else {
    // Haversine formula (more accurate)
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }
}

// Calculate delivery charge based on distance and cart total
export function calculateDeliveryCharge(
  distance: number,
  cartTotal: number,
  paymentMethod: 'online' | 'cod',
  settings: DeliverySettings
): Omit<DeliveryCalculationResult, 'distance' | 'settings'> {
  let deliveryCharge = 0;
  let isFreeDelivery = false;
  let freeDeliveryEligible = false;
  
  // Check if eligible for free delivery
  if (cartTotal >= settings.freeDeliveryMinAmount && distance <= settings.freeDeliveryRadius) {
    isFreeDelivery = true;
    deliveryCharge = 0;
  } else {
    // Calculate delivery charge based on distance
    if (distance <= settings.freeDeliveryRadius) {
      deliveryCharge = settings.baseDeliveryCharge;
    } else {
      const extraDistance = distance - settings.freeDeliveryRadius;
      deliveryCharge = settings.baseDeliveryCharge + (extraDistance * settings.perKmCharge);
    }
    
    // Apply min/max limits
    deliveryCharge = Math.max(settings.minimumDeliveryCharge, deliveryCharge);
    deliveryCharge = Math.min(settings.maximumDeliveryCharge, deliveryCharge);
  }
  
  // Add COD charge if applicable
  let codCharge = 0;
  if (paymentMethod === 'cod' && settings.codAvailable) {
    codCharge = settings.codExtraCharge;
  }
  
  // Check if user can get free delivery by adding more items
  const amountNeededForFreeDelivery = Math.max(0, settings.freeDeliveryMinAmount - cartTotal);
  if (amountNeededForFreeDelivery > 0 && distance <= settings.freeDeliveryRadius) {
    freeDeliveryEligible = true;
  }
  
  return {
    deliveryCharge,
    codCharge,
    totalDeliveryCharge: deliveryCharge + codCharge,
    isFreeDelivery,
    freeDeliveryEligible,
    amountNeededForFreeDelivery
  };
}

// Fetch delivery settings from API
export async function fetchDeliverySettings(): Promise<DeliverySettings | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery/settings`);
    const data = await response.json();
    
    if (data.success && data.settings) {
      return data.settings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return null;
  }
}

// Calculate delivery charge via API
export async function calculateDeliveryChargeAPI(
  customerLat: number,
  customerLng: number,
  cartTotal: number,
  paymentMethod: 'online' | 'cod' = 'online',
  warehouseId?: string
): Promise<DeliveryCalculationResult | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerLat,
        customerLng,
        cartTotal,
        paymentMethod,
        warehouseId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error calculating delivery charge:', error);
    return null;
  }
}

// Format delivery charge for display
export function formatDeliveryCharge(charge: number): string {
  if (charge === 0) {
    return 'FREE';
  }
  return `₹${charge.toFixed(2)}`;
}

// Get delivery time estimate (you can customize this based on your business logic)
export function getDeliveryTimeEstimate(distance: number): string {
  if (distance <= 2) {
    return '8-12 minutes';
  } else if (distance <= 5) {
    return '15-25 minutes';
  } else if (distance <= 10) {
    return '30-45 minutes';
  } else {
    return '1-2 hours';
  }
}

// Check if location is within delivery area (you can customize this)
export function isWithinDeliveryArea(distance: number, maxDeliveryRadius: number = 25): boolean {
  return distance <= maxDeliveryRadius;
}