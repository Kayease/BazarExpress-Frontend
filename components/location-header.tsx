"use client";

import React, { useState } from 'react';
import { MapPin, ChevronDown, Store, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/components/location-provider';
import { PincodeLocationModal } from '@/components/pincode-location-modal';

export function LocationHeader() {
  const {
    locationState,
    deliveryMessage,
    isGlobalMode,
    switchToGlobalMode,
    switchToCustomMode
  } = useLocation();

  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleLocationClick = () => {
    setShowLocationModal(true);
  };

  const handleModeSwitch = () => {
    if (isGlobalMode) {
      switchToCustomMode();
    } else {
      switchToGlobalMode();
    }
  };

  if (!locationState.isLocationDetected) {
    return (
      <>
        <div className="bg-brand-primary text-white py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Select your location for better delivery options</span>
            </div>
            <Button
              onClick={handleLocationClick}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              Select Location
            </Button>
          </div>
        </div>
        
        <PincodeLocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          showOnMount={true}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Location info */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleLocationClick}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <MapPin className="w-4 h-4 text-brand-primary" />
              <div className="text-left">
                <div className="text-sm font-medium">
                  PIN: {locationState.pincode}
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  {isGlobalMode ? (
                    <>
                      <Globe className="w-3 h-3" />
                      Global Store
                    </>
                  ) : (
                    <>
                      <Store className="w-3 h-3" />
                      Local Store
                    </>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          {/* Delivery message and mode switch */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {deliveryMessage}
              </div>
            </div>
            
            {/* Mode switch button - only show if there's a custom warehouse available */}
            {locationState.matchedWarehouse && (
              <Button
                onClick={handleModeSwitch}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isGlobalMode ? (
                  <>
                    <Store className="w-3 h-3 mr-1" />
                    Switch to Local
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 mr-1" />
                    Switch to Global
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile delivery message */}
        <div className="sm:hidden mt-1">
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deliveryMessage}
          </div>
        </div>
      </div>
      
      <PincodeLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
}