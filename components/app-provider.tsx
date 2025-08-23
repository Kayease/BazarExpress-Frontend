"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store, persistor, RootState } from "../lib/store";
import { PersistGate } from "redux-persist/integration/react";
import { logout as reduxLogout } from "../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { getCartItems, setCartItems as persistCartItems } from "../lib/cart";
import { getCartFromDB, addToCartDB, updateCartItemDB, removeFromCartDB, syncCartDB } from "../lib/api/cart";
import { getWishlistFromDB, addToWishlistDB, removeFromWishlistDB, syncWishlistDB } from "../lib/api/wishlist";
import { calculateProductTax, ProductTaxInfo } from "@/lib/tax-calculation";
import toast from "react-hot-toast";
import cartTracker from "../lib/cartTracker";
import { LocationProvider } from "@/components/location-provider";
import { ReactQueryProvider } from "@/lib/react-query";
import { migrateLocalStorageData, shouldRunMigration } from "@/lib/migration";
import { validateAuthState } from "@/lib/auth-utils";
import { fetchProfile } from "@/lib/slices/authSlice";

interface AppContextType {
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoggedIn: boolean;
  user: any;
  handleLogout: () => void;
  login: (user: any, token: string) => void;
  addToCart: (product: any) => void;
}

// --- Cart Context ---
interface CartContextType {
  cartItems: any[];
  setCartItems: (items: any[]) => void;
  addToCart: (product: any) => void;
  updateCartItem: (id: any, quantity: number, variantId?: string, showToast?: boolean) => void;
  removeCartItem: (id: any, variantId?: string) => void;
  isItemBeingRemoved: (id: any, variantId?: string) => boolean;
  isItemBeingAdded: (id: any, variantId?: string) => boolean;
  clearCart: () => void;
  cartTotal: number;
  isLoadingCart: boolean;
  moveToCartFromWishlist: (product: any, removeFromWishlistFn: (id: string, variantId?: string) => void) => void;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartContext must be used within a CartProvider');
  return context;
}

// --- Wishlist Context ---
interface WishlistContextType {
  wishlistItems: any[];
  addToWishlist: (product: any) => void;
  removeFromWishlist: (productId: string, variantId?: string) => void;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  isLoadingWishlist: boolean;
  moveToWishlistFromCart: (product: any, removeFromCartFn: (id: string, variantId?: string) => void) => void;
}
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlistContext must be used within a WishlistProvider');
  return context;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ModalProvider for global modal scroll lock
interface ModalContextType {
  modalCount: number;
  openModal: () => void;
  closeModal: () => void;
}
const ModalContext = createContext<ModalContextType | undefined>(undefined);

function ModalProvider({ children }: { children: ReactNode }) {
  const [modalCount, setModalCount] = useState(0);

  useEffect(() => {
    if (modalCount > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalCount]);

  const openModal = () => setModalCount((c) => c + 1);
  const closeModal = () => setModalCount((c) => Math.max(0, c - 1));

  return (
    <ModalContext.Provider value={{ modalCount, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// --- Cart Provider ---
function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!reduxUser;
  
  // Use ref to access current cart items without causing dependency issues
  const cartItemsRef = useRef<any[]>([]);
  
  // Update ref whenever cart items change
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Custom updater for cart items
  const updateCartItems = (items: any[]) => {
    persistCartItems(items);
    setCartItems(items);
  };

  // Load cart from database or local storage
  const loadCart = useCallback(async () => {
    if (isLoggedIn) {
      try {
        setIsLoadingCart(true);
        const response = await getCartFromDB();
        console.log('Raw cart response from DB:', response);
        
        const dbCartItems = response.cart.map((item: any) => {
          console.log('Processing cart item from DB:', {
            productId: item.productId._id,
            productName: item.productId.name,
            warehouse: item.productId.warehouse,
            quantity: item.quantity,
            variantName: item.variantName
          });
          
          const mappedItem = {
            id: item.productId._id,
            _id: item.productId._id,
            // Create composite cart item ID for variant handling
            cartItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id,
            ...item.productId,
            quantity: item.quantity,
            // Include variant information from cart item
            variantId: item.variantId,
            variantName: item.variantName,
            selectedVariant: item.selectedVariant
          };
          
          // Fallback: If warehouse info is missing from API response, try to preserve it from current cart
          if (!mappedItem.warehouse || !mappedItem.warehouse._id) {
            console.warn('Warehouse info missing for product:', mappedItem.name);
            const existingItem = cartItemsRef.current.find(cartItem => cartItem.id === mappedItem.id);
            if (existingItem && existingItem.warehouse) {
              console.log('Preserving warehouse info from existing cart item (load):', {
                productId: mappedItem.id,
                warehouse: existingItem.warehouse
              });
              mappedItem.warehouse = existingItem.warehouse;
            }
          } else {
            console.log('Warehouse info found for product:', {
              productName: mappedItem.name,
              warehouse: mappedItem.warehouse
            });
          }
          
          return mappedItem;
        });
        setCartItems(dbCartItems);
        // Don't persist to localStorage for logged-in users
      } catch (error: any) {
        console.error('Failed to load cart from database:', error);
        // If it's a 401 error, the user will be logged out automatically by the interceptor
        if (error.response?.status === 401) {
          console.log('Cart load failed due to authentication error - user will be logged out');
        } else if (error.message === 'No authentication token found') {
          console.log('Cart load skipped - no authentication token');
        }
        // For logged-in users, if DB fails, show empty cart instead of local storage
        setCartItems([]);
      } finally {
        setIsLoadingCart(false);
      }
    } else {
      updateCartItems(getCartItems());
    }
  }, [isLoggedIn]);

  // Sync local cart with database when user logs in
  const syncCartWithDB = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const localCart = getCartItems();
        const localCartCount = localCart.length;
        
        // Clear local cart immediately to prevent syncing with other accounts
        localStorage.removeItem('cart');
        
        if (localCartCount > 0) {
          const response = await syncCartDB(localCart);
          const syncedCartItems = response.cart.map((item: any) => ({
            id: item.productId._id,
            _id: item.productId._id,
            // Create composite cart item ID for variant handling
            cartItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id,
            ...item.productId,
            quantity: item.quantity,
            // Include variant information from cart item
            variantId: item.variantId,
            variantName: item.variantName,
            selectedVariant: item.selectedVariant
          }));
          setCartItems(syncedCartItems);
          
          // Handle partial sync with warehouse conflicts
          if (response.isPartialSync && response.conflictingItems && response.conflictingItems.length > 0) {
            const conflictCount = response.conflictingItems.length;
            const validCount = response.validItems ? response.validItems.length : 0;
            
            toast.error(
              `${validCount} item(s) synced successfully. ${conflictCount} item(s) could not be added due to warehouse conflicts.`,
              {
                duration: 8000,
                style: {
                  maxWidth: '500px',
                }
              }
            );
          } else {
            // Only show success toast if items were actually synced without conflicts
    //        toast.success(`${localCartCount} item(s) synced to your cart`);
          }
        } else {
          loadCart();
        }
      } catch (error) {
        console.error('Failed to sync cart:', error);
        // Only show error toast for sync failures
        toast.error('Failed to sync cart');
      }
    }
  }, [isLoggedIn, loadCart]);

  useEffect(() => {
    loadCart();
    const sync = () => {
      if (!isLoggedIn) {
        updateCartItems(getCartItems());
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [loadCart, isLoggedIn]);

  // Clear cart state when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      // Clear cart state for logged out users, they'll get data from localStorage
      const localCart = getCartItems();
      setCartItems(localCart);
    }
  }, [isLoggedIn]);

  // Sync cart when user logs in (only once per login session)
  useEffect(() => {
    if (isLoggedIn) {
      const hasCartSynced = sessionStorage.getItem('cartSynced');
      if (!hasCartSynced) {
        syncCartWithDB().then(() => {
          sessionStorage.setItem('cartSynced', 'true');
        });
      } else {
        loadCart();
      }
    } else {
      // Clear sync flag when user logs out
      sessionStorage.removeItem('cartSynced');
    }
  }, [isLoggedIn, syncCartWithDB, loadCart]);

  const addToCart = useCallback(async (product: any) => {
    const productId = product.id || product._id;
    const quantityToAdd = product.quantity || 1;

    // Create unique identifier for this add operation
    const addKey = product.variantId ? `${productId}_${product.variantId}` : productId;
    
    // Prevent multiple simultaneous additions of the same item
    if (addingItems.has(addKey)) {
      console.log('Item addition already in progress:', addKey);
      return;
    }

    // Validate variant selection for products with variants
    if (product.variants && product.variants.length > 0 && !product.variantId) {
      throw {
        isVariantRequired: true,
        message: 'Please select a variant before adding to cart',
        productName: product.name
      };
    }

    // Check if adding this product would create a warehouse conflict using new validation
    const existingWarehouse = cartItems.find(item => 
      item.warehouse && 
      item.warehouse._id
    )?.warehouse;

    if (existingWarehouse && product.warehouse) {
      // Block if trying to add from ANY different warehouse (custom or global)
      if (existingWarehouse._id !== product.warehouse._id) {
        throw {
          isWarehouseConflict: true,
          existingWarehouse: existingWarehouse.name,
          message: `Your cart has items from "${existingWarehouse.name}". Clear cart or choose products from the same warehouse.`
        };
      }
    }

    if (isLoggedIn) {
      try {
        // Mark item as being added
        setAddingItems(prev => new Set(prev).add(addKey));
        setIsLoadingCart(true);
        const response = await addToCartDB(productId, quantityToAdd, product.variantId, product.variantName, product.selectedVariant);
        
        const updatedCartItems = response.cart.map((item: any) => {
          // Get the warehouse info from either the response or the original product
          const warehouseInfo = 
            (item.productId.warehouse && typeof item.productId.warehouse === 'object')
              ? item.productId.warehouse // Use API response warehouse if it's an object
              : (product.warehouse && typeof product.warehouse === 'object')
                ? product.warehouse // Use original product warehouse if it's an object
                : null; // Fallback to null if neither is available
          
          const mappedItem = {
            id: item.productId._id,
            _id: item.productId._id,
            // Create composite cart item ID for variant handling
            cartItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id,
            ...item.productId,
            warehouse: warehouseInfo, // Set warehouse info from above
            quantity: item.quantity,
            // Include variant information from cart item
            variantId: item.variantId,
            variantName: item.variantName,
            selectedVariant: item.selectedVariant
          };
          
          // Double-check: If still no warehouse info, try to preserve from current cart
          if (!mappedItem.warehouse || !mappedItem.warehouse._id) {
            const existingItem = cartItemsRef.current.find(cartItem => 
              cartItem.id === mappedItem.id && cartItem.warehouse && cartItem.warehouse._id
            );
            if (existingItem && existingItem.warehouse) {
              console.log('Preserving warehouse info from existing cart item:', {
                productId: mappedItem.id,
                warehouse: existingItem.warehouse
              });
              mappedItem.warehouse = existingItem.warehouse;
            }
          }
          
          console.log('Mapped cart item:', {
            id: mappedItem.id,
            name: mappedItem.name,
            warehouse: mappedItem.warehouse,
            quantity: mappedItem.quantity
          });
          
          return mappedItem;
        });
        
        // Additional check: Verify warehouse information is preserved and complete
        const itemsWithInvalidWarehouse = updatedCartItems.filter(item => 
          !item.warehouse || 
          !item.warehouse._id || 
          !item.warehouse.name || 
          typeof item.warehouse !== 'object'
        );
        
        if (itemsWithInvalidWarehouse.length > 0) {
          console.warn('WARNING: Some cart items have invalid warehouse information:', {
            itemsWithInvalidWarehouse: itemsWithInvalidWarehouse.map(item => ({
              id: item.id,
              name: item.name,
              warehouse: item.warehouse
            }))
          });
        }
        
        setCartItems(updatedCartItems);
        // Don't persist to localStorage for logged-in users
        // No toast for regular add to cart operations
      } catch (error: any) {
        console.error('Failed to add to cart:', error);
        
        // Handle warehouse conflict errors
        if (error.isWarehouseConflict) {
          toast.error(
            `Your cart has items from "${error.existingWarehouse}". Please clear it or choose products from the same warehouse.`,
            {
              duration: 6000,
              style: {
                maxWidth: '500px',
              }
            }
          );
        } else {
          toast.error('Failed to add item to cart');
        }
      } finally {
        setIsLoadingCart(false);
        // Remove item from adding set
        setAddingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(addKey);
          return newSet;
        });
      }
    } else {
      // Local storage logic for non-logged-in users
      const items = getCartItems();
      
      // Find existing item with variant matching logic
      const existing = items.find((item: any) => {
        const isSameProduct = (item.id || item._id) === productId;
        
        // If both have variantId, they must match exactly
        if (item.variantId && product.variantId) {
          return isSameProduct && item.variantId === product.variantId;
        }
        
        // If neither has variantId, they match (same product, no variants)
        if (!item.variantId && !product.variantId) {
          return isSameProduct;
        }
        
        // If one has variantId and other doesn't, they don't match
        return false;
      });
      
      if (existing) {
        existing.quantity += quantityToAdd;
      } else {
        const newItem = { 
          ...product, 
          id: productId, 
          quantity: quantityToAdd,
          // Create composite cart item ID for variant handling
          cartItemId: product.variantId ? `${productId}_${product.variantId}` : productId
        };
        items.push(newItem);
      }
      updateCartItems(items);
      
      // Track cart for unregistered users
      try {
        const mappedItems = items.map(item => ({
          productId: item.id || item._id,
          productName: item.name,
          productImage: item.images && item.images.length > 0 ? item.images[0] : item.image || '',
          price: item.price,
          quantity: item.quantity
        }));
        await cartTracker.trackCartUpdate(mappedItems);
      } catch (error) {
        console.error('Failed to track cart for unregistered user:', error);
      }
      
      // No toast for regular add to cart operations
    }
  }, [isLoggedIn, cartItems, addingItems]);

  const updateCartItem = useCallback(async (id: any, quantity: number, variantId?: string, showToast: boolean = false) => {
    if (isLoggedIn) {
      try {
        setIsLoadingCart(true);
        const response = await updateCartItemDB(id, quantity, variantId);
        const updatedCartItems = response.cart.map((item: any) => {
          const mappedItem = {
            id: item.productId._id,
            _id: item.productId._id,
            // Create composite cart item ID for variant handling
            cartItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id,
            ...item.productId,
            quantity: item.quantity,
            // Include variant information from cart item
            variantId: item.variantId,
            variantName: item.variantName,
            selectedVariant: item.selectedVariant
          };
          
          // Fallback: If warehouse info is missing from API response, try to preserve it from current cart
          if (!mappedItem.warehouse || !mappedItem.warehouse._id) {
            const existingItem = cartItemsRef.current.find(cartItem => cartItem.id === mappedItem.id);
            if (existingItem && existingItem.warehouse) {
              console.log('Preserving warehouse info from existing cart item (update):', {
                productId: mappedItem.id,
                warehouse: existingItem.warehouse
              });
              mappedItem.warehouse = existingItem.warehouse;
            }
          }
          
          return mappedItem;
        });
        setCartItems(updatedCartItems);
        // Don't persist to localStorage for logged-in users
        // No toast for regular cart updates
      } catch (error) {
        console.error('Failed to update cart:', error);
        if (showToast) {
          toast.error('Failed to update cart');
        }
      } finally {
        setIsLoadingCart(false);
      }
    } else {
      // Local storage logic for non-logged-in users
      const items = getCartItems();
      
      // Find item with variant matching logic
      const item = items.find((item: any) => {
        const isSameProduct = (item.id || item._id) === id;
        
        // If both have variantId, they must match exactly
        if (item.variantId && variantId) {
          return isSameProduct && item.variantId === variantId;
        }
        
        // If neither has variantId, they match (same product, no variants)
        if (!item.variantId && !variantId) {
          return isSameProduct;
        }
        
        // If one has variantId and other doesn't, they don't match
        return false;
      });
      
      if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          // Filter with same variant matching logic
          const filteredItems = items.filter((filterItem: any) => {
            const isSameProduct = (filterItem.id || filterItem._id) === id;
            
            // If both have variantId, they must match exactly
            if (filterItem.variantId && variantId) {
              return !(isSameProduct && filterItem.variantId === variantId);
            }
            
            // If neither has variantId, they match (same product, no variants)
            if (!filterItem.variantId && !variantId) {
              return !isSameProduct;
            }
            
            // If one has variantId and other doesn't, they don't match (keep item)
            return true;
          });
          updateCartItems(filteredItems);
          
          // Track cart update for unregistered users
          try {
            const mappedItems = filteredItems.map(item => ({
              productId: item.id || item._id,
              productName: item.name,
              productImage: item.images && item.images.length > 0 ? item.images[0] : item.image || '',
              price: item.price,
              quantity: item.quantity
            }));
            await cartTracker.trackCartUpdate(mappedItems);
          } catch (error) {
            console.error('Failed to track cart update for unregistered user:', error);
          }
          return;
        }
        updateCartItems(items);
        
        // Track cart update for unregistered users
        try {
          const mappedItems = items.map(item => ({
            productId: item.id || item._id,
            productName: item.name,
            productImage: item.images && item.images.length > 0 ? item.images[0] : item.image || '',
            price: item.price,
            quantity: item.quantity
          }));
          await cartTracker.trackCartUpdate(mappedItems);
        } catch (error) {
          console.error('Failed to track cart update for unregistered user:', error);
        }
        
        // No toast for regular cart updates
      }
    }
  }, [isLoggedIn]);

  const removeCartItem = useCallback(async (id: any, variantId?: string) => {
    // Create unique identifier for this removal operation
    const removalKey = variantId ? `${id}_${variantId}` : id;
    
    // Prevent multiple simultaneous removals of the same item
    if (removingItems.has(removalKey)) {
      console.log('Item removal already in progress:', removalKey);
      return;
    }
    
    if (isLoggedIn) {
      try {
        // Mark item as being removed
        setRemovingItems(prev => new Set(prev).add(removalKey));
        setIsLoadingCart(true);
        
        const response = await removeFromCartDB(id, variantId);
        const updatedCartItems = response.cart.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          cartItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id,
          ...item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
          variantName: item.variantName,
          selectedVariant: item.selectedVariant
        }));
        setCartItems(updatedCartItems);
      } catch (error: any) {
        console.error('Failed to remove cart item:', error);
        
        // Handle 404 errors gracefully (item already removed)
        if (error.response?.status === 404) {
          console.log('Item already removed from cart, refreshing cart state');
          // Refresh cart to get current state
          try {
            const response = await getCartFromDB();
            const updatedCartItems = response.cart.map((item: any) => ({
              id: item.productId._id,
              _id: item.productId._id,
              cartItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id,
              ...item.productId,
              quantity: item.quantity,
              variantId: item.variantId,
              variantName: item.variantName,
              selectedVariant: item.selectedVariant
            }));
            setCartItems(updatedCartItems);
          } catch (refreshError) {
            console.error('Failed to refresh cart after 404:', refreshError);
            toast.error('Failed to refresh cart');
          }
        } else {
          toast.error('Failed to remove item from cart');
        }
      } finally {
        setIsLoadingCart(false);
        // Remove item from removing set
        setRemovingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(removalKey);
          return newSet;
        });
      }
    } else {
      // Local storage logic for non-logged-in users
      const items = getCartItems();
      const filteredItems = items.filter((item: any) => {
        const itemId = item.id || item._id;
        if (variantId) {
          return !(itemId === id && item.variantId === variantId);
        } else {
          return itemId !== id;
        }
      });
      updateCartItems(filteredItems);
    }
  }, [isLoggedIn, removingItems]);

  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try {
        setIsLoadingCart(true);
        // Get token from localStorage or redux state
        const token = localStorage.getItem('token');
        // Clear cart in database
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setCartItems([]);
      } catch (error) {
        console.error('Failed to clear cart:', error);
        toast.error('Failed to clear cart');
      } finally {
        setIsLoadingCart(false);
      }
    } else {
      // Clear local storage cart
      localStorage.removeItem('cart');
      setCartItems([]);
      
      // Track cart clear for unregistered users
      try {
        await cartTracker.trackCartClear();
      } catch (error) {
        console.error('Failed to track cart clear for unregistered user:', error);
      }
    }
  }, [isLoggedIn]);

  // Helper function to check if an item is being removed
  const isItemBeingRemoved = useCallback((id: any, variantId?: string) => {
    const removalKey = variantId ? `${id}_${variantId}` : id;
    return removingItems.has(removalKey);
  }, [removingItems]);

  // Helper function to check if an item is being added
  const isItemBeingAdded = useCallback((id: any, variantId?: string) => {
    const addKey = variantId ? `${id}_${variantId}` : id;
    return addingItems.has(addKey);
  }, [addingItems]);

  const cartTotal = useMemo(() => {
    const total = cartItems.reduce((sum: number, item: any) => {
      if (!item.tax || !item.tax.percentage) {
        // No tax, just return price * quantity
        return sum + (item.price || 0) * item.quantity;
      }

      // Calculate tax for this item
      const productTaxInfo: ProductTaxInfo = {
        price: item.price || 0,
        priceIncludesTax: item.priceIncludesTax || false,
        tax: {
          id: item.tax._id || item.tax.id,
          name: item.tax.name,
          percentage: item.tax.percentage,
          description: item.tax.description
        },
        quantity: item.quantity
      };

      const taxCalc = calculateProductTax(productTaxInfo, false); // Assuming intra-state for cart total
      return sum + taxCalc.totalPrice;
    }, 0);
    
    // Round up the total to avoid decimal payments
    return Math.ceil(total);
  }, [cartItems]);

  const moveToCartFromWishlist = useCallback(async (product: any, removeFromWishlistFn: (id: string, variantId?: string) => void) => {
    const productId = product.id || product._id;
    const variantId = product.variantId;
    
    // Check if product already exists in cart
    const existingCartItem = cartItems.find(cartItem => {
      const idMatch = (cartItem.id || cartItem._id) === productId;
      if (variantId) {
        return idMatch && cartItem.variantId === variantId;
      }
      return idMatch && !cartItem.variantId;
    });

    if (existingCartItem) {
      // If product exists in cart, increase quantity by 1
      const newQuantity = existingCartItem.quantity + 1;
      updateCartItem(productId, newQuantity, variantId);
      removeFromWishlistFn(productId, variantId);
    } else {
      // If product doesn't exist in cart, add it with quantity 1
      const cartItem = {
        ...product,
        id: productId,
        quantity: 1,
        warehouse: product.warehouse,
        // Preserve variant information
        variantId: product.variantId,
        variantName: product.variantName,
        selectedVariant: product.selectedVariant,
        // Ensure price is correct
        price: product.price || product.selectedVariant?.price,
        // Preserve unit information
        unit: product.unit
      };
      
      await addToCart(cartItem);
      removeFromWishlistFn(productId, variantId);
    }
  }, [cartItems, addToCart, updateCartItem]);

  const cartContextValue = useMemo(() => ({
    cartItems,
    setCartItems: updateCartItems,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    cartTotal,
    isLoadingCart,
    isItemBeingRemoved,
    isItemBeingAdded,
    moveToCartFromWishlist
  }), [cartItems, addToCart, updateCartItem, removeCartItem, clearCart, cartTotal, isLoadingCart, isItemBeingRemoved, isItemBeingAdded, moveToCartFromWishlist]);

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
}

// --- Wishlist Provider ---
function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!reduxUser;

  // Load wishlist from database or local storage
  const loadWishlist = useCallback(async () => {
    if (isLoggedIn) {
      try {
        setIsLoadingWishlist(true);
        const response = await getWishlistFromDB();
        const dbWishlistItems = response.wishlist.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId,
          // Include variant information from wishlist item
          variantId: item.variantId,
          variantName: item.variantName,
          selectedVariant: item.selectedVariant,
          // Create composite wishlist item ID for variant handling
          wishlistItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id
        }));
        setWishlistItems(dbWishlistItems);
        // Don't persist to localStorage for logged-in users
      } catch (error: any) {
        console.error('Failed to load wishlist from database:', error);
        // If it's a 401 error, the user will be logged out automatically by the interceptor
        if (error.response?.status === 401) {
          console.log('Wishlist load failed due to authentication error - user will be logged out');
        } else if (error.message === 'No authentication token found') {
          console.log('Wishlist load skipped - no authentication token');
        }
        // For logged-in users, if DB fails, show empty wishlist instead of local storage
        setWishlistItems([]);
      } finally {
        setIsLoadingWishlist(false);
      }
    } else {
      const savedWishlist = localStorage.getItem('wishlistItems');
      if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
    }
  }, [isLoggedIn]);

  // Sync local wishlist with database when user logs in
  const syncWishlistWithDB = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const localWishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
        const localWishlistCount = localWishlist.length;
        
        console.log('Syncing wishlist with DB:', {
          localWishlistCount,
          localWishlist: localWishlist.map((item: any) => ({
            id: item.id || item._id,
            name: item.name,
            variantId: item.variantId,
            variantName: item.variantName
          }))
        });
        
        // Clear local wishlist immediately to prevent syncing with other accounts
        localStorage.removeItem('wishlistItems');
        
        if (localWishlistCount > 0) {
          const response = await syncWishlistDB(localWishlist);
          console.log('Sync response:', {
            wishlistCount: response.wishlist.length,
            wishlist: response.wishlist.map((item: any) => ({
              productId: item.productId._id,
              productName: item.productId.name,
              variantId: item.variantId,
              variantName: item.variantName
            }))
          });
          
          const syncedWishlistItems = response.wishlist.map((item: any) => ({
            id: item.productId._id,
            _id: item.productId._id,
            ...item.productId,
            // Include variant information from wishlist item
            variantId: item.variantId,
            variantName: item.variantName,
            selectedVariant: item.selectedVariant,
            // Create composite wishlist item ID for variant handling
            wishlistItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id
          }));
          setWishlistItems(syncedWishlistItems);
          
          // Only show toast if items were actually synced
        //  toast.success(`${localWishlistCount} item(s) synced to your wishlist`);
        } else {
          loadWishlist();
        }
      } catch (error) {
        console.error('Failed to sync wishlist:', error);
        // Only show error toast for sync failures
        toast.error('Failed to sync wishlist');
      }
    }
  }, [isLoggedIn, loadWishlist]);

  useEffect(() => {
    loadWishlist();
    const sync = () => {
      if (!isLoggedIn) {
        const wishlist = localStorage.getItem('wishlistItems');
        if (wishlist) setWishlistItems(JSON.parse(wishlist));
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [loadWishlist, isLoggedIn]);

  // Clear wishlist state when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      // Clear wishlist state for logged out users, they'll get data from localStorage
      const localWishlist = localStorage.getItem('wishlistItems');
      if (localWishlist) {
        setWishlistItems(JSON.parse(localWishlist));
      } else {
        setWishlistItems([]);
      }
    }
  }, [isLoggedIn]);

  // Sync wishlist when user logs in (only once per login session)
  useEffect(() => {
    if (isLoggedIn) {
      const hasWishlistSynced = sessionStorage.getItem('wishlistSynced');
      if (!hasWishlistSynced) {
        syncWishlistWithDB().then(() => {
          sessionStorage.setItem('wishlistSynced', 'true');
        });
      } else {
        loadWishlist();
      }
    } else {
      // Clear sync flag when user logs out
      sessionStorage.removeItem('wishlistSynced');
    }
  }, [isLoggedIn, syncWishlistWithDB, loadWishlist]);

  const removeFromWishlist = useCallback(async (productId: string, variantId?: string) => {
    if (isLoggedIn) {
      try {
        const response = await removeFromWishlistDB(productId, variantId);
        const updatedWishlistItems = response.wishlist.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId,
          // Include variant information from wishlist item
          variantId: item.variantId,
          variantName: item.variantName,
          selectedVariant: item.selectedVariant,
          // Create composite wishlist item ID for variant handling
          wishlistItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id
        }));
        setWishlistItems(updatedWishlistItems);
        // Don't persist to localStorage for logged-in users
        // No toast for regular remove from wishlist operations
      } catch (error) {
        console.error('Failed to remove from wishlist:', error);
        toast.error('Failed to remove item from wishlist');
      }
    } else {
      // Local storage logic for non-logged-in users
      const newWishlist = wishlistItems.filter((item: any) => {
        const isSameProduct = (item.id === productId || item._id === productId);
        
        // If variantId is provided, match both product and variant
        if (variantId) {
          return !(isSameProduct && item.variantId === variantId);
        }
        
        // If no variantId provided, remove items without variants only
        return !(isSameProduct && !item.variantId);
      });
      setWishlistItems(newWishlist);
      localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
      // No toast for regular remove from wishlist operations
    }
  }, [wishlistItems, isLoggedIn]);

  const addToWishlist = useCallback(async (product: any) => {
    const productId = product.id || product._id;
    const variantId = product.variantId;
    const variantName = product.variantName;
    const selectedVariant = product.selectedVariant;

    // Check if item is already in wishlist
    const isAlreadyInWishlist = wishlistItems.some((item: any) => {
      const isSameProduct = (item.id === productId || item._id === productId);
      
      // If variantId is provided, match both product and variant
      if (variantId) {
        return isSameProduct && item.variantId === variantId;
      }
      
      // If no variantId provided, check for items without variants only
      return isSameProduct && !item.variantId;
    });

    // If already in wishlist, remove it (toggle functionality)
    if (isAlreadyInWishlist) {
      // Instead of calling removeFromWishlist directly, handle removal logic here
      if (isLoggedIn) {
        try {
          const response = await removeFromWishlistDB(productId, variantId);
          const updatedWishlistItems = response.wishlist.map((item: any) => ({
            id: item.productId._id,
            _id: item.productId._id,
            ...item.productId,
            variantId: item.variantId,
            variantName: item.variantName,
            selectedVariant: item.selectedVariant,
            wishlistItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id
          }));
          setWishlistItems(updatedWishlistItems);
        } catch (error) {
          console.error('Failed to remove from wishlist:', error);
          toast.error('Failed to remove item from wishlist');
        }
      } else {
        // Local storage removal logic
        const newWishlist = wishlistItems.filter((item: any) => {
          const isSameProduct = (item.id === productId || item._id === productId);
          
          if (variantId) {
            return !(isSameProduct && item.variantId === variantId);
          }
          
          return !(isSameProduct && !item.variantId);
        });
        setWishlistItems(newWishlist);
        localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
      }
      return;
    }

    if (isLoggedIn) {
      try {
        const response = await addToWishlistDB(productId, variantId, variantName, selectedVariant);
        const updatedWishlistItems = response.wishlist.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId,
          // Include variant information from wishlist item
          variantId: item.variantId,
          variantName: item.variantName,
          selectedVariant: item.selectedVariant,
          // Create composite wishlist item ID for variant handling
          wishlistItemId: item.variantId ? `${item.productId._id}_${item.variantId}` : item.productId._id
        }));
        setWishlistItems(updatedWishlistItems);
        // Don't persist to localStorage for logged-in users
        // No toast for regular add to wishlist operations
      } catch (error) {
        console.error('Failed to add to wishlist:', error);
        toast.error('Failed to add item to wishlist');
      }
    } else {
      // Local storage logic for non-logged-in users
      // Find existing item with variant matching logic
      const existing = wishlistItems.find((item: any) => {
        const isSameProduct = (item.id || item._id) === productId;
        
        // If both have variantId, they must match exactly
        if (item.variantId && variantId) {
          return isSameProduct && item.variantId === variantId;
        }
        
        // If neither has variantId, they match (same product, no variants)
        if (!item.variantId && !variantId) {
          return isSameProduct;
        }
        
        // If one has variantId and other doesn't, they don't match
        return false;
      });
      
      if (!existing) {
        // Create wishlist item without quantity information
        const newWishlistItem = { 
          ...product, 
          id: productId,
          // Remove quantity from wishlist item
          quantity: undefined,
          // Create composite wishlist item ID for variant handling
          wishlistItemId: variantId ? `${productId}_${variantId}` : productId
        };
        const newWishlist = [...wishlistItems, newWishlistItem];
        setWishlistItems(newWishlist);
        localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
        // No toast for regular add to wishlist operations
      }
    }
  }, [wishlistItems, isLoggedIn]);

  const isInWishlist = useCallback((productId: string, variantId?: string) => {
    return wishlistItems.some((item: any) => {
      const isSameProduct = (item.id === productId || item._id === productId);
      
      // If variantId is provided, match both product and variant
      if (variantId) {
        return isSameProduct && item.variantId === variantId;
      }
      
      // If no variantId provided, check for items without variants only
      return isSameProduct && !item.variantId;
    });
  }, [wishlistItems]);

  const moveToWishlistFromCart = useCallback(async (product: any, removeFromCartFn: (id: string, variantId?: string) => void) => {
    const productId = product.id || product._id;
    const variantId = product.variantId;
    
    // Check if item is already in wishlist
    const isAlreadyInWishlist = isInWishlist(productId, variantId);
    
    if (isAlreadyInWishlist) {
      // If already in wishlist, just remove from cart
      removeFromCartFn(productId, variantId);
      return;
    }
    
    // Add to wishlist first
    await addToWishlist(product);
    
    // Then remove from cart
    removeFromCartFn(productId, variantId);
  }, [addToWishlist, isInWishlist]);

  const wishlistContextValue = useMemo(() => ({
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isLoadingWishlist,
    moveToWishlistFromCart
  }), [wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, isLoadingWishlist, moveToWishlistFromCart]);

  return (
    <WishlistContext.Provider value={wishlistContextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

function AppProviderInner({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!reduxUser;
  const dispatch = useDispatch<typeof store.dispatch>();
  const router = useRouter();

  // Run migration and auth validation on app start
  useEffect(() => {
    if (shouldRunMigration()) {
      migrateLocalStorageData();
    }
    
    // Validate auth state consistency
    validateAuthState();
    
    // Auto-load user profile if token exists but no user data
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !reduxUser) {
      console.log('Token found but no user data - fetching profile');
      dispatch(fetchProfile());
    }
    
    // Load debug utilities in development
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/debug-cart-wishlist');
      import('@/lib/debug-auth');
    }
  }, [dispatch, reduxUser]);





  const handleLogin = useCallback((user: any, token: string) => {
    // Store token and user data
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    
    // Clear guest info when user logs in
    localStorage.removeItem('guest_info');
    localStorage.removeItem('guest_modal_shown');
    
    // Update Redux state (you might need to dispatch a login action)
    // For now, we'll just reload the page to trigger auth state update
    window.location.reload();
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(reduxLogout());
    // Clear any stored tokens
    localStorage.removeItem("token");
    // Clear sync flags
    sessionStorage.removeItem('cartSynced');
    sessionStorage.removeItem('wishlistSynced');
    // Clear cart and wishlist data to prevent it from syncing with next user
    localStorage.removeItem('cart');
    localStorage.removeItem('wishlistItems');
    // Navigate to home page using Next.js router
    router.push("/");
  }, [dispatch, router]);

  return (
    <ModalProvider>
      <LocationProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContextWithCart
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              isLoginOpen={isLoginOpen}
              setIsLoginOpen={setIsLoginOpen}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isLoggedIn={isLoggedIn}
              user={reduxUser}
              handleLogout={handleLogout}
              login={handleLogin}
            >
              {children}
            </AppContextWithCart>
          </WishlistProvider>
        </CartProvider>
      </LocationProvider>
    </ModalProvider>
  );
}

// Component that bridges CartContext and AppContext
function AppContextWithCart({
  children,
  isCartOpen,
  setIsCartOpen,
  isLoginOpen,
  setIsLoginOpen,
  searchQuery,
  setSearchQuery,
  isLoggedIn,
  user,
  handleLogout,
  login
}: {
  children: ReactNode;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoggedIn: boolean;
  user: any;
  handleLogout: () => void;
  login: (user: any, token: string) => void;
}) {
  const { addToCart } = useCartContext();

  return (
    <AppContext.Provider
      value={useMemo(() => ({
        isCartOpen,
        setIsCartOpen,
        isLoginOpen,
        setIsLoginOpen,
        searchQuery,
        setSearchQuery,
        isLoggedIn,
        user,
        handleLogout,
        login,
        addToCart,
      }), [isCartOpen, setIsCartOpen, isLoginOpen, setIsLoginOpen, searchQuery, setSearchQuery, isLoggedIn, user, handleLogout, login, addToCart])}
    >
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ReactQueryProvider>
          <AppProviderInner>{children}</AppProviderInner>
        </ReactQueryProvider>
      </PersistGate>
    </Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
} 