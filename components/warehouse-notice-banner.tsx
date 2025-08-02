"use client";
import React, { useState, useEffect } from "react";
import { AlertTriangle, Globe, X, Info, ShoppingCart } from "lucide-react";
import { useCartContext } from "@/components/app-provider";
import { useLocation } from "@/components/location-provider";
import { findCustomWarehouseInCart } from "@/lib/warehouse-validation";

interface WarehouseNoticeBannerProps {
  onSwitchToGlobal?: () => void;
}

const WarehouseNoticeBanner: React.FC<WarehouseNoticeBannerProps> = ({
  onSwitchToGlobal
}) => {
  const { cartItems, clearCart } = useCartContext();
  const { locationState, switchToGlobalMode, isGlobalMode } = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check if there's a custom warehouse in cart
  const customWarehouse = findCustomWarehouseInCart(cartItems);
  const hasCartItems = cartItems.length > 0;

  // Don't show if dismissed, no location detected, or already in global mode
  if (isDismissed || !locationState.isLocationDetected || isGlobalMode) {
    return null;
  }

  const handleSwitchToGlobal = () => {
    switchToGlobalMode();
    onSwitchToGlobal?.();
    setIsDismissed(true);
  };

  const handleClearCartAndSwitch = () => {
    clearCart();
    switchToGlobalMode();
    onSwitchToGlobal?.();
    setIsDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blue-900">
                  <span className="hidden sm:inline">
                    Shopping from your local store in {locationState.pincode}
                  </span>
                  <span className="sm:hidden">
                    Local store mode
                  </span>
                  {customWarehouse && (
                    <span className="ml-2 text-blue-700">
                      ({customWarehouse.name})
                    </span>
                  )}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="underline hover:no-underline"
                  >
                    {showDetails ? 'Hide details' : 'Why can\'t I mix products from different stores?'}
                  </button>
                </div>
                
                {showDetails && (
                  <div className="mt-2 text-xs text-blue-800 bg-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="space-y-2">
                      <p>
                        <strong>Local Store:</strong> Products are delivered from your nearest warehouse for faster delivery and lower costs.
                      </p>
                      <p>
                        <strong>Global Store:</strong> Access to all products from multiple warehouses, but may have longer delivery times.
                      </p>
                      <p>
                        <strong>Why separate?</strong> Each warehouse has different inventory and delivery schedules. Mixing products would complicate logistics and increase costs.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {hasCartItems ? (
                <button
                  onClick={handleClearCartAndSwitch}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover:scale-105"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Clear Cart & </span>
                  Switch to Global
                </button>
              ) : (
                <button
                  onClick={handleSwitchToGlobal}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Switch to Global
                </button>
              )}
              
              <button
                onClick={() => setIsDismissed(true)}
                className="flex-shrink-0 p-1 text-blue-400 hover:text-blue-600 transition-colors"
                aria-label="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cart Status Indicator */}
          {hasCartItems && customWarehouse && (
            <div className="mt-2 flex items-center text-xs text-blue-700">
              <ShoppingCart className="h-3 w-3 mr-1" />
              <span>
                Your cart has {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} from {customWarehouse.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseNoticeBanner;