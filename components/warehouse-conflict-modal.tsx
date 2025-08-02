"use client";
import React from "react";
import { AlertTriangle, Globe, ShoppingCart, X, Store, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WarehouseConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWarehouse: string;
  conflictingProduct: string;
  onClearCart: () => void;
  onSwitchToGlobal: () => void;
  onContinueShopping: () => void;
}

const WarehouseConflictModal: React.FC<WarehouseConflictModalProps> = ({
  isOpen,
  onClose,
  currentWarehouse,
  conflictingProduct,
  onClearCart,
  onSwitchToGlobal,
  onContinueShopping
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-lg font-bold">Different Store Detected</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Problem Explanation */}
          <div className="text-center">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800">
                <strong>"{conflictingProduct}"</strong> is from a different warehouse than your current cart items from <strong>"{currentWarehouse}"</strong>.
              </p>
            </div>
          </div>

          {/* Educational Content */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Store className="h-4 w-4 mr-2 text-blue-600" />
              Why can't I mix products?
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <p><strong>Faster Delivery:</strong> Each warehouse has its own delivery schedule and routes.</p>
              </div>
              <div className="flex items-start space-x-2">
                <Truck className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <p><strong>Lower Costs:</strong> Single-warehouse orders reduce shipping complexity and costs.</p>
              </div>
              <div className="flex items-start space-x-2">
                <ShoppingCart className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                <p><strong>Better Experience:</strong> Unified tracking and customer service for your order.</p>
              </div>
            </div>
          </div>

          {/* Solutions */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Choose your solution:</h3>
            
            <div className="space-y-3">
              {/* Option 1: Switch to Global */}
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Switch to Global Store</span>
                    </div>
                    <p className="text-xs text-blue-700">Access all products from multiple warehouses</p>
                  </div>
                  <Button
                    onClick={onSwitchToGlobal}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
                  >
                    Switch
                  </Button>
                </div>
              </div>

              {/* Option 2: Clear Cart */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <ShoppingCart className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Clear Cart & Continue</span>
                    </div>
                    <p className="text-xs text-gray-600">Remove current items and shop from this warehouse</p>
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

              {/* Option 3: Continue Shopping */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Store className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Keep Current Cart</span>
                    </div>
                    <p className="text-xs text-gray-600">Continue shopping from {currentWarehouse}</p>
                  </div>
                  <Button
                    onClick={onContinueShopping}
                    variant="ghost"
                    className="text-sm px-4 py-2"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Use Global Store mode to access products from all warehouses
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseConflictModal;