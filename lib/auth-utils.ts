import { store } from './store';
import { logout } from './slices/authSlice';

/**
 * Validates if the current token is still valid by checking localStorage and Redux state
 */
export const validateAuthState = (): boolean => {
  const state = store.getState();
  const reduxUser = state.auth.user;
  const reduxToken = state.auth.token;
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // If Redux thinks user is logged in but no token exists, clear the state
  if (reduxUser && !localToken) {
    console.warn('User state exists but no token found - clearing auth state');
    store.dispatch(logout());
    return false;
  }

  // If tokens don't match, clear the state
  if (reduxToken !== localToken) {
    console.warn('Token mismatch between Redux and localStorage - clearing auth state');
    store.dispatch(logout());
    return false;
  }

  return !!(reduxUser && localToken);
};

/**
 * Handles authentication errors by clearing invalid tokens and user state
 */
export const handleAuthError = (error: any): void => {
  if (error.response?.status === 401) {
    console.log('Authentication error detected - clearing auth state');
    
    // Clear localStorage token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('cartSynced');
      sessionStorage.removeItem('wishlistSynced');
    }
    
    // Clear Redux state
    store.dispatch(logout());
  }
};

/**
 * Gets a valid token if available, returns null if user is not properly authenticated
 */
export const getValidToken = (): string | null => {
  const state = store.getState();
  const reduxUser = state.auth.user;
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Only return token if user is logged in and token exists
  if (reduxUser && localToken) {
    return localToken;
  }
  
  return null;
};

/**
 * Gets token directly from localStorage without validation (for less strict scenarios)
 */
export const getToken = (): string | null => {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
};