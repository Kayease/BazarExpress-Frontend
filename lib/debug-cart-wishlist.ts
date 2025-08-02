// Debug utilities for cart and wishlist

export const debugCartWishlist = () => {
  if (typeof window === 'undefined') return;

  console.group('🛒 Cart & Wishlist Debug Info');
  
  // Local Storage Data
  console.group('📦 Local Storage Data');
  const cart = localStorage.getItem('cart');
  const wishlistItems = localStorage.getItem('wishlistItems');
  const wishlist = localStorage.getItem('wishlist'); // Old format
  
  console.log('Cart:', cart ? JSON.parse(cart) : 'Empty');
  console.log('Wishlist (new):', wishlistItems ? JSON.parse(wishlistItems) : 'Empty');
  console.log('Wishlist (old):', wishlist ? JSON.parse(wishlist) : 'Not found');
  console.groupEnd();

  // Session Storage Data
  console.group('🔄 Session Storage (Sync Flags)');
  console.log('Cart Synced:', sessionStorage.getItem('cartSynced'));
  console.log('Wishlist Synced:', sessionStorage.getItem('wishlistSynced'));
  console.groupEnd();

  // Migration Status
  console.group('🔧 Migration Status');
  console.log('Migration Complete:', localStorage.getItem('migrationComplete'));
  console.groupEnd();

  // Auth Status
  console.group('🔐 Authentication');
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'None');
  console.groupEnd();

  console.groupEnd();
};

export const clearAllCartWishlistData = () => {
  if (typeof window === 'undefined') return;

  const confirmed = confirm('Are you sure you want to clear all cart and wishlist data? This action cannot be undone.');
  
  if (confirmed) {
    // Clear local storage
    localStorage.removeItem('cart');
    localStorage.removeItem('wishlistItems');
    localStorage.removeItem('wishlist');
    localStorage.removeItem('migrationComplete');
    
    // Clear session storage
    sessionStorage.removeItem('cartSynced');
    sessionStorage.removeItem('wishlistSynced');
    
    console.log('✅ All cart and wishlist data cleared');
    
    // Reload page to reset state
    window.location.reload();
  }
};

export const exportCartWishlistData = () => {
  if (typeof window === 'undefined') return;

  const data = {
    cart: localStorage.getItem('cart'),
    wishlistItems: localStorage.getItem('wishlistItems'),
    wishlist: localStorage.getItem('wishlist'),
    migrationComplete: localStorage.getItem('migrationComplete'),
    cartSynced: sessionStorage.getItem('cartSynced'),
    wishlistSynced: sessionStorage.getItem('wishlistSynced'),
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cart-wishlist-data-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✅ Cart and wishlist data exported');
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugCartWishlist = debugCartWishlist;
  (window as any).clearAllCartWishlistData = clearAllCartWishlistData;
  (window as any).exportCartWishlistData = exportCartWishlistData;
}