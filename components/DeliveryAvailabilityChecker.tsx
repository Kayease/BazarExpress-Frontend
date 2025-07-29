"use client"

import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Truck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeliveryInfo {
  available: boolean;
  warehouse?: {
    id: string;
    name: string;
    address: string;
  };
  distance?: number;
  deliveryCharge: number;
  totalDeliveryCharge: number;
  isFreeDelivery: boolean;
  freeDeliveryEligible: boolean;
  amountNeededForFreeDelivery: number;
  warehouseSettings?: {
    freeDeliveryRadius: number;
    maxDeliveryRadius: number;
    isDeliveryEnabled: boolean;
  };
  error?: string;
}

interface DeliveryAvailabilityCheckerProps {
  userLocation: { lat: number; lng: number } | null;
  cartTotal: number;
  paymentMethod?: string;
  onDeliveryInfoChange?: (info: DeliveryInfo | null) => void;
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DeliveryAvailabilityChecker({
  userLocation,
  cartTotal,
  paymentMethod = 'online',
  onDeliveryInfoChange,
  className = ''
}: DeliveryAvailabilityCheckerProps) {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check delivery availability when location or cart changes
  useEffect(() => {
    if (userLocation && cartTotal > 0) {
      checkDeliveryAvailability();
    } else {
      setDeliveryInfo(null);
      setError(null);
    }
  }, [userLocation, cartTotal, paymentMethod]);

  // Notify parent component when delivery info changes
  useEffect(() => {
    if (onDeliveryInfoChange) {
      onDeliveryInfoChange(deliveryInfo);
    }
  }, [deliveryInfo, onDeliveryInfoChange]);

  const checkDeliveryAvailability = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/delivery/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerLat: userLocation.lat,
          customerLng: userLocation.lng,
          cartTotal,
          paymentMethod
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeliveryInfo({
          available: true,
          warehouse: data.warehouse,
          distance: data.distance,
          deliveryCharge: data.deliveryCharge,
          totalDeliveryCharge: data.totalDeliveryCharge,
          isFreeDelivery: data.isFreeDelivery,
          freeDeliveryEligible: data.freeDeliveryEligible,
          amountNeededForFreeDelivery: data.amountNeededForFreeDelivery,
          warehouseSettings: data.warehouseSettings
        });
      } else {
        const errorMessage = data.error || 'Delivery not available to this location';
        setDeliveryInfo({
          available: false,
          deliveryCharge: 0,
          totalDeliveryCharge: 0,
          isFreeDelivery: false,
          freeDeliveryEligible: false,
          amountNeededForFreeDelivery: 0,
          error: errorMessage
        });
        setError(errorMessage);
        
        // Show toast notification for delivery unavailability
        if (errorMessage.includes('Maximum delivery distance') || errorMessage.includes('delivery radius')) {
          toast.error('Location outside delivery area', {
            duration: 4000,
            icon: '📍'
          });
        }
      }
    } catch (err) {
      console.error('Error checking delivery availability:', err);
      setError('Failed to check delivery availability');
      setDeliveryInfo({
        available: false,
        deliveryCharge: 0,
        totalDeliveryCharge: 0,
        isFreeDelivery: false,
        freeDeliveryEligible: false,
        amountNeededForFreeDelivery: 0,
        error: 'Failed to check delivery availability'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking delivery availability...</span>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Location Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Please set your delivery location to check availability and charges.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deliveryInfo?.available) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Delivery Not Available</h4>
            <p className="text-sm text-red-700 mt-1">
              {error || deliveryInfo?.error || 'Sorry, we cannot deliver to your location at this time.'}
            </p>
            <div className="mt-3 text-xs text-red-600">
              <p>• Check if your location is within our delivery radius</p>
              <p>• Try selecting a nearby location</p>
              <p>• Contact support for assistance</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-3">
        {/* Delivery Available Header */}
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-green-800">Delivery Available</h4>
            <p className="text-sm text-green-700 mt-1">
              We can deliver to your location from {deliveryInfo.warehouse?.name}
            </p>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              Distance: <span className="font-medium">{deliveryInfo.distance?.toFixed(1)} km</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              Warehouse: <span className="font-medium">{deliveryInfo.warehouse?.name}</span>
            </span>
          </div>
        </div>

        {/* Delivery Charge Info */}
        <div className="bg-white rounded-lg p-3 border border-green-200">
          {deliveryInfo.isFreeDelivery ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">FREE DELIVERY</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivery Charge:</span>
                <span className="font-medium">₹{deliveryInfo.deliveryCharge}</span>
              </div>
              {paymentMethod === 'cod' && deliveryInfo.totalDeliveryCharge > deliveryInfo.deliveryCharge && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">COD Charge:</span>
                  <span className="font-medium">₹{deliveryInfo.totalDeliveryCharge - deliveryInfo.deliveryCharge}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-medium border-t pt-2">
                <span>Total Delivery:</span>
                <span>₹{deliveryInfo.totalDeliveryCharge}</span>
              </div>
            </div>
          )}

          {/* Free Delivery Eligibility */}
          {deliveryInfo.freeDeliveryEligible && deliveryInfo.amountNeededForFreeDelivery > 0 && (
            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Add ₹{deliveryInfo.amountNeededForFreeDelivery} more for FREE delivery!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Coverage Info */}
        {deliveryInfo.warehouseSettings && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            <p>
              Free delivery within {deliveryInfo.warehouseSettings.freeDeliveryRadius} km • 
              Max delivery radius: {deliveryInfo.warehouseSettings.maxDeliveryRadius} km
            </p>
          </div>
        )}
      </div>
    </div>
  );
}