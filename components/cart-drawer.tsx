"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, Truck, Info, CreditCard, LogIn, Plus, Minus, Trash2, Heart, ShoppingCart } from "lucide-react";
import { getCartItems, updateCartQuantity, removeFromCart, getCartTotals } from "../lib/cart";
import { useAppContext } from "@/components/app-provider";
import Image from "next/image";
import toast from "react-hot-toast";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cartItems, updateCartItem, cartTotal, isLoggedIn, setIsLoginOpen, addToWishlist, isInWishlist } = useAppContext();
  const router = useRouter();

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

  const handleUpdate = (id: string, quantity: number) => {
    updateCartItem(id, quantity);
  };

  const handleRemove = (id: string) => {
    updateCartItem(id, 0);
  };

  const moveToWishlist = (item: any) => {
    addToWishlist(item);
    // Silently remove from cart without showing the removal toast
    updateCartItem(item.id, 0, false);
    toast.success('Moved to wishlist!', {
      icon: '❤️',
      duration: 2000,
    });
  };

  const handleProceed = () => {
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
                <div key={item.id || idx} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h4>
                          <p className="text-xs text-gray-500">
                            {typeof item.brand === "object" && item.brand !== null ? item.brand.name : item.brand}
                            {" • "}
                            {typeof item.category === "object" && item.category !== null ? item.category.name : item.category}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <button 
                            onClick={() => moveToWishlist(item)}
                            disabled={isInWishlist(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors mr-1"
                            title={isInWishlist(item.id) ? "Already in wishlist" : "Move to wishlist"}
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleRemove(item.id)}
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
                            onClick={() => handleUpdate(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1 bg-white text-gray-700 font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleUpdate(item.id, item.quantity + 1)}
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

        {/* Bill Summary and Action Bar Combined - Non-scrollable */}
        {cartItems.length > 0 && (
          <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-green-600" />
              Bill Summary
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-700 text-sm">
                <span>Items total ({cartItems.length})</span>
                <span className="font-semibold">₹{cartTotal.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between text-gray-700 text-sm">
                <span>Delivery charge</span>
                <span className="text-green-600 font-medium">
                  FREE
                </span>
              </div>
              
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-gray-900">Total</div>
                    <p className="text-xs text-gray-500">Inclusive of all taxes</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xl font-bold text-green-600">₹{cartTotal.toLocaleString()}</div>
                    <div className="text-xs text-gray-700">Delivery in 15-20 mins</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Savings Badge */}
            {cartTotal >= 500 && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-700 font-medium">
                    You're getting free delivery!
                  </span>
                </div>
              </div>
            )}
            
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