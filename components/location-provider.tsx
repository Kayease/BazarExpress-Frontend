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
import { PincodeLocationModal } from '@/components/pincode-location-modal';

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
  revertToPreviousLocation: () => void;
  
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
  
  // Modal management
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [previousLocation, setPreviousLocation] = useState<LocationState | null>(null);

  // Initialize location on mount
  useEffect(() => {
    let fallbackTimer: NodeJS.Timeout;
    
    const initializeLocation = async () => {
      // Clean up old location data that might conflict
      localStorage.removeItem('userLocation'); // Remove old navbar location data
      
      const savedState = getLocationState();
      
      console.log('LocationProvider - Initializing with saved state:', savedState);
      
      if (savedState.pincode && savedState.isLocationDetected) {
        // Validate existing pincode and refresh delivery status
        console.log('LocationProvider - Validating existing pincode:', savedState.pincode);
        try {
          setIsLoading(true);
          const deliveryCheck = await checkPincodeDelivery(savedState.pincode);
          
          console.log('LocationProvider - Delivery check result:', deliveryCheck);
          
          if (deliveryCheck.success) {
            updateLocationState(deliveryCheck);
          } else {
            // Clear invalid state
            console.log('LocationProvider - Clearing invalid state');
            clearLocationState();
            setLocationState(getLocationState());
          }
        } catch (err) {
          console.error('Error validating saved location:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // No saved location - attempt automatic location detection
        const hasAttemptedAutoDetection = localStorage.getItem('hasAttemptedAutoDetection');
        const hasManuallyDismissedModal = sessionStorage.getItem('hasManuallyDismissedLocationModal');
        
        if (!hasAttemptedAutoDetection && !hasManuallyDismissedModal) {
          // Mark that we've attempted auto-detection to avoid repeated prompts
          localStorage.setItem('hasAttemptedAutoDetection', 'true');
          
          // Set a fallback timer to show location modal if geolocation takes too long
          fallbackTimer = setTimeout(() => {
            console.log('LocationProvider - Fallback timer triggered, showing location modal');
            setIsLoading(false);
            setShowLocationModal(true);
          }, 10000); // 10 seconds fallback
          
          try {
            setIsLoading(true);
            const pincode = await getPincodeFromGeolocation();
            
            // Clear the fallback timer since we got a response
            if (fallbackTimer) {
              clearTimeout(fallbackTimer);
              fallbackTimer = null;
            }
            
            if (pincode) {
              const deliveryCheck = await checkPincodeDelivery(pincode);
              
              if (deliveryCheck.success) {
                updateLocationState(deliveryCheck);
              } else {
                // If automatic detection got a pincode but delivery check failed,
                // show the location modal for manual entry
                setTimeout(() => setShowLocationModal(true), 1000);
              }
            } else {
              // If automatic detection failed completely,
              // show the location modal after a short delay
              setTimeout(() => setShowLocationModal(true), 2000);
            }
          } catch (err) {
            console.error('Error with automatic location detection:', err);
            // Clear the fallback timer since we got an error
            if (fallbackTimer) {
              clearTimeout(fallbackTimer);
              fallbackTimer = null;
            }
            // Show location modal as fallback after automatic detection fails
            setTimeout(() => setShowLocationModal(true), 2000);
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    initializeLocation();
    
    // Cleanup function to clear any pending timeouts
    return () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, []);

  const updateLocationState = (deliveryCheck: PincodeDeliveryCheck) => {
    // Store previous location before updating
    if (locationState.isLocationDetected && locationState.pincode !== deliveryCheck.pincode) {
      setPreviousLocation(locationState);
    }
    
    const newState: LocationState = {
      pincode: deliveryCheck.pincode,
      isLocationDetected: true,
      deliveryMode: deliveryCheck.mode === 'custom-disabled' ? 'custom' : deliveryCheck.mode,
      deliveryMessage: deliveryCheck.deliveryStatus?.shortMessage || 'May take few days',
      showOverlay: deliveryCheck.mode === 'custom-disabled',
      overlayMessage: deliveryCheck.deliveryStatus?.message || deliveryCheck.matchedWarehouse?.deliverySettings?.disabledMessage || 'Delivery is currently unavailable in your area',
      matchedWarehouse: deliveryCheck.matchedWarehouse,
      isGlobalMode: deliveryCheck.mode === 'global' || !deliveryCheck.hasCustomWarehouse
    };

    console.log('LocationProvider - Updating location state:', newState);
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
        setShowLocationModal(false); // Close modal on success
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
    let detectionTimeout: NodeJS.Timeout;
    let showModalTimeout: NodeJS.Timeout;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Set a timeout for the entire detection process
      detectionTimeout = setTimeout(() => {
        console.log('LocationProvider - Detection timeout triggered');
        setIsLoading(false);
        setError('Location detection timed out. Please enter your pincode manually.');
        setShowLocationModal(true);
      }, 15000); // 15 seconds total timeout
      
      // Also set a shorter timeout to show the modal if geolocation is taking too long
      showModalTimeout = setTimeout(() => {
        console.log('LocationProvider - Show modal timeout triggered');
        setShowLocationModal(true);
      }, 8000); // Show modal after 8 seconds even if still loading
      
      const pincode = await getPincodeFromGeolocation();
      
      // Clear both timeouts since we got a response
      if (detectionTimeout) {
        clearTimeout(detectionTimeout);
        detectionTimeout = null;
      }
      if (showModalTimeout) {
        clearTimeout(showModalTimeout);
        showModalTimeout = null;
      }
      
      if (pincode) {
        await setUserPincode(pincode);
        // Modal will be closed by setUserPincode if successful
      } else {
        setError('Could not detect your pincode. Please enter it manually.');
        setShowLocationModal(true);
      }
    } catch (err) {
      setError('Location access denied or unavailable');
      console.error('Error detecting location:', err);
      setShowLocationModal(true);
    } finally {
      // Clear any remaining timeouts
      if (detectionTimeout) {
        clearTimeout(detectionTimeout);
      }
      if (showModalTimeout) {
        clearTimeout(showModalTimeout);
      }
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
    
    console.log('LocationProvider - Updating location state:', newState);
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
    setShowLocationModal(false);
    setError(null);
    // Reset auto-detection flag so user can get automatic detection again
    localStorage.removeItem('hasAttemptedAutoDetection');
  };

  const revertToPreviousLocation = () => {
    if (previousLocation) {
      setLocationState(previousLocation);
      saveLocationState(previousLocation);
      setPreviousLocation(null);
      setShowOverlay(false);
    }
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
    revertToPreviousLocation,
    fetchProductsByLocation,
    showOverlay,
    setShowOverlay,
    overlayMessage: locationState.overlayMessage,
    deliveryMessage: locationState.deliveryMessage,
    isGlobalMode: locationState.isGlobalMode,
    showLocationModal,
    setShowLocationModal
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
      <PincodeLocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          // Mark that user manually dismissed the modal in this session
          sessionStorage.setItem('hasManuallyDismissedLocationModal', 'true');
        }}
      />
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