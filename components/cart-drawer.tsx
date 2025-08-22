"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, LogIn, Plus, Minus, Trash2, Heart, ShoppingCart, MapPin, Clock } from "lucide-react";
import { getCartItems, updateCartQuantity, removeFromCart, getCartTotals } from "../lib/cart";
import { useAppContext, useCartContext, useWishlistContext } from "@/components/app-provider";
import { useAppSelector } from "@/lib/store";
import Image from "next/image";
import toast from "react-hot-toast";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isLoggedIn, setIsLoginOpen } = useAppContext();
  const { cartItems, updateCartItem, removeCartItem, cartTotal } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();
  const router = useRouter();
  const user = useAppSelector((state: any) => state?.auth?.user);





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

  const moveToWishlist = (item: any) => {
    // Pass variant information when adding to wishlist
    const wishlistItem = {
      ...item,
      variantId: item.variantId,
      variantName: item.variantName,
      selectedVariant: item.selectedVariant
    };
    addToWishlist(wishlistItem);
    // Silently remove from cart without showing the removal toast
    updateCartItem(item.id, 0, item.variantId, false);
    //toast.success('Moved to wishlist!', {icon: '❤️',duration: 2000,});
  };

  const handleProceed = () => {
    // Check if cart is empty
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Add some items first!');
      onClose();
      return;
    }

    if (isLoggedIn) {
      router.push("/payment");
      onClose();
    } else {
      setIsLoginOpen(true);
      onClose();
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 z-[151] backdrop-blur-sm" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xs sm:max-w-sm bg-white transform transition-all duration-300 ease-out z-[152] ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
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
                  router.push('/search');
                  onClose();
                }}
                className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
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
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
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
                            disabled={isInWishlist(item.id, item.variantId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors mr-1"
                            title={isInWishlist(item.id, item.variantId) ? "Already in wishlist" : "Move to wishlist"}
                          >
                            <Heart className="h-4 w-4" />
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
                          <div className="text-sm font-bold text-green-600">₹{(item.price * item.quantity).toLocaleString()}</div>
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

        {/* Simplified Cart Summary - Non-scrollable */}
        {cartItems.length > 0 && (
          <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
            {/* Delivery Address */}
            {user?.defaultAddress && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">Delivering to:</div>
                    <div className="text-xs text-gray-600 truncate">
                      {user.defaultAddress.building && `${user.defaultAddress.building}, `}
                      {user.defaultAddress.area}
                    </div>
                  </div>
                </div>
                {/* Delivery Time */}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Delivery in 15-20 mins</span>
                </div>
              </div>
            )}
            
            {/* Total Amount */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-gray-900">Total</div>
                  <div className="text-xs text-gray-500">{cartItems.length} items</div>
                </div>
                <div className="text-xl font-bold text-green-600">
                  ₹{cartTotal}
                </div>
              </div>
            </div>
            
            <button
              className="w-full bg-green-500 text-white font-bold py-3.5 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center mt-4"
              onClick={handleProceed}
            >
              {isLoggedIn ? (
                <>
                  <span>Proceed to Payment</span>
                </>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  <span>Login to Continue</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}