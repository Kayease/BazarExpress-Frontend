"use client";
import { useAppContext } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Heart, MapPin, Clock, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { calculateDeliveryChargeAPI, formatDeliveryCharge, getDeliveryTimeEstimate } from "@/lib/delivery";
import DeliveryAvailabilityChecker from "@/components/DeliveryAvailabilityChecker";

export default function CartPage() {
  const { cartItems, updateCartItem, cartTotal, addToWishlist, isInWishlist } = useAppContext();
  const router = useRouter();
  
  // Delivery calculation states
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const removeFromCart = (id: string) => {
    updateCartItem(id, 0);
  };

  const moveToWishlist = (item: any) => {
    addToWishlist(item);
    removeFromCart(item.id);
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location (Delhi) if geolocation fails
          setUserLocation({
            lat: 28.6139,
            lng: 77.2090
          });
        }
      );
    } else {
      // Use default location if geolocation is not supported
      setUserLocation({
        lat: 28.6139,
        lng: 77.2090
      });
    }
  };

  // Calculate delivery charges
  const calculateDelivery = async () => {
    if (!userLocation || cartItems.length === 0) return;
    
    try {
      setLoadingDelivery(true);
      const result = await calculateDeliveryChargeAPI(
        userLocation.lat,
        userLocation.lng,
        cartTotal,
        'online'
      );
      
      if (result) {
        setDeliveryInfo(result);
      }
    } catch (error) {
      console.error('Error calculating delivery:', error);
    } finally {
      setLoadingDelivery(false);
    }
  };

  // Get location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Calculate delivery when location or cart changes
  useEffect(() => {
    if (userLocation && cartItems.length > 0) {
      calculateDelivery();
    }
  }, [userLocation, cartTotal, cartItems.length]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>

          {/* Empty Cart */}
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 max-w-md mx-auto">
              <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
              <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
              <Link href="/search">
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.image || '/placeholder.svg'}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category} • {item.brand}</p>
                        {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove from cart"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 font-semibold text-center min-w-[60px]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Price and Actions */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{item.price.toLocaleString()} each
                        </div>
                        <button
                          onClick={() => moveToWishlist(item)}
                          disabled={isInWishlist(item.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1 mt-1 transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          {isInWishlist(item.id) ? 'In Wishlist' : 'Move to Wishlist'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                
                {/* Delivery Fee */}
                <div className="flex justify-between text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Delivery Fee</span>
                    {deliveryInfo?.distance && (
                      <span className="text-xs text-gray-400">
                        ({deliveryInfo.distance.toFixed(1)} km)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {deliveryInfo?.available === false ? (
                      <span className="text-red-600 text-sm">Not Available</span>
                    ) : deliveryInfo ? (
                      <span className={deliveryInfo.isFreeDelivery ? "text-green-600 font-medium" : "text-gray-900"}>
                        {formatDeliveryCharge(deliveryInfo.deliveryCharge)}
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-green-600">
                      ₹{(cartTotal + (deliveryInfo?.available !== false ? (deliveryInfo?.deliveryCharge || 0) : 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {deliveryInfo?.available === false ? (
                  <Button 
                    disabled 
                    className="w-full bg-gray-400 text-white py-4 text-lg rounded-xl cursor-not-allowed"
                  >
                    Delivery Not Available
                  </Button>
                ) : (
                  <Link href="/payment">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      Proceed to Checkout
                    </Button>
                  </Link>
                )}
                <Link href="/search">
                  <Button variant="outline" className="w-full py-3 rounded-xl border-2 hover:bg-gray-50 transition-colors">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Delivery Availability Checker */}
              <DeliveryAvailabilityChecker
                userLocation={userLocation}
                cartTotal={cartTotal}
                paymentMethod="online"
                onDeliveryInfoChange={(info) => setDeliveryInfo(info)}
                className="mt-6"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}