"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store, persistor, RootState } from "../lib/store";
import { PersistGate } from "redux-persist/integration/react";
import { logout as reduxLogout } from "../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { getCartItems, setCartItems as persistCartItems } from "../lib/cart";
import toast from "react-hot-toast";
import { LocationProvider } from "@/components/location-provider";
import { ReactQueryProvider } from "@/lib/react-query";

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
}

// --- Cart Context ---
interface CartContextType {
  cartItems: any[];
  setCartItems: (items: any[]) => void;
  addToCart: (product: any) => void;
  updateCartItem: (id: any, quantity: number, showToast?: boolean) => void;
  cartTotal: number;
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

  // Custom updater for cart items
  const updateCartItems = (items: any[]) => {
    persistCartItems(items);
    setCartItems(items);
  };

  useEffect(() => {
    updateCartItems(getCartItems());
    const sync = () => updateCartItems(getCartItems());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const addToCart = useCallback((product: any) => {
    const items = getCartItems();
    const productId = product.id || product._id;
    const existing = items.find((item: any) => (item.id || item._id) === productId);
    const quantityToAdd = product.quantity || 1;
    if (existing) {
      existing.quantity += quantityToAdd;
    } else {
      items.push({ ...product, id: productId, quantity: quantityToAdd });
    }
    updateCartItems(items);
  }, []);

  const updateCartItem = useCallback((id: any, quantity: number, showToast: boolean = true) => {
    const items = getCartItems();
    const item = items.find((item: any) => (item.id || item._id) === id);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        updateCartItems(items.filter((item: any) => (item.id || item._id) !== id));
        return;
      }
      updateCartItems(items);
    }
  }, []);

  const cartTotal = useMemo(() => 
    cartItems.reduce((sum: number, item: any) => sum + (item.price || 0) * item.quantity, 0),
    [cartItems]
  );

  const cartContextValue = useMemo(() => ({
    cartItems,
    setCartItems: updateCartItems,
    addToCart,
    updateCartItem,
    cartTotal
  }), [cartItems, addToCart, updateCartItem, cartTotal]);

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
}

// --- Wishlist Provider ---
function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlistItems');
    if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
    const sync = () => {
      const wishlist = localStorage.getItem('wishlistItems');
      if (wishlist) setWishlistItems(JSON.parse(wishlist));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const addToWishlist = useCallback((product: any) => {
    const id = product.id || product._id;
    const existing = wishlistItems.find((item: any) => item.id === id);
    if (!existing) {
      const newWishlist = [...wishlistItems, { ...product, id }];
      setWishlistItems(newWishlist);
      localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
    }
  }, [wishlistItems]);

  const removeFromWishlist = useCallback((productId: string) => {
    const newWishlist = wishlistItems.filter((item: any) => item.id !== productId && item._id !== productId);
    setWishlistItems(newWishlist);
    localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
  }, [wishlistItems]);

  const isInWishlist = useCallback((productId: string) => 
    wishlistItems.some((item: any) => item.id === productId || item._id === productId),
    [wishlistItems]
  );

  const wishlistContextValue = useMemo(() => ({
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  }), [wishlistItems, addToWishlist, removeFromWishlist, isInWishlist]);

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



  const handleLogout = useCallback(() => {
    dispatch(reduxLogout());
    // Clear any stored tokens
    localStorage.removeItem("token");
    // Navigate to home page using Next.js router
    router.push("/");
  }, [dispatch, router]);

  return (
    <ModalProvider>
      <LocationProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContext.Provider
              value={useMemo(() => ({
                isCartOpen,
                setIsCartOpen,
                isLoginOpen,
                setIsLoginOpen,
                searchQuery,
                setSearchQuery,
                isLoggedIn,
                user: reduxUser,
                handleLogout,
              }), [isCartOpen, setIsCartOpen, isLoginOpen, setIsLoginOpen, searchQuery, setSearchQuery, isLoggedIn, reduxUser, handleLogout])}
            >
              {children}
            </AppContext.Provider>
          </WishlistProvider>
        </CartProvider>
      </LocationProvider>
    </ModalProvider>
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