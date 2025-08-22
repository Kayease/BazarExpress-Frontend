"use client";
import React, { useEffect } from "react";
import { AlertTriangle, Globe, ShoppingCart, X, Store, Clock, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarehouseInfo } from "@/lib/warehouse-validation";

interface WarehouseConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWarehouse: string;
  conflictingProduct: string;
  onClearCart: () => void;
  onSwitchToGlobal: () => void;
  onContinueShopping: () => void;
  isLocationConflict?: boolean;
  newWarehouse?: WarehouseInfo;
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop - No onClick to prevent closing */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden warehouse-conflict-modal max-h-[90vh] overflow-y-auto"
        role="alertdialog">
        {/* Header - No close button */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark px-4 sm:px-6 py-3 sm:py-4 text-white">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold" id="modal-title">
                {isLocationChange ? "Location Changed" : "Different Store Detected"}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm">Action required - Choose an option below</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Problem Explanation */}
          <div className="text-center">
            <div 
              className="bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4"
              id="modal-description"
            >
              {isLocationChange ? (
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-brand-primary-dark">
                    You've changed your location to <strong>"{newWarehouse.name}"</strong> but your cart has items from <strong>"{currentWarehouse}"</strong>.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-brand-primary">
                    <MapPin className="h-3 w-3" />
                    <span>Different warehouse detected</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-brand-primary-dark">
                  <strong>"{conflictingProduct}"</strong> is from a different warehouse than your current cart items from <strong>"{currentWarehouse}"</strong>.
                </p>
              )}
            </div>
          </div>

          {/* Solutions */}
          <div className="border-t pt-3 sm:pt-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Choose your solution:</h3>
            
            <div className="space-y-2 sm:space-y-3">
              {/* Option 1: Clear Cart */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                    <ShoppingCart className="h-4 w-4 text-brand-primary flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm sm:text-base">
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
                    className="text-sm px-3 sm:px-4 py-2 w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-dark text-white border-brand-primary"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Option 2: Continue Shopping */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Store className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                        {isLocationChange ? "Keep Cart & Go Back" : "Keep Current Cart"}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={onContinueShopping}
                    className="text-sm px-3 sm:px-4 py-2 w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                  >
                    {isLocationChange ? "Go Back" : "Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Clear your cart to shop from a different warehouse
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseConflictModal;