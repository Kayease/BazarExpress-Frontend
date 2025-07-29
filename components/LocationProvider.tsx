"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  LocationCoordinates, 
  LocationDeliveryResponse, 
  WarehouseDeliveryInfo,
  checkLocationDelivery,
  getCurrentLocation,
  isValidCoordinates
} from '@/lib/location';
import toast from 'react-hot-toast';

interface LocationContextType {
  // Current location state
  currentLocation: LocationCoordinates | null;
  selectedLocation: LocationCoordinates | null;
  locationName: string;
  
  // Delivery availability
  deliveryAvailable: boolean;
  availableWarehouses: WarehouseDeliveryInfo[];
  isCheckingDelivery: boolean;
  
  // Location management
  setSelectedLocation: (location: LocationCoordinates, name?: string) => void;
  checkDeliveryForLocation: (location: LocationCoordinates) => Promise<void>;
  getCurrentUserLocation: () => Promise<void>;
  clearLocation: () => void;
  
  // UI state
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  // Location state
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [selectedLocation, setSelectedLocationState] = useState<LocationCoordinates | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Delivery state
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean>(false);
  const [availableWarehouses, setAvailableWarehouses] = useState<WarehouseDeliveryInfo[]>([]);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState<boolean>(false);
  
  // UI state
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation');
    const savedLocationName = localStorage.getItem('locationName');
    
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        if (isValidCoordinates(location)) {
          setSelectedLocationState(location);
          setLocationName(savedLocationName || 'Selected Location');
          checkDeliveryForLocation(location);
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
        localStorage.removeItem('selectedLocation');
        localStorage.removeItem('locationName');
      }
    }
  }, []);

  /**
   * Set selected location and check delivery availability
   */
  const setSelectedLocation = async (location: LocationCoordinates, name?: string) => {
    if (!isValidCoordinates(location)) {
      toast.error('Invalid location coordinates');
      return;
    }

    setSelectedLocationState(location);
    const locationDisplayName = name || 'Selected Location';
    setLocationName(locationDisplayName);
    
    // Save to localStorage
    localStorage.setItem('selectedLocation', JSON.stringify(location));
    localStorage.setItem('locationName', locationDisplayName);
    
    // Check delivery availability
    await checkDeliveryForLocation(location);
    
    toast.success(`Location set to ${locationDisplayName}`);
  };

  /**
   * Check delivery availability for a location
   */
  const checkDeliveryForLocation = async (location: LocationCoordinates) => {
    if (!isValidCoordinates(location)) {
      console.error('Invalid coordinates for delivery check');
      return;
    }

    setIsCheckingDelivery(true);
    
    try {
      const result = await checkLocationDelivery(location);
      
      if (result.success) {
        setDeliveryAvailable(result.deliveryAvailable);
        setAvailableWarehouses(result.availableWarehouses);
        
        if (!result.deliveryAvailable) {
          toast.error('No delivery available in your area');
        } else {
          console.log(`Delivery available from ${result.availableWarehouses.length} warehouse(s)`);
        }
      } else {
        setDeliveryAvailable(false);
        setAvailableWarehouses([]);
        toast.error(result.message || 'Failed to check delivery availability');
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryAvailable(false);
      setAvailableWarehouses([]);
      toast.error('Failed to check delivery availability');
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  /**
   * Get user's current location using browser geolocation
   */
  const getCurrentUserLocation = async () => {
    try {
      toast.loading('Getting your location...', { id: 'location' });
      
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      // Reverse geocode to get address name (you can implement this)
      const locationName = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      
      await setSelectedLocation(location, locationName);
      
      toast.success('Location detected successfully', { id: 'location' });
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to get your location',
        { id: 'location' }
      );
    }
  };

  /**
   * Clear selected location
   */
  const clearLocation = () => {
    setSelectedLocationState(null);
    setLocationName('');
    setDeliveryAvailable(false);
    setAvailableWarehouses([]);
    
    // Clear from localStorage
    localStorage.removeItem('selectedLocation');
    localStorage.removeItem('locationName');
    
    toast.success('Location cleared');
  };

  const contextValue: LocationContextType = {
    // Location state
    currentLocation,
    selectedLocation,
    locationName,
    
    // Delivery state
    deliveryAvailable,
    availableWarehouses,
    isCheckingDelivery,
    
    // Location management
    setSelectedLocation,
    checkDeliveryForLocation,
    getCurrentUserLocation,
    clearLocation,
    
    // UI state
    showLocationModal,
    setShowLocationModal,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

/**
 * Hook to use location context
 */
export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}