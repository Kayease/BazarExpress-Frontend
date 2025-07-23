"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store, persistor, RootState } from "../lib/store";
import { PersistGate } from "redux-persist/integration/react";
import { logout as reduxLogout } from "../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { getCartItems, setCartItems as persistCartItems } from "../lib/cart";
import toast from "react-hot-toast";

interface AppContextType {
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  cartItems: any[];
  setCartItems: (items: any[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoggedIn: boolean;
  user: any;
  addToCart: (product: any) => void;
  updateCartItem: (id: any, quantity: number, showToast?: boolean) => void;
  cartTotal: number;
  handleLogout: () => void;
  wishlistItems: any[];
  addToWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderInner({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [cartItems, setCartItemsState] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!reduxUser;
  const dispatch = useDispatch();
  const router = useRouter();

  // Load cart and wishlist from localStorage on mount
  useEffect(() => {
    setCartItemsState(getCartItems());
    const savedWishlist = localStorage.getItem('wishlistItems');
    if (savedWishlist) {
      setWishlistItems(JSON.parse(savedWishlist));
    }
    
    const sync = () => {
      setCartItemsState(getCartItems());
      const wishlist = localStorage.getItem('wishlistItems');
      if (wishlist) {
        setWishlistItems(JSON.parse(wishlist));
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Always update localStorage and state
  const setCartItems = (items: any[]) => {
    persistCartItems(items);
    setCartItemsState(items);
  };

  const addToCart = (product: any) => {
    const items = getCartItems();
    const existing = items.find((item) => item.id === product.id);
    const quantityToAdd = product.quantity || 1;
    
    if (existing) {
      existing.quantity += quantityToAdd;
      toast.success(`Updated ${product.name} quantity in cart!`, {
        duration: 3000,
        position: 'top-right',
        icon: '🛒',
      });
    } else {
      items.push({ ...product, quantity: quantityToAdd });
      toast.success(`${product.name} added to cart!`, {
        duration: 3000,
        position: 'top-right',
        icon: '🛒',
      });
    }
    setCartItems(items);
  };

  const updateCartItem = (id: any, quantity: number, showToast: boolean = true) => {
    const items = getCartItems();
    const item = items.find((item) => item.id === id);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        setCartItems(items.filter((item) => item.id !== id));
        if (showToast) {
          toast.success('Item removed from cart', {
            icon: '🗑️',
            duration: 2000,
          });
        }
        return;
      }
      setCartItems(items);
    }
  };

  const addToWishlist = (product: any) => {
    const existing = wishlistItems.find((item) => item.id === product.id);
    if (!existing) {
      const newWishlist = [...wishlistItems, product];
      setWishlistItems(newWishlist);
      localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
      toast.success(`${product.name} added to wishlist!`, {
        duration: 3000,
        position: 'top-right',
        icon: '❤️',
      });
    } else {
      toast.error(`${product.name} is already in your wishlist!`, {
        duration: 3000,
        position: 'top-right',
        icon: '⚠️',
      });
    }
  };

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlistItems.filter((item) => item.id !== productId);
    setWishlistItems(newWishlist);
    localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
    toast.success('Removed from wishlist!', {
      duration: 3000,
      position: 'top-right',
      icon: '💔',
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const handleLogout = () => {
    dispatch(reduxLogout());
    // Clear any stored tokens
    localStorage.removeItem("token");
    // Navigate to home page using Next.js router
    router.push("/");
  };

  return (
    <AppContext.Provider
      value={{
        isCartOpen,
        setIsCartOpen,
        isLoginOpen,
        setIsLoginOpen,
        cartItems,
        setCartItems,
        searchQuery,
        setSearchQuery,
        isLoggedIn,
        user: reduxUser,
        addToCart,
        updateCartItem,
        cartTotal,
        handleLogout,
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppProviderInner>{children}</AppProviderInner>
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