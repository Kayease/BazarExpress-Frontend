import { Middleware } from '@reduxjs/toolkit';
import AbandonedCartTracker from '../abandonedCartTracker';

const abandonedCartMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Handle cart-related actions
  if (action.type?.startsWith('cart/')) {
    const state = store.getState();
    const cartItems = state.cart?.items || [];
    
    // Get user from auth state if available
    const user = state.auth?.user || null;
    const sessionId = user ? '' : AbandonedCartTracker.getSessionId();

    const tracker = AbandonedCartTracker.getInstance();

    switch (action.type) {
      case 'cart/addToCart':
      case 'cart/updateCartQuantity':
        // Update tracking when cart changes
        tracker.updateTracking(cartItems, user, sessionId);
        break;
        
      case 'cart/removeFromCart':
        // Update tracking when items are removed
        tracker.updateTracking(cartItems, user, sessionId);
        break;
        
      case 'cart/clearCart':
        // Stop tracking when cart is cleared (usually after purchase)
        tracker.stopTracking(user, sessionId);
        break;
        
      case 'cart/updateCartTracking':
        // Manual tracking update (can be called when user logs in/out)
        const { user: trackingUser, sessionId: trackingSessionId } = action.payload || {};
        tracker.updateTracking(cartItems, trackingUser || user, trackingSessionId || sessionId);
        break;
    }
  }

  // Handle auth-related actions
  if (action.type === 'auth/login' || action.type === 'auth/logout') {
    const state = store.getState();
    const cartItems = state.cart?.items || [];
    const user = action.type === 'auth/login' ? action.payload : null;
    const sessionId = user ? '' : AbandonedCartTracker.getSessionId();

    const tracker = AbandonedCartTracker.getInstance();
    
    if (cartItems.length > 0) {
      // Update tracking with new user state
      tracker.updateTracking(cartItems, user, sessionId);
    }
  }

  return result;
};

export default abandonedCartMiddleware;