// Cart tracking utility for unregistered users

interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

interface UserInfo {
  name?: string;
  email?: string;
  phone?: string;
}

class CartTracker {
  private sessionId: string;
  private API_URL: string;

  constructor() {
    // Generate a unique session ID for this browser session
    this.sessionId = this.generateSessionId();
    this.API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private generateSessionId(): string {
    // Generate a unique session ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
  }

  // Track cart changes for unregistered users
  async trackCart(cartItems: CartItem[], userInfo: UserInfo = {}): Promise<boolean> {
    try {
      if (!this.API_URL) {
        console.error('API URL not configured');
        return false;
      }

      if (cartItems.length === 0) {
        // If cart is empty, we don't need to track
        return true;
      }

      // Merge phone/email from localStorage guest_info if present and not provided
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('guest_info');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!userInfo.phone && parsed?.phone) {
              userInfo.phone = parsed.phone;
            }
            if (!userInfo.email && parsed?.email) {
              userInfo.email = parsed.email;
            }
          }
        }
      } catch (e) {
        console.warn('Could not read guest_info from localStorage:', e);
      }

      // Do not send to backend if we have neither email nor phone
      if (!userInfo.email && !userInfo.phone) {
        console.log('Skipping guest cart tracking: missing contact info');
        return true; // treat as no-op
      }

      const response = await fetch(`${this.API_URL}/abandoned-carts/track-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          cartItems,
          userInfo
        }),
      });

      if (response.ok) {
        console.log('Cart tracked successfully for unregistered user');
        return true;
      } else {
        console.error('Failed to track cart:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error tracking cart:', error);
      return false;
    }
  }

  // Get the current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Track when items are added to cart
  async trackAddToCart(product: any, quantity: number = 1): Promise<boolean> {
    const cartItems = [{
      productId: product._id || product.id,
      productName: product.name,
      productImage: product.images && product.images.length > 0 ? product.images[0] : '',
      price: product.price,
      quantity
    }];

    return this.trackCart(cartItems);
  }

  // Track when cart is updated
  async trackCartUpdate(cartItems: CartItem[]): Promise<boolean> {
    return this.trackCart(cartItems);
  }

  // Track when cart is cleared
  async trackCartClear(): Promise<boolean> {
    return this.trackCart([]);
  }
}

// Create a singleton instance
const cartTracker = new CartTracker();

export default cartTracker;
