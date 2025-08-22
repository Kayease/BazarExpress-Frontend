"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocation } from '@/components/location-provider';
import { isValidPincode } from '@/lib/warehouse-location';

interface PincodeLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  showOnMount?: boolean;
}

export function PincodeLocationModal({ isOpen, onClose, showOnMount = false }: PincodeLocationModalProps) {
  const {
    locationState,
    isLoading,
    error,
    setUserPincode,
    detectLocation
  } = useLocation();

  const [pincodeInput, setPincodeInput] = useState('');
  const [inputError, setInputError] = useState('');

  // Auto-show modal if location not detected and showOnMount is true
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (showOnMount && !locationState.isLocationDetected) {
      setShouldShow(true);
    }
  }, [showOnMount, locationState.isLocationDetected]);

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPincode(pincodeInput)) {
      setInputError('Please enter a valid 6-digit pincode');
      return;
    }

    setInputError('');
    await setUserPincode(pincodeInput);
    
    // Close modal on success
    if (!error) {
      onClose();
      setShouldShow(false);
    }
  };

  const handleDetectLocation = async () => {
    await detectLocation();
    
    // Close modal on success
    if (!error) {
      onClose();
      setShouldShow(false);
    }
  };

  const handleClose = () => {
    onClose();
    setShouldShow(false);
  };

  const modalOpen = isOpen || shouldShow;

  return (
    <Dialog open={modalOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            <span>Select Your Location</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm text-text-secondary px-1">
            We need your location to show you the best products and delivery options available in your area.
          </p>

          {/* Auto-detect location button */}
          <Button
            onClick={handleDetectLocation}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-semibold py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50 text-sm sm:text-base"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span className="whitespace-nowrap">
              {isLoading ? 'Detecting Location...' : 'Use Current Location'}
            </span>
          </Button>
          
          {/* Show timeout info when detecting */}
          {isLoading && (
            <p className="text-xs text-gray-500 text-center px-2">
              This will take a few seconds. If it takes too long, you can enter your pincode manually below.
            </p>
          )}
          
          {/* Show error message if detection failed */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Manual pincode entry */}
          <form onSubmit={handlePincodeSubmit} className="space-y-3">
            <div>
              <Input
                type="text"
                placeholder="Enter your 6-digit pincode"
                value={pincodeInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPincodeInput(value);
                  setInputError('');
                }}
                maxLength={6}
                className={`text-sm sm:text-base ${inputError ? 'border-red-500' : ''}`}
              />
              {inputError && (
                <p className="text-sm text-red-500 mt-1">{inputError}</p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || pincodeInput.length !== 6}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold py-2.5 px-3 sm:px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Checking Delivery...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Check Delivery</span>
                </>
              )}
            </Button>
          </form>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Current location display */}
          {locationState.isLocationDetected && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-purple-800">
                    Location Detected: {locationState.pincode}
                  </p>
                  <p className="text-xs text-purple-600">
                    {locationState.deliveryMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}