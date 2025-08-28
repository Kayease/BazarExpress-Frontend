"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, LogIn, Plus, Minus, Trash2, Heart, ShoppingCart, MapPin, Home, Briefcase, Hotel, MapPinOff, Edit, ChevronRight } from "lucide-react";
import { getCartItems, updateCartQuantity, removeFromCart, getCartTotals } from "../lib/cart";
import { useAppContext, useCartContext, useWishlistContext } from "@/components/app-provider";
import { useAppSelector } from "@/lib/store";
import { getValidToken } from "@/lib/auth-utils";
import Image from "next/image";
import toast from "react-hot-toast";
import AddressModal from "./AddressModal";

interface Address {
  id: number;
  type: "Office" | "Home" | "Hotel" | "Other";
  building: string;
  floor?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone?: string;
  name: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
  addressLabel?: string;
  additionalInstructions?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isLoggedIn, setIsLoginOpen } = useAppContext();
  const { cartItems, updateCartItem, removeCartItem, cartTotal } = useCartContext();
  const { addToWishlist, isInWishlist, moveToWishlistFromCart } = useWishlistContext();
  const router = useRouter();
  const user = useAppSelector((state: any) => state?.auth?.user);

  // Address selection states
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const fetchUserAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);
      
      // Get the authentication token
      const token = getValidToken();
      if (!token) {
        console.warn('No valid token found, cannot fetch addresses');
        setAddresses([]);
        return;
      }

      // Set token as cookie for API route
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=strict`;

      const response = await fetch(`/api/user/addresses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }

      const data = await response.json();
      if (Array.isArray(data.addresses)) {
        const validAddresses = data.addresses.filter((address: any) =>
          address &&
          address.id &&
          (address.building || address.area) &&
          address.city &&
          address.state &&
          address.pincode
        );
        setAddresses(validAddresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  // Add effect to prevent body scrolling when cart is open
  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on the body
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling on the body
      document.body.style.overflow = '';
    }
    
    // Cleanup function to ensure scrolling is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Prevent background scroll when address modal is open
  useEffect(() => {
    if (showAddressModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddressModal]);

  // Load delivery settings on mount
  // Auto-close cart drawer when it becomes empty (with a small delay)
  useEffect(() => {
    if (isOpen && cartItems.length === 0) {
      const timer = setTimeout(() => {
        onClose();
        //toast.success('Cart is now empty', { icon: '🛒' });
      }, 1500); // 1.5 second delay to show empty state briefly
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, cartItems.length, onClose]);

  // Fetch user addresses when cart opens or when user logs in
  useEffect(() => {
    if (isOpen && isLoggedIn && addresses.length === 0) {
      fetchUserAddresses();
    }
  }, [isOpen, isLoggedIn, addresses.length, fetchUserAddresses]);

  // Fetch addresses immediately when user logs in (even if cart was already open)
  useEffect(() => {
    if (isLoggedIn && addresses.length === 0) {
      fetchUserAddresses();
    }
  }, [isLoggedIn, addresses.length, fetchUserAddresses]);

  // Set default address when addresses are loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find(addr => addr.isDefault);
      setSelectedAddress(defaultAddr || addresses[0]);
    }
  }, [addresses, selectedAddress]);

  const handleUpdate = (id: string, quantity: number, variantId?: string) => {
    updateCartItem(id, quantity, variantId);
  };

  const handleRemove = (id: string, variantId?: string) => {
    if (removeCartItem) {
      removeCartItem(id, variantId);
    } else {
      updateCartItem(id, 0, variantId);
    }
  };

  const moveToWishlist = async (item: any) => {
    // Check if item is already in wishlist
    if (isInWishlist(item.id, item.variantId)) {
      // If already in wishlist, just remove from cart
      if (removeCartItem) {
        removeCartItem(item.id, item.variantId);
      } else {
        updateCartItem(item.id, 0, item.variantId, false);
      }
      toast.success('Item removed from cart', { icon: '🛒', duration: 2000 });
      return;
    }

    // Pass variant information when adding to wishlist
    const wishlistItem = {
      ...item,
      variantId: item.variantId,
      variantName: item.variantName,
      selectedVariant: item.selectedVariant
    };
    
    try {
      // Use the new moveToWishlistFromCart function
      await moveToWishlistFromCart(wishlistItem, (id: string, variantId?: string) => {
        if (removeCartItem) {
          removeCartItem(id, variantId);
        } else {
          updateCartItem(id, 0, variantId, false);
        }
      });
      toast.success('Moved to wishlist!', { icon: '❤️', duration: 2000 });
    } catch (error) {
      console.error('Error moving item to wishlist:', error);
      toast.error('Failed to move item to wishlist');
    }
  };

  const handleProceed = () => {
    // Check if cart is empty
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Add some items first!');
      onClose();
      return;
    }

    // Check if user is logged in (this should always be true now since button is only shown when logged in)
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      onClose();
      return;
    }

    // Check if address is selected
    if (!selectedAddress) {
      toast.error('Please select a delivery address first!');
      return;
    }

    // Pass the selected address ID to the payment page
    router.push(`/payment?addressId=${selectedAddress.id}`);
    onClose();
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'Home':
        return <Home className="h-4 w-4 text-yellow-500" />;
      case 'Office':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'Hotel':
        return <Hotel className="h-4 w-4 text-brand-primary" />;
      default:
        return <MapPinOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatAddress = (address: Address) => {
    const parts = [
      address.name,
      address.building,
      address.area,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Add new address
  const handleAddAddress = async (newAddress: Omit<Address, 'id'>) => {
    try {
      setIsAddingAddress(true);

      // Get the authentication token
      const token = getValidToken();
      if (!token) {
        throw new Error('No valid token found');
      }

      // Set token as cookie for API route
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=strict`;

      const response = await fetch(`/api/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAddress),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }

      const data = await response.json();
      if (data.address) {
        await fetchUserAddresses();
        if (newAddress.isDefault) {
          setSelectedAddress(data.address.id);
        }
        setShowAddressModal(false);
        toast.success('Address added successfully!');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMsg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
      toast.error(`Failed to add address: ${errorMsg}`);
      throw error;
    } finally {
      setIsAddingAddress(false);
    }
  };


  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 z-[151] backdrop-blur-sm" onClick={onClose} />}
      
      {/* Address Selection Sidebar */}
      {showAddressSelection && (
        <div className="fixed inset-0 bg-black/20 z-[153] backdrop-blur-sm" onClick={() => setShowAddressSelection(false)} />
      )}
      
      <div className={`fixed top-0 right-0 h-full w-full max-w-xs sm:max-w-sm bg-white transform transition-all duration-300 ease-out z-[152] ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
              <p className="text-xs text-gray-600">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors" 
            aria-label="Close cart"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Cart Items - Scrollable Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6 max-w-xs">Add items to your cart to see them here</p>
              <button 
                onClick={() => {
                  router.push('/products');
                  onClose();
                }}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cartItems.map((item, idx) => (
                <div key={item.cartItemId || `${item.id}_${item.variantId || 'no-variant'}` || idx} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <div className="flex">
                    {/* Product Image */}
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image 
                        src={item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 ml-3 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                            {item.name}
                          </h4>
                          {item.variantName && (
                            <p className="text-xs text-purple-600 font-medium mt-0.5">
                              Variant: {item.variantName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {item.brand && typeof item.brand === "object" && item.brand !== null 
                              ? item.brand.name || item.brandId || 'Unknown Brand'
                              : item.brand || item.brandId || 'Unknown Brand'}
                            {" • "}
                            {item.category && typeof item.category === "object" && item.category !== null 
                              ? item.category.name || item.categoryId || 'Unknown Category'
                              : item.category || item.categoryId || 'Unknown Category'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <button 
                            onClick={() => moveToWishlist(item)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors mr-1"
                            title={isInWishlist(item.id, item.variantId) ? "Remove from cart (already in wishlist)" : "Move to wishlist"}
                          >
                            <Heart className={`h-4 w-4 ${isInWishlist(item.id, item.variantId) ? 'fill-current' : ''}`} />
                          </button>
                          <button 
                            onClick={() => handleRemove(item.id, item.variantId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove from cart"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-auto flex justify-between items-end pt-2">
                        <div>
                          <div className="text-sm font-bold text-purple-600">₹{(item.price * item.quantity).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">₹{item.price} each</div>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button 
                            onClick={() => handleUpdate(item.id, item.quantity - 1, item.variantId)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1 bg-white text-gray-700 font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleUpdate(item.id, item.quantity + 1, item.variantId)}
                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Cart Summary - Non-scrollable */}
        {cartItems.length > 0 && (
          <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0 space-y-4">
            {/* Show delivery section only when logged in */}
            {isLoggedIn ? (
              <>
                {/* Delivery Address Card */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <MapPin className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">Delivering to {selectedAddress?.type || 'Home'}</div>
                        {selectedAddress ? (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {formatAddress(selectedAddress)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">No address selected</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddressSelection(true)}
                      className="text-sm text-brand-primary font-medium hover:text-brand-primary-dark transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Action Button for logged in users */}
                <button
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white font-bold py-3.5 rounded-xl hover:from-brand-primary-dark hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-between px-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
                  onClick={handleProceed}
                  disabled={!selectedAddress}
                >
                  <span className="flex items-center">
                    {!selectedAddress ? 'Select Address First' : 'Proceed To Pay'}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              /* Login button for non-logged in users */
              <button
                className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white font-bold py-3.5 rounded-xl hover:from-brand-primary-dark hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                onClick={() => {
                  setIsLoginOpen(true);
                  onClose();
                }}
              >
                <LogIn className="h-4 w-4" />
                <span>Login to Continue</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Address Selection Sidebar */}
      {showAddressSelection && (
        <div className={`fixed top-0 right-0 h-full w-full max-w-xs sm:max-w-sm bg-white transform transition-all duration-300 ease-out z-[154] translate-x-0 flex flex-col`}>
          {/* Address Selection Header */}
          <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100 flex-shrink-0">
            <button 
              onClick={() => setShowAddressSelection(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Select delivery address</h2>
          </div>

          {/* Add New Address Option */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => setShowAddressModal(true)}
              className="w-full border-2 border-dashed border-gray-300 bg-white rounded-lg p-3 hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 hover:text-brand-primary"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add New Address</span>
            </button>
          </div>

          {/* Saved Addresses */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-sm text-gray-500 mb-3">Your saved address</div>
            
            {isLoadingAddresses ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`bg-white rounded-lg p-3 border-2 cursor-pointer transition-all ${
                      selectedAddress?.id === address.id 
                        ? 'border-brand-primary bg-brand-primary/10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedAddress(address);
                      setShowAddressSelection(false);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {getAddressIcon(address.type)}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 capitalize">{address.type}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {formatAddress(address)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle edit address
                          setShowAddressModal(true);
                        }}
                        className="p-1 text-brand-primary hover:text-brand-primary-dark transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No saved addresses</p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-lg hover:from-brand-primary-dark hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddAddress={handleAddAddress}
        isSubmitting={isAddingAddress}
      />
    </>
  );
}