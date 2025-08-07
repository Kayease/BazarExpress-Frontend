import { store } from './store';

/**
 * Debug utility to check current authentication state
 */
export const debugAuthState = () => {
  const state = store.getState();
  const reduxUser = state.auth.user;
  const reduxToken = state.auth.token;
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  console.log('=== AUTH DEBUG ===');
  console.log('Redux User:', reduxUser);
  console.log('Redux Token:', reduxToken ? `${reduxToken.substring(0, 20)}...` : null);
  console.log('Local Token:', localToken ? `${localToken.substring(0, 20)}...` : null);
  console.log('Tokens Match:', reduxToken === localToken);
  console.log('User Role:', reduxUser?.role);
  console.log('==================');

  return {
    hasUser: !!reduxUser,
    hasReduxToken: !!reduxToken,
    hasLocalToken: !!localToken,
    tokensMatch: reduxToken === localToken,
    userRole: reduxUser?.role
  };
};

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAuth = debugAuthState;
}