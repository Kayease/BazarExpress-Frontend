"use client";

import { useLocation } from "@/components/location-provider";
import { MapPin, Globe, Store, Clock } from "lucide-react";

export default function LocationStatusIndicator() {
  const { locationState, deliveryMessage, isGlobalMode } = useLocation();

  if (!locationState.isLocationDetected) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {isGlobalMode ? (
            <Globe className="h-5 w-5 text-blue-600" />
          ) : (
            <Store className="h-5 w-5 text-green-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              Pincode: {locationState.pincode}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {deliveryMessage}
            </span>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isGlobalMode 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {isGlobalMode ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Shopping from 24×7 Warehouse
                </>
              ) : (
                <>
                  <Store className="h-3 w-3 mr-1" />
                  Shopping from Local Warehouse
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}