"use client";

import React from 'react';
import { Truck, X, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/components/location-provider';
import { useCartContext } from '@/components/app-provider';
import toast from 'react-hot-toast';

interface DeliveryUnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  unavailablePincode: string;
  onShowAddressModal?: () => void;
}

export function DeliveryUnavailableModal({ 
  isOpen, 
  onClose, 
  unavailablePincode,
  onShowAddressModal 
}: DeliveryUnavailableModalProps) {
  const {
    switchToGlobalMode,
    setShowOverlay
  } = useLocation();
  
  const { clearCart } = useCartContext();

  if (!isOpen) return null;

  const handleSwitchToGlobal = async () => {
    try {
      // Clear the cart first before switching to global store
      await clearCart();
      
      // Then switch to global mode
      switchToGlobalMode();
      setShowOverlay(false);
      onClose();
      
      // Show success message
      toast.success('Cart cleared and switched to Global Store');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart. Please try again.');
    }
  };

  const handleSwitchAddress = () => {
    onClose();
    if (onShowAddressModal) {
      onShowAddressModal();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 min-w-0 flex-1">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
              <span className="truncate">Delivery Not Available</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-red-800 text-xs sm:text-sm">
                <span className="font-semibold">Delivery not available to pincode {unavailablePincode}.</span>
              </p>
              <p className="text-red-700 text-xs sm:text-sm mt-1">
                This pincode is not covered by our current warehouse delivery network.
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Choose an option to continue:</h3>
              
              <button
                onClick={handleSwitchAddress}
                className="w-full p-3 sm:p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                      Switch to Different Address
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Select a different delivery address within our delivery network
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={handleSwitchToGlobal}
                className="w-full p-3 sm:p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                      Switch to Global Store
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Shop from our global store with worldwide delivery options
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 text-sm sm:text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}