const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface SearchGapTrackingData {
  searchTerm: string;
  userId?: string;
  pincode?: string;
  guestId?: string;
}

/**
 * Generate or retrieve guest ID for anonymous users
 */
function getGuestId(): string {
  const GUEST_ID_KEY = 'bazarxpress_guest_id';
  
  // Try to get existing guest ID from localStorage
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  
  if (!guestId) {
    // Generate new guest ID: timestamp + random string
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  
  return guestId;
}

/**
 * Track search gap when no products are found for a search term
 */
export async function trackSearchGap(data: SearchGapTrackingData): Promise<void> {
  try {
    // If no userId provided, use guest ID
    const trackingData = {
      ...data,
      guestId: data.userId ? undefined : getGuestId()
    };
    
    await fetch(`${API_BASE_URL}/search-gaps/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });
  } catch (error) {
    // Silently fail - we don't want search gap tracking to affect user experience
    console.warn('Failed to track search gap:', error);
  }
}

/**
 * Check if search results are empty and track if needed
 */
export function shouldTrackSearchGap(searchTerm: string, products: any[]): boolean {
  return searchTerm.trim() !== '' && products.length === 0;
}