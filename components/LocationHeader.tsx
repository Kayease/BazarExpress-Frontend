"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Store,
  Truck
} from 'lucide-react';
import { useLocation } from '@/components/LocationProvider';
import { formatDistance } from '@/lib/location';

export default function LocationHeader() {
  const {
    selectedLocation,
    locationName,
    deliveryAvailable,
    availableWarehouses,
    isCheckingDelivery,
    setShowLocationModal,
    getCurrentUserLocation,
    clearLocation
  } = useLocation();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Location Status */}
          <div className="flex items-center gap-3">
            {!selectedLocation ? (
              <>
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Select your location</span>
              </>
            ) : isCheckingDelivery ? (
              <>
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="text-gray-600">Checking delivery...</span>
              </>
            ) : deliveryAvailable ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{locationName}</span>
                    <span className="text-sm text-green-600">
                      • Delivery Available
                    </span>
                  </div>
                  {availableWarehouses.length > 0 && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        <span>{availableWarehouses.length} warehouse(s)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        <span>
                          From {formatDistance(Math.min(...availableWarehouses.map(w => w.distance)))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <span className="font-medium text-gray-900">{locationName}</span>
                  <span className="text-sm text-red-600 ml-2">• No Delivery</span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!selectedLocation ? (
              <>
                <Button
                  onClick={getCurrentUserLocation}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
                <Button
                  onClick={() => setShowLocationModal(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Select Location
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setShowLocationModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Change
                </Button>
                {selectedLocation && (
                  <Button
                    onClick={clearLocation}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Delivery Zone Warning */}
        {selectedLocation && !deliveryAvailable && (
          <div className="pb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-red-800 font-medium">
                    No delivery available to your location
                  </p>
                  <p className="text-red-600 mt-1">
                    Please select a different location within our delivery zones to see available products.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Warehouses Info */}
        {selectedLocation && deliveryAvailable && availableWarehouses.length > 0 && (
          <div className="pb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm">
                <p className="text-green-800 font-medium mb-2">
                  Available Warehouses:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableWarehouses.map((warehouse) => (
                    <div key={warehouse.warehouseId} className="flex items-center gap-2 text-green-700">
                      <Store className="h-3 w-3" />
                      <span className="font-medium">{warehouse.warehouseName}</span>
                      <span className="text-green-600">
                        ({formatDistance(warehouse.distance)})
                      </span>
                      {warehouse.isFreeDeliveryZone && (
                        <span className="text-xs bg-green-600 text-white px-1 rounded">
                          FREE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}