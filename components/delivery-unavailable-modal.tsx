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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-6 w-6 text-red-500" />
              Delivery Not Available
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                <span className="font-semibold">Delivery not available to pincode {unavailablePincode}.</span>
              </p>
              <p className="text-red-700 text-sm mt-1">
                This pincode is not covered by our current warehouse delivery network.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900 mb-2">Choose an option to continue:</h3>
              
              <button
                onClick={handleSwitchAddress}
                className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Switch to Different Address
                    </div>
                    <div className="text-sm text-gray-600">
                      Select a different delivery address within our delivery network
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={handleSwitchToGlobal}
                className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Switch to Global Store
                    </div>
                    <div className="text-sm text-gray-600">
                      Shop from our global store with worldwide delivery options
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}