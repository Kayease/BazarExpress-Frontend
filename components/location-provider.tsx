"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  checkPincodeDelivery,
  getProductsByPincode,
  getPincodeFromGeolocation,
  saveLocationState,
  getLocationState,
  clearLocationState,
  formatDeliveryMessage,
  isValidPincode,
  type LocationState,
  type PincodeDeliveryCheck,
  type ProductsByPincode
} from '@/lib/warehouse-location';

interface LocationContextType {
  // Location state
  locationState: LocationState;
  isLoading: boolean;
  error: string | null;
  
  // Location actions
  setUserPincode: (pincode: string) => Promise<void>;
  detectLocation: () => Promise<void>;
  switchToGlobalMode: () => void;
  switchToCustomMode: () => void;
  clearLocation: () => void;
  
  // Product fetching
  fetchProductsByLocation: (options?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => Promise<ProductsByPincode>;
  
  // Overlay management
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  overlayMessage: string;
  
  // Delivery info
  deliveryMessage: string;
  isGlobalMode: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [locationState, setLocationState] = useState<LocationState>(getLocationState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Initialize location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      const savedState = getLocationState();
      
      if (savedState.pincode && savedState.isLocationDetected) {
        // Validate existing pincode and refresh delivery status
        try {
          setIsLoading(true);
          const deliveryCheck = await checkPincodeDelivery(savedState.pincode);
          
          if (deliveryCheck.success) {
            updateLocationState(deliveryCheck);
          } else {
            // Clear invalid state
            clearLocationState();
            setLocationState(getLocationState());
          }
        } catch (err) {
          console.error('Error validating saved location:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeLocation();
  }, []);

  const updateLocationState = (deliveryCheck: PincodeDeliveryCheck) => {
    const newState: LocationState = {
      pincode: deliveryCheck.pincode,
      isLocationDetected: true,
      deliveryMode: deliveryCheck.mode === 'custom-disabled' ? 'custom' : deliveryCheck.mode,
      deliveryMessage: deliveryCheck.deliveryStatus?.shortMessage || 'Delivery info unavailable',
      showOverlay: deliveryCheck.mode === 'custom-disabled',
      overlayMessage: deliveryCheck.deliveryStatus?.message || deliveryCheck.matchedWarehouse?.deliverySettings?.disabledMessage || 'Delivery is currently unavailable in your area',
      matchedWarehouse: deliveryCheck.matchedWarehouse,
      isGlobalMode: deliveryCheck.mode === 'global' || !deliveryCheck.hasCustomWarehouse
    };

    setLocationState(newState);
    saveLocationState(newState);
    
    // Show overlay if delivery is disabled
    if (deliveryCheck.mode === 'custom-disabled') {
      setShowOverlay(true);
    }
  };

  const setUserPincode = async (pincode: string) => {
    if (!isValidPincode(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const deliveryCheck = await checkPincodeDelivery(pincode);
      
      if (deliveryCheck.success) {
        updateLocationState(deliveryCheck);
      } else {
        setError(deliveryCheck.error || 'Failed to check delivery for this pincode');
      }
    } catch (err) {
      setError('Failed to check delivery availability');
      console.error('Error setting user pincode:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const detectLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const pincode = await getPincodeFromGeolocation();
      
      if (pincode) {
        await setUserPincode(pincode);
      } else {
        setError('Could not detect your pincode. Please enter it manually.');
      }
    } catch (err) {
      setError('Location access denied or unavailable');
      console.error('Error detecting location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToGlobalMode = () => {
    const newState: LocationState = {
      ...locationState,
      deliveryMode: 'global',
      deliveryMessage: 'May take few days',
      showOverlay: false,
      isGlobalMode: true
    };
    
    setLocationState(newState);
    saveLocationState(newState);
    setShowOverlay(false);
  };

  const switchToCustomMode = () => {
    if (locationState.matchedWarehouse) {
      const newState: LocationState = {
        ...locationState,
        deliveryMode: 'custom',
        isGlobalMode: false
      };
      
      setLocationState(newState);
      saveLocationState(newState);
    }
  };

  const clearLocation = () => {
    clearLocationState();
    setLocationState(getLocationState());
    setShowOverlay(false);
    setError(null);
  };

  const fetchProductsByLocation = async (options: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  } = {}): Promise<ProductsByPincode> => {
    if (!locationState.pincode) {
      return {
        success: false,
        products: [],
        totalProducts: 0,
        deliveryMode: 'global',
        deliveryMessage: 'Location not detected',
        warehouses: [],
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: 0,
          pages: 0
        },
        error: 'Location not detected'
      };
    }

    try {
      const mode = locationState.isGlobalMode ? 'global' : 'auto';
      return await getProductsByPincode(locationState.pincode, { ...options, mode });
    } catch (err) {
      console.error('Error fetching products by location:', err);
      return {
        success: false,
        products: [],
        totalProducts: 0,
        deliveryMode: locationState.deliveryMode,
        deliveryMessage: 'Failed to load products',
        warehouses: [],
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: 0,
          pages: 0
        },
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  };

  const contextValue: LocationContextType = {
    locationState,
    isLoading,
    error,
    setUserPincode,
    detectLocation,
    switchToGlobalMode,
    switchToCustomMode,
    clearLocation,
    fetchProductsByLocation,
    showOverlay,
    setShowOverlay,
    overlayMessage: locationState.overlayMessage,
    deliveryMessage: locationState.deliveryMessage,
    isGlobalMode: locationState.isGlobalMode
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}