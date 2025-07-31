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
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-brand-primary" />
            Select Your Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            We need your location to show you the best products and delivery options available in your area.
          </p>

          {/* Auto-detect location button */}
          <Button
            onClick={handleDetectLocation}
            disabled={isLoading}
            className="w-full flex items-center gap-2 border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isLoading ? 'Detecting Location...' : 'Use Current Location'}
          </Button>

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
                className={inputError ? 'border-red-500' : ''}
              />
              {inputError && (
                <p className="text-sm text-red-500 mt-1">{inputError}</p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || pincodeInput.length !== 6}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-primary/90 hover:from-brand-primary/90 hover:to-brand-primary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking Delivery...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Check Delivery
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
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Location Detected: {locationState.pincode}
                  </p>
                  <p className="text-xs text-green-600">
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