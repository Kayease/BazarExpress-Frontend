import { CartItem } from './slices/cartSlice';

interface UserInfo {
  name?: string;
  email?: string;
  phone?: string;
}

class AbandonedCartTracker {
  private static instance: AbandonedCartTracker;
  private trackingTimeout: NodeJS.Timeout | null = null;
  private readonly TRACKING_DELAY = 30 * 60 * 1000; // 30 minutes in milliseconds
  private lastCartState: CartItem[] = [];
  private isTracking = false;

  private constructor() {}

  static getInstance(): AbandonedCartTracker {
    if (!AbandonedCartTracker.instance) {
      AbandonedCartTracker.instance = new AbandonedCartTracker();
    }
    return AbandonedCartTracker.instance;
  }

  /**
   * Start tracking cart abandonment
   * @param cartItems Current cart items
   * @param user User information (null for unregistered users)
   * @param sessionId Session ID for unregistered users
   */
  startTracking(cartItems: CartItem[], user: any = null, sessionId: string = '') {
    // Clear existing timeout
    if (this.trackingTimeout) {
      clearTimeout(this.trackingTimeout);
      this.trackingTimeout = null;
    }

    // Don't track if cart is empty
    if (!cartItems || cartItems.length === 0) {
      this.isTracking = false;
      return;
    }

    // Store current cart state
    this.lastCartState = [...cartItems];
    this.isTracking = true;

    // Set timeout to track abandonment
    this.trackingTimeout = setTimeout(() => {
      this.trackAbandonedCart(cartItems, user, sessionId);
    }, this.TRACKING_DELAY);
  }

  /**
   * Stop tracking (called when user completes purchase or clears cart)
   * @param user User information
   * @param sessionId Session ID for unregistered users
   */
  stopTracking(user: any = null, sessionId: string = '') {
    if (this.trackingTimeout) {
      clearTimeout(this.trackingTimeout);
      this.trackingTimeout = null;
    }

    // Mark cart as recovered if it was being tracked
    if (this.isTracking && this.lastCartState.length > 0) {
      this.markCartAsRecovered(user, sessionId);
    }

    // For unregistered users, also clear the abandoned cart entry
    if (!user && sessionId) {
      this.clearUnregisteredCart(sessionId);
    }

    this.isTracking = false;
    this.lastCartState = [];
  }

  /**
   * Update tracking with new cart state
   * @param cartItems Updated cart items
   * @param user User information
   * @param sessionId Session ID for unregistered users
   */
  updateTracking(cartItems: CartItem[], user: any = null, sessionId: string = '') {
    // If cart becomes empty, stop tracking
    if (!cartItems || cartItems.length === 0) {
      this.stopTracking(user, sessionId);
      return;
    }

    // If cart items changed, restart tracking
    if (this.hasCartChanged(cartItems)) {
      this.startTracking(cartItems, user, sessionId);
    }
  }

  /**
   * Check if cart has changed significantly
   */
  private hasCartChanged(newCartItems: CartItem[]): boolean {
    if (this.lastCartState.length !== newCartItems.length) {
      return true;
    }

    // Check if items or quantities changed
    for (const newItem of newCartItems) {
      const oldItem = this.lastCartState.find(item => item.id === newItem.id);
      if (!oldItem || oldItem.quantity !== newItem.quantity) {
        return true;
      }
    }

    return false;
  }

  /**
   * Track abandoned cart by sending to backend
   */
  private async trackAbandonedCart(cartItems: CartItem[], user: any, sessionId: string) {
    try {
      const isRegistered = !!user;
      
      const payload = {
        userId: isRegistered ? user.id : null,
        sessionId: !isRegistered ? sessionId : null,
        userInfo: {
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            addedAt: new Date().toISOString()
          }))
        }
      };

      const response = await fetch('/api/abandoned-carts/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Abandoned cart tracked successfully');
      } else {
        console.error('Failed to track abandoned cart:', response.statusText);
      }
    } catch (error) {
      console.error('Error tracking abandoned cart:', error);
    }
  }

  /**
   * Mark cart as recovered
   */
  private async markCartAsRecovered(user: any, sessionId: string) {
    try {
      const payload = {
        userId: user?.id || null,
        sessionId: !user ? sessionId : null
      };

      const response = await fetch('/api/abandoned-carts/recover', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Cart marked as recovered');
      } else {
        console.error('Failed to mark cart as recovered:', response.statusText);
      }
    } catch (error) {
      console.error('Error marking cart as recovered:', error);
    }
  }

  /**
   * Clear unregistered cart entry from backend
   */
  private async clearUnregisteredCart(sessionId: string) {
    try {
      const response = await fetch('/api/abandoned-carts/clear-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        console.log('Unregistered cart cleared successfully');
      } else {
        console.error('Failed to clear unregistered cart:', response.statusText);
      }
    } catch (error) {
      console.error('Error clearing unregistered cart:', error);
    }
  }

  /**
   * Generate session ID for unregistered users
   */
  static generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Get or create session ID for unregistered users
   */
  static getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = AbandonedCartTracker.generateSessionId();
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }
}

export default AbandonedCartTracker;