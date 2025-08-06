"use client";
import React, { useEffect } from "react";
import { AlertTriangle, Globe, ShoppingCart, X, Store, Clock, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WarehouseConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWarehouse: string;
  conflictingProduct: string;
  onClearCart: () => void;
  onSwitchToGlobal: () => void;
  onContinueShopping: () => void;
  isLocationConflict?: boolean;
  newWarehouse?: any;
}

const WarehouseConflictModal: React.FC<WarehouseConflictModalProps> = ({
  isOpen,
  onClose,
  currentWarehouse,
  conflictingProduct,
  onClearCart,
  onSwitchToGlobal,
  onContinueShopping,
  isLocationConflict = false,
  newWarehouse
}) => {
  // Prevent body scrolling and interactions when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-blocking');
      
      // Add global style to block interactions
      const style = document.createElement('style');
      style.id = 'warehouse-conflict-modal-styles';
      style.textContent = `
        .modal-blocking * {
          pointer-events: none !important;
        }
        .modal-blocking .warehouse-conflict-modal,
        .modal-blocking .warehouse-conflict-modal * {
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.body.classList.remove('modal-blocking');
        const existingStyle = document.getElementById('warehouse-conflict-modal-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLocationChange = isLocationConflict && newWarehouse;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop - No onClick to prevent closing */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden warehouse-conflict-modal"
        role="alertdialog">
        {/* Header - No close button */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold" id="modal-title">
                {isLocationChange ? "Location Changed" : "Different Store Detected"}
              </h2>
              <p className="text-orange-100 text-sm">Action required - Choose an option below</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Problem Explanation */}
          <div className="text-center">
            <div 
              className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4"
              id="modal-description"
            >
              {isLocationChange ? (
                <div className="space-y-2">
                  <p className="text-sm text-orange-800">
                    You've changed your location to <strong>"{newWarehouse.name}"</strong> but your cart has items from <strong>"{currentWarehouse}"</strong>.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-orange-700">
                    <MapPin className="h-3 w-3" />
                    <span>Different warehouse detected</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-orange-800">
                  <strong>"{conflictingProduct}"</strong> is from a different warehouse than your current cart items from <strong>"{currentWarehouse}"</strong>.
                </p>
              )}
            </div>
          </div>

          {/* Solutions */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Choose your solution:</h3>
            
            <div className="space-y-3">
              {/* Option 1: Clear Cart */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <ShoppingCart className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {isLocationChange ? "Clear Cart & Shop Here" : "Clear Cart & Continue"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {isLocationChange 
                        ? `Remove current items and shop from ${newWarehouse.name}`
                        : "Remove current items and shop from this warehouse"
                      }
                    </p>
                  </div>
                  <Button
                    onClick={onClearCart}
                    variant="outline"
                    className="text-sm px-4 py-2"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Option 2: Continue Shopping */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Store className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {isLocationChange ? "Keep Cart & Go Back" : "Keep Current Cart"}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={onContinueShopping}
                    variant="ghost"
                    className="text-sm px-4 py-2"
                  >
                    {isLocationChange ? "Go Back" : "Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Clear your cart to shop from a different warehouse
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseConflictModal;