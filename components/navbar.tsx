"use client";

import { useState, useEffect } from "react";
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
import LocationModal from "@/components/location-modal";
import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/components/app-provider";
import { useAppSelector, useAppDispatch } from "../lib/store";
import { logout } from "../lib/slices/authSlice";
import toast from "react-hot-toast";
import SearchBar from "@/components/search-bar";
import CartDrawer from "@/components/cart-drawer";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const {
    setIsLoginOpen,
    cartItems,
    searchQuery,
    setSearchQuery,
    handleLogout,
    isCartOpen,
    setIsCartOpen,
    wishlistItems,
    cartTotal,
  } = useAppContext();

  const user = useAppSelector((state) => state.auth.user);
  const isLoggedIn = !!user;
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    name: "Detecting location...",
    address: "",
    deliveryTime: "8 minutes",
  });
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [wishlistAnimation, setWishlistAnimation] = useState(false);
  const [currentSearchPlaceholder, setCurrentSearchPlaceholder] = useState(0);

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

  // Fetch location on website load
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setCurrentLocation(JSON.parse(savedLocation));
    } else {
      // Auto-detect location on first load
      handleDetectLocation();
      
      // Show location prompt if not already shown
      const locationPromptShown = localStorage.getItem("locationPromptShown");
      if (!locationPromptShown) {
        setShowLocationPrompt(true);
        localStorage.setItem("locationPromptShown", "true");
      }
    }
  }, []);

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

  const handleLocationSelect = (location: any) => {
    const newLocation = {
      ...location,
      timestamp: Date.now(),
    };
    setCurrentLocation(location);
    localStorage.setItem("userLocation", JSON.stringify(newLocation));
    setShowLocationPrompt(false);
  };

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

  // Function to detect user's current location
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      // Use Google Maps Geocoding API to get address from coordinates
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        const locationName = data.results[0].address_components[0].long_name;

        const newLocation = {
          name: locationName,
          address: address,
          deliveryTime: "8 minutes", // Default delivery time
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        };

        handleLocationSelect(newLocation);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      // Fallback to default location
      handleLocationSelect({
        name: "New Delhi",
        address: "124, Sachivalaya Vihar, Kalyanpuri, New Delhi",
        deliveryTime: "8 minutes",
      });
    } finally {
      setIsDetecting(false);
      setShowLocationPrompt(false);
    }
  };

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
                    src="/logo.png"
                    alt="BazarXpress"
                    width={100}
                    height={60}
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
                  <div className="text-md
                   font-extrabold text-gray-900">
                    Delivery in {currentLocation.deliveryTime}
                    </div>
                  <div className="flex items-center text-xs text-gray-500 max-w-[200px] truncate">
                    <span className="truncate">{currentLocation.address}</span>
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
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchValue.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
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
                            className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <User size={16} />
                            <span>My Account</span>
                            </Link>
                            <Link
                            href="/orders"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <ShoppingCart size={16} />
                            <span>My Orders</span>
                            </Link>
                          {user?.role === "admin" && (
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
                            onClick={handleLogoutRedux}
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
                  <span className="font-medium">My Cart</span>
                {cartItemCount > 0 && (
                  <span
                      className={`ml-1 ${cartAnimation ? "animate-counter-pop" : ""}`}
                  >
                      {`(${cartItemCount})`}
                  </span>
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
                  {user?.role === "admin" && (
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
                      <span className="font-medium">My Cart</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {cartItemCount} items
                    </div>
                  </button>

                  {/* My Orders */}
                  <Link
                    href="/orders"
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

      {/* Cart Drawer rendered globally */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={currentLocation?.address || ""}
      />

      {/* Mobile Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200] md:hidden"
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
                      router.push(`/search?q=${encodeURIComponent(query)}`);
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
                        router.push(`/search?q=${encodeURIComponent(query)}`);
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
