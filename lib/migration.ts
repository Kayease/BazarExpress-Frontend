// Migration utilities for cart and wishlist data

export const migrateLocalStorageData = () => {
  if (typeof window === 'undefined') return;

  try {
    // Check if we need to migrate old cart data
    const oldCart = localStorage.getItem('cart');
    const newCart = localStorage.getItem('cart'); // This is already the new format
    
    // Check if we need to migrate old wishlist data
    const oldWishlist = localStorage.getItem('wishlist');
    const newWishlist = localStorage.getItem('wishlistItems');

    // Migrate wishlist if old format exists and new format doesn't
    if (oldWishlist && !newWishlist) {
      try {
        const parsedOldWishlist = JSON.parse(oldWishlist);
        localStorage.setItem('wishlistItems', JSON.stringify(parsedOldWishlist));
        console.log('Migrated wishlist data from old format');
      } catch (error) {
        console.error('Failed to migrate wishlist data:', error);
      }
    }

    // Mark migration as complete
    localStorage.setItem('migrationComplete', 'true');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

export const shouldRunMigration = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem('migrationComplete');
};

// Clean up old data after successful migration
export const cleanupOldData = () => {
  if (typeof window === 'undefined') return;

  try {
    // Remove old wishlist key if it exists and new one exists
    const oldWishlist = localStorage.getItem('wishlist');
    const newWishlist = localStorage.getItem('wishlistItems');
    
    if (oldWishlist && newWishlist) {
      localStorage.removeItem('wishlist');
      console.log('Cleaned up old wishlist data');
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
};