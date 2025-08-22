"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  User,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Gift,
  HelpCircle,
  Shield,
  LayoutDashboard,
  LogOut as LogOutIcon,
  Heart,
  ChevronUp,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import { useAppContext, useCartContext, useWishlistContext } from "@/components/app-provider";
import { useAppSelector, useAppDispatch } from "../lib/store";
import { logout } from "../lib/slices/authSlice";
import toast from "react-hot-toast";
import SearchBar from "@/components/search-bar";
import CartDrawer from "@/components/cart-drawer";
import { usePathname, useRouter } from "next/navigation";
import { useLocation } from "@/components/location-provider";

export default function Navbar() {
  const {
    setIsLoginOpen,
    searchQuery,
    setSearchQuery,
    handleLogout
  } = useAppContext();
  const { cartItems, cartTotal } = useCartContext();
  const { isCartOpen, setIsCartOpen } = useAppContext();
  const { wishlistItems } = useWishlistContext();

  const user = useAppSelector((state) => state.auth.user);
  const isLoggedIn = !!user;
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  
  // Get location context
  const { locationState, deliveryMessage, isGlobalMode, showLocationModal, setShowLocationModal, isLoading } = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [wishlistAnimation, setWishlistAnimation] = useState(false);
  const [currentSearchPlaceholder, setCurrentSearchPlaceholder] = useState(0);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const searchPlaceholders = [
    "Search \"milk\"",
    "Search \"bread\"",
    "Search \"sugar\"",
    "Search \"butter\"",
    "Search \"paneer\"",
    "Search \"chocolate\"",
    "Search \"curd\"",
    "Search \"rice\"",
    "Search \"egg\"",
    "Search \"chips\""
  ];

  // Rotate search placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSearchPlaceholder((prev) =>
        (prev + 1) % searchPlaceholders.length
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search function
  const performSearch = useCallback((query: string, isImmediate = false) => {
    if (!query.trim()) return;
    
    // Build URL with location context
    let url = `/search?q=${encodeURIComponent(query.trim())}`;
    
    // Add pincode parameter if location is detected
    if (locationState.isLocationDetected && locationState.pincode) {
      url += `&pincode=${locationState.pincode}`;
    }
    
    // Add delivery mode for proper warehouse filtering
    if (isGlobalMode) {
      url += `&mode=global`;
    }
    
    // Add typing indicator - false means search is complete
    url += `&typing=false`;
    
    router.push(url);
  }, [locationState, isGlobalMode, router]);

  // Handle search input changes with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Only trigger search if we're on search page
    if (pathname === '/search') {
      if (value.trim()) {
        // Show typing indicator immediately when user types
        let url = `/search?q=${encodeURIComponent(value.trim())}`;
        if (locationState.isLocationDetected && locationState.pincode) {
          url += `&pincode=${locationState.pincode}`;
        }
        if (isGlobalMode) {
          url += `&mode=global`;
        }
        url += `&typing=true`;
        
        // Update URL immediately for typing indicator
        window.history.replaceState({}, '', url);
        
        // Set new timeout for actual search after stopping typing
        const newTimeout = setTimeout(() => {
          performSearch(value, false); // This will set typing=false and trigger actual search
        }, 800); // Reduced delay for better responsiveness
        
        setTypingTimeout(newTimeout);
      } else {
        // If search is cleared, clear the timeout and navigate to clean search page
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          setTypingTimeout(null);
        }
        
        let url = `/search`;
        if (locationState.isLocationDetected && locationState.pincode) {
          url += `?pincode=${locationState.pincode}`;
        }
        if (isGlobalMode) {
          url += locationState.isLocationDetected && locationState.pincode ? `&mode=global` : `?mode=global`;
        }
        window.history.replaceState({}, '', url);
      }
    }
  }, [typingTimeout, pathname, performSearch, locationState, isGlobalMode]);



  // Remove duplicate location detection - now handled by LocationProvider

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAccountDropdown &&
        !(event.target as HTMLElement).closest(".account-dropdown")
      ) {
        setShowAccountDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAccountDropdown]);

  // Calculate cart item count
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Trigger animations when cart or wishlist items change
  useEffect(() => {
    if (cartItemCount > 0) {
      setCartAnimation(true);
      const timer = setTimeout(() => setCartAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartItemCount]);

  useEffect(() => {
    if (wishlistItems.length > 0) {
      setWishlistAnimation(true);
      const timer = setTimeout(() => setWishlistAnimation(false), 1300);
      return () => clearTimeout(timer);
    }
  }, [wishlistItems.length]);

  // All location logic now handled by LocationProvider

  const handleLogoutRedux = () => {
    dispatch(logout());
    toast.success("Logged Out, Successfully!");
  };

  return (
    <>
      {/* Blinkit-like Header */}
      <header className="bg-white shadow-sm sticky top-0 z-[150] border-b border-gray-100">
        <div className="max-w-7.5xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo and Location */}
            <div className="flex items-center space-x-5">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                  <Image
                    src="/logo.svg"
                    alt="BazarXpress"
                    width={100}
                    height={40}
                    priority
                    style={{ height: 'auto' }}
                    className="mt-5"
                  />
                </Link>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

              {/* Location Selector */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="flex flex-col text-left"
                >
                  <div className="text-md font-extrabold text-green-600">
                    {locationState.isLocationDetected ? 
                      deliveryMessage : 
                      isLoading ? 
                        "Detecting location..." : 
                        "Select location"
                    }
                  </div>
                  <div className="flex items-center text-xs text-gray-500 max-w-[200px] truncate">
                    <span className="truncate">
                      {locationState.isLocationDetected ? 
                        `PIN: ${locationState.pincode}` : 
                        isLoading ? 
                          "Please wait..." : 
                          "Click to set"
                      }
                    </span>
                    <ChevronDown size={14} className="ml-1 flex-shrink-0" />
                  </div>
                </button>
              </div>
            </div>

            {/* Center - Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
              <div className="relative w-full h-12"> {/* Set fixed height */}
                <div className="flex items-center w-full h-full px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-text">
                  <div className="mr-2">
                    <Search size={18} className="text-gray-400" />
                  </div>

                  {/* Placeholder Animation - Hide on input OR focus */}
                  {searchValue === '' && !isFocused && (
                    <div className="relative h-6 overflow-hidden flex-1 pointer-events-none">
                      <div className="animate-slide-vertical">
                        {searchPlaceholders.map((placeholder, index) => (
                          <div key={index} className="h-6 text-gray-400">
                            {placeholder}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Field on top */}
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    // If on search page and has value, show typing indicator when focused
                    if (pathname === '/search' && searchValue.trim()) {
                      let url = `/search?q=${encodeURIComponent(searchValue.trim())}`;
                      if (locationState.isLocationDetected && locationState.pincode) {
                        url += `&pincode=${locationState.pincode}`;
                      }
                      if (isGlobalMode) {
                        url += `&mode=global`;
                      }
                      url += `&typing=true`;
                      window.history.replaceState({}, '', url);
                    }
                  }}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchValue.trim()) {
                      // Clear any pending timeout for immediate search
                      if (typingTimeout) {
                        clearTimeout(typingTimeout);
                        setTypingTimeout(null);
                      }
                      performSearch(searchValue.trim(), true);
                    }
                  }}
                  className="absolute inset-0 w-full h-full bg-transparent border-none outline-none px-12 text-sm text-gray-900"
                />
              </div>
            </div>
            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Mobile Buttons */}
              <div className="flex md:hidden items-center space-x-2">
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                  aria-label="Location"
                >
                  <MapPin size={24} />
                </button>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                  aria-label="Search"
                >
                  <Search size={24} />
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

              {/* Desktop Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                {/* Login Button */}
                {!isLoggedIn ? (
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="font-medium">Login</span>
                  </button>
                ) : (
                  <div className="relative account-dropdown">
                    <button
                      onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                      className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span className="font-medium">{user?.name?.split(' ')[0] || "Account"}</span>
                      {showAccountDropdown ? (
                        <ChevronUp size={14} className="ml-1 transition-transform" />
                      ) : (
                        <ChevronDown size={14} className="ml-1 transition-transform" />
                      )}
                  </button>

                  {/* Account Dropdown */}
                  {showAccountDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-4">
                          <div className="flex items-center space-x-3 mb-4 pb-2 border-b border-gray-100">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User size={18} className="text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user?.name || "User"}
                            </p>
                              <p className="text-xs text-gray-500">
                              {user?.email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                            <Link
                            href="/account"
                            onClick={() => setShowAccountDropdown(false)}
                            className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <User size={16} />
                            <span>My Account</span>
                            </Link>
                            <Link
                            href="/addresses"
                            onClick={() => setShowAccountDropdown(false)}
                            className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <MapPin size={16} />
                            <span>Saved Addresses</span>
                            </Link>
                            <Link
                            href="/account?tab=orders"
                            onClick={() => setShowAccountDropdown(false)}
                            className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <ShoppingCart size={16} />
                            <span>My Orders</span>
                            </Link>
                          {user?.role && ['admin', 'product_inventory_management', 'order_warehouse_management', 'marketing_content_manager', 'customer_support_executive', 'report_finance_analyst', 'delivery_boy'].includes(user.role) && (
                              <Link
                              href="/admin"
                              className="flex items-center space-x-3 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold"
                            >
                              <LayoutDashboard
                                size={16}
                                className="text-indigo-500"
                              />
                              <span>Admin Panel</span>
                              </Link>
                          )}
                          <button
                            onClick={() => {
                              handleLogoutRedux();
                              setShowAccountDropdown(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <LogOutIcon size={16} className="text-red-500" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Wishlist Button */}
                <Link
                  href="/wishlist"
                  className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Heart
                    size={20}
                    className={`${wishlistItems.length > 0
                      ? "text-red-500 fill-red-500"
                      : ""
                  } ${wishlistAnimation ? "animate-heart-beat" : ""}`}
                />
                {wishlistItems.length > 0 && (
                  <span
                      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium ${wishlistAnimation ? "animate-counter-pop" : ""
                    }`}
                  >
                    {wishlistItems.length}
                  </span>
                )}
                </Link>

                {/* Cart Button */}
              <button
                  onClick={() => setIsCartOpen(true)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    cartItemCount > 0
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                <ShoppingCart
                    size={20}
                    className={`mr-2 ${cartAnimation ? "animate-cart-shake" : ""}`}
                  />
                {cartItemCount > 0 ? (
                  <span className={`font-medium ${cartAnimation ? "animate-counter-pop" : ""}`}>
                    {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} ₹{Math.round(cartTotal)}
                  </span>
                ) : (
                  <span className="font-medium">My Cart</span>
                )}
                </button>
                </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-3 space-y-3">
              {/* Login/Account */}
              {!isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsLoginOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition duration-200"
                >
                  <User size={18} />
                  <span className="font-medium">Login</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{user?.name || "User"}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  {/* Admin Panel - First if user is admin */}
                  {user?.role && ['admin', 'product_inventory_management', 'order_warehouse_management', 'marketing_content_manager', 'customer_support_executive', 'report_finance_analyst', 'delivery_boy'].includes(user.role) && (
                    <Link
                      href="/admin"
                      className="w-full flex items-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className="mr-3" />
                      <span className="font-medium">Admin Panel</span>
                    </Link>
                  )}

                  {/* My Account */}
                  <Link
                    href="/account"
                    className="w-full flex items-center p-3 bg-white border border-gray-200 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={18} className="mr-3" />
                    <span className="font-medium">My Account</span>
                  </Link>
                  
                  {/* Saved Addresses */}
                  <Link
                    href="/addresses"
                    className="w-full flex items-center p-3 bg-white border border-gray-200 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <MapPin size={18} className="mr-3" />
                    <span className="font-medium">Saved Addresses</span>
                  </Link>

                  {/* Wishlist */}
                  <Link
                    href="/wishlist"
                    className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Heart size={18} className={wishlistItems.length > 0 ? "text-red-500 fill-red-500 mr-3" : "mr-3"} />
                      <span className="font-medium">Wishlist</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {wishlistItems.length} items
                    </div>
                  </Link>

                  {/* Cart */}
                  <button
                    onClick={() => {
                      setIsCartOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <ShoppingCart size={18} className={cartItemCount > 0 ? "text-green-600 mr-3" : "mr-3"} />
                      <span className="font-medium">
                        {cartItemCount > 0 ? `${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}` : 'My Cart'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {cartItemCount > 0 ? `₹${Math.round(cartTotal)}` : '0 items'}
                    </div>
                  </button>

                  {/* My Orders */}
                  <Link
                    href="/account?tab=orders"
                    className="w-full flex items-center p-3 bg-white border border-gray-200 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ShoppingCart size={18} className="mr-3" />
                    <span className="font-medium">My Orders</span>
                  </Link>

                  {/* Log Out - Last */}
                  <button
                    onClick={() => {
                      handleLogoutRedux();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center p-3 bg-red-50 border border-red-100 rounded-lg text-red-600"
                  >
                    <LogOutIcon size={18} className="mr-3" />
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              )}

              <div className="border-t border-gray-100 my-2"></div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 z-50 md:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center">
              <ShoppingCart size={20} className="mr-3" />
              <span className="font-medium">
                {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
              </span>
              <span className="ml-2 text-sm opacity-90">
                ₹{Math.round(cartTotal)}
              </span>
            </div>
            <span className="font-medium bg-white text-green-600 px-4 py-2 rounded">
              View Cart
            </span>
          </button>
        </div>
      )}

      {/* Cart Drawer rendered globally */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />



      {/* Mobile Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-black/20 z-[200] md:hidden"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="fixed top-0 left-0 right-0 bg-white shadow-lg transition-transform duration-300 ease-out transform translate-y-0"
            style={{
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <style jsx>{`
              @keyframes slideDown {
                from {
                  transform: translateY(-100%);
                }
                to {
                  transform: translateY(0);
                }
              }
            `}</style>
            <div 
              className="relative p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center">
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-500" />
                </button>
                <div className="flex-1">
                  <SearchBar
                    onSearch={(query) => {
                      // Build URL with location context for pincode-based filtering
                      let url = `/search?q=${encodeURIComponent(query)}`;
                      
                      // Add pincode parameter if location is detected
                      if (locationState.isLocationDetected && locationState.pincode) {
                        url += `&pincode=${locationState.pincode}`;
                      }
                      
                      // Add delivery mode for proper warehouse filtering
                      if (isGlobalMode) {
                        url += `&mode=global`;
                      }
                      
                      router.push(url);
                      setShowSearchModal(false);
                    }}
                  />
                </div>
              </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Popular Searches</h3>
                  <div className="flex flex-wrap gap-2">
                  {searchPlaceholders.map((placeholder, index) => (
                      <button
                      key={index}
                        onClick={() => {
                        const query = placeholder.replace('Search "', '').replace('"', '');
                        
                        // Build URL with location context for pincode-based filtering
                        let url = `/search?q=${encodeURIComponent(query)}`;
                        
                        // Add pincode parameter if location is detected
                        if (locationState.isLocationDetected && locationState.pincode) {
                          url += `&pincode=${locationState.pincode}`;
                        }
                        
                        // Add delivery mode for proper warehouse filtering
                        if (isGlobalMode) {
                          url += `&mode=global`;
                        }
                        
                        router.push(url);
                        setShowSearchModal(false);
                      }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                      {placeholder.replace('Search "', '').replace('"', '')}
                      </button>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
