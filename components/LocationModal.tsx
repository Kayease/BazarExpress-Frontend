"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Search, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLocation } from '@/components/LocationProvider';
import { LocationCoordinates, isValidCoordinates } from '@/lib/location';
import toast from 'react-hot-toast';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const {
    selectedLocation,
    locationName,
    deliveryAvailable,
    availableWarehouses,
    isCheckingDelivery,
    setSelectedLocation,
    getCurrentUserLocation,
    clearLocation
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mapLocation, setMapLocation] = useState<LocationCoordinates | null>(selectedLocation);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  // Initialize Google Maps when modal opens
  useEffect(() => {
    if (isOpen && mapRef.current && !mapInstance.current) {
      initializeMap();
    }
  }, [isOpen]);

  // Update map when selected location changes
  useEffect(() => {
    if (selectedLocation && mapInstance.current) {
      const position = new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
      mapInstance.current.setCenter(position);
      
      if (markerInstance.current) {
        markerInstance.current.setPosition(position);
      }
      
      setMapLocation(selectedLocation);
    }
  }, [selectedLocation]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const defaultLocation = selectedLocation || { lat: 26.8504593, lng: 75.76277019999999 }; // Jaipur default

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Add marker
    markerInstance.current = new google.maps.Marker({
      position: defaultLocation,
      map: mapInstance.current,
      draggable: true,
      title: 'Selected Location'
    });

    // Handle marker drag
    markerInstance.current.addListener('dragend', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setMapLocation({ lat, lng });
    });

    // Handle map click
    mapInstance.current.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      markerInstance.current.setPosition({ lat, lng });
      setMapLocation({ lat, lng });
    });

    setMapLocation(defaultLocation);
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a location to search');
      return;
    }

    setIsSearching(true);
    
    try {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        setIsSearching(false);
        
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const coordinates = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          // Update map
          if (mapInstance.current) {
            mapInstance.current.setCenter(coordinates);
            markerInstance.current.setPosition(coordinates);
          }
          
          setMapLocation(coordinates);
          setSearchResults(results.slice(0, 5)); // Show top 5 results
        } else {
          toast.error('Location not found. Please try a different search term.');
          setSearchResults([]);
        }
      });
    } catch (error) {
      setIsSearching(false);
      console.error('Error searching location:', error);
      toast.error('Failed to search location');
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const location = result.geometry.location;
    const coordinates = {
      lat: location.lat(),
      lng: location.lng()
    };
    
    // Update map
    if (mapInstance.current) {
      mapInstance.current.setCenter(coordinates);
      markerInstance.current.setPosition(coordinates);
    }
    
    setMapLocation(coordinates);
    setSearchQuery(result.formatted_address);
    setSearchResults([]);
  };

  const handleConfirmLocation = async () => {
    if (!mapLocation || !isValidCoordinates(mapLocation)) {
      toast.error('Please select a valid location');
      return;
    }

    const locationName = searchQuery || `${mapLocation.lat.toFixed(4)}, ${mapLocation.lng.toFixed(4)}`;
    await setSelectedLocation(mapLocation, locationName);
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    await getCurrentUserLocation();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Select Delivery Location</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Left Panel - Search and Controls */}
          <div className="lg:w-1/3 p-4 border-r overflow-y-auto">
            {/* Current Location Button */}
            <Button
              onClick={handleUseCurrentLocation}
              variant="outline"
              className="w-full mb-4 justify-start"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>

            {/* Search */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for area, street name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <Button
                  onClick={handleSearchLocation}
                  disabled={isSearching}
                  size="sm"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Search Results</h3>
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm">
                            {result.address_components[0]?.long_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.formatted_address}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Selection Info */}
            {selectedLocation && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Current Location</span>
                </div>
                <div className="text-sm text-green-700">
                  {locationName}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </div>
                
                {/* Delivery Status */}
                <div className="mt-2 pt-2 border-t border-green-200">
                  {isCheckingDelivery ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking delivery availability...
                    </div>
                  ) : deliveryAvailable ? (
                    <div className="text-sm text-green-600">
                      ✅ Delivery available from {availableWarehouses.length} warehouse(s)
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      No delivery available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-gray-600">
              <p className="mb-2">📍 Click on the map or drag the marker to select your location</p>
              <p>🔍 Search for your area using the search box above</p>
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:w-2/3 relative">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Map Loading Overlay */}
            {!mapInstance.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {mapLocation && (
              <>
                Selected: {mapLocation.lat.toFixed(6)}, {mapLocation.lng.toFixed(6)}
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {selectedLocation && (
              <Button
                onClick={clearLocation}
                variant="outline"
                size="sm"
              >
                Clear Location
              </Button>
            )}
            
            <Button
              onClick={handleConfirmLocation}
              disabled={!mapLocation || isCheckingDelivery}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCheckingDelivery ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Confirm Location'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}