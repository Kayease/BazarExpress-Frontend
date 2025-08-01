"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store, persistor, RootState } from "../lib/store";
import { PersistGate } from "redux-persist/integration/react";
import { logout as reduxLogout } from "../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { getCartItems, setCartItems as persistCartItems } from "../lib/cart";
import { getCartFromDB, addToCartDB, updateCartItemDB, removeFromCartDB, syncCartDB } from "../lib/api/cart";
import { getWishlistFromDB, addToWishlistDB, removeFromWishlistDB, syncWishlistDB } from "../lib/api/wishlist";
import toast from "react-hot-toast";
import { LocationProvider } from "@/components/location-provider";
import { ReactQueryProvider } from "@/lib/react-query";
import { migrateLocalStorageData, shouldRunMigration } from "@/lib/migration";

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
  addToCart: (product: any) => void;
}

// --- Cart Context ---
interface CartContextType {
  cartItems: any[];
  setCartItems: (items: any[]) => void;
  addToCart: (product: any) => void;
  updateCartItem: (id: any, quantity: number, showToast?: boolean) => void;
  clearCart: () => void;
  cartTotal: number;
  isLoadingCart: boolean;
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
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isLoadingWishlist: boolean;
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
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!reduxUser;

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
        const dbCartItems = response.cart.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId,
          quantity: item.quantity
        }));
        setCartItems(dbCartItems);
        // Don't persist to localStorage for logged-in users
      } catch (error) {
        console.error('Failed to load cart from database:', error);
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
            ...item.productId,
            quantity: item.quantity
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
            toast.success(`${localCartCount} item(s) synced to your cart`);
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

    if (isLoggedIn) {
      try {
        const response = await addToCartDB(productId, quantityToAdd);
        const updatedCartItems = response.cart.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId,
          quantity: item.quantity
        }));
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
      }
    } else {
      // Local storage logic for non-logged-in users
      const items = getCartItems();
      const existing = items.find((item: any) => (item.id || item._id) === productId);
      if (existing) {
        existing.quantity += quantityToAdd;
      } else {
        items.push({ ...product, id: productId, quantity: quantityToAdd });
      }
      updateCartItems(items);
      // No toast for regular add to cart operations
    }
  }, [isLoggedIn]);

  const updateCartItem = useCallback(async (id: any, quantity: number, showToast: boolean = false) => {
    if (isLoggedIn) {
      try {
        const response = await updateCartItemDB(id, quantity);
        const updatedCartItems = response.cart.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId,
          quantity: item.quantity
        }));
        setCartItems(updatedCartItems);
        // Don't persist to localStorage for logged-in users
        // No toast for regular cart updates
      } catch (error) {
        console.error('Failed to update cart:', error);
        if (showToast) {
          toast.error('Failed to update cart');
        }
      }
    } else {
      // Local storage logic for non-logged-in users
      const items = getCartItems();
      const item = items.find((item: any) => (item.id || item._id) === id);
      if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          updateCartItems(items.filter((item: any) => (item.id || item._id) !== id));
          return;
        }
        updateCartItems(items);
        // No toast for regular cart updates
      }
    }
  }, [isLoggedIn]);

  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try {
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
      }
    } else {
      // Clear local storage cart
      localStorage.removeItem('cart');
      setCartItems([]);
    }
  }, [isLoggedIn]);

  const cartTotal = useMemo(() => 
    cartItems.reduce((sum: number, item: any) => sum + (item.price || 0) * item.quantity, 0),
    [cartItems]
  );

  const cartContextValue = useMemo(() => ({
    cartItems,
    setCartItems: updateCartItems,
    addToCart,
    updateCartItem,
    clearCart,
    cartTotal,
    isLoadingCart
  }), [cartItems, addToCart, updateCartItem, clearCart, cartTotal, isLoadingCart]);

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
          ...item.productId
        }));
        setWishlistItems(dbWishlistItems);
        // Don't persist to localStorage for logged-in users
      } catch (error) {
        console.error('Failed to load wishlist from database:', error);
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
        
        // Clear local wishlist immediately to prevent syncing with other accounts
        localStorage.removeItem('wishlistItems');
        
        if (localWishlistCount > 0) {
          const response = await syncWishlistDB(localWishlist);
          const syncedWishlistItems = response.wishlist.map((item: any) => ({
            id: item.productId._id,
            _id: item.productId._id,
            ...item.productId
          }));
          setWishlistItems(syncedWishlistItems);
          
          // Only show toast if items were actually synced
          toast.success(`${localWishlistCount} item(s) synced to your wishlist`);
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

  const addToWishlist = useCallback(async (product: any) => {
    const productId = product.id || product._id;

    if (isLoggedIn) {
      try {
        const response = await addToWishlistDB(productId);
        const updatedWishlistItems = response.wishlist.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId
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
      const existing = wishlistItems.find((item: any) => (item.id || item._id) === productId);
      if (!existing) {
        const newWishlist = [...wishlistItems, { ...product, id: productId }];
        setWishlistItems(newWishlist);
        localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
        // No toast for regular add to wishlist operations
      }
    }
  }, [wishlistItems, isLoggedIn]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (isLoggedIn) {
      try {
        const response = await removeFromWishlistDB(productId);
        const updatedWishlistItems = response.wishlist.map((item: any) => ({
          id: item.productId._id,
          _id: item.productId._id,
          ...item.productId
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
      const newWishlist = wishlistItems.filter((item: any) => item.id !== productId && item._id !== productId);
      setWishlistItems(newWishlist);
      localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
      // No toast for regular remove from wishlist operations
    }
  }, [wishlistItems, isLoggedIn]);

  const isInWishlist = useCallback((productId: string) => 
    wishlistItems.some((item: any) => item.id === productId || item._id === productId),
    [wishlistItems]
  );

  const wishlistContextValue = useMemo(() => ({
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isLoadingWishlist
  }), [wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, isLoadingWishlist]);

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
  const dispatch = useDispatch();
  const router = useRouter();

  // Run migration on app start
  useEffect(() => {
    if (shouldRunMigration()) {
      migrateLocalStorageData();
    }
    
    // Load debug utilities in development
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/debug-cart-wishlist');
    }
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
  handleLogout
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
        addToCart,
      }), [isCartOpen, setIsCartOpen, isLoginOpen, setIsLoginOpen, searchQuery, setSearchQuery, isLoggedIn, user, handleLogout, addToCart])}
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