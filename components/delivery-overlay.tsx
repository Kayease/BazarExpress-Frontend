"use client";

import React from 'react';
import { AlertTriangle, MapPin, Clock, Store, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/components/location-provider';
import { useCartContext } from '@/components/app-provider';

interface DeliveryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getNextOpeningInfo = (warehouse: any) => {
  if (!warehouse?.deliverySettings) return null;
  
  const { deliveryDays, deliveryHours } = warehouse.deliverySettings;
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  const currentTime = now.toLocaleTimeString('en-GB', { 
    hour12: false, 
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayIndex = daysOfWeek.indexOf(currentDay);
  
  if (deliveryDays.includes(currentDay) && currentTime < deliveryHours.start) {
    return {
      nextOpeningDay: 'Today',
      nextOpeningTime: formatTime(deliveryHours.start),
      nextDeliveryDay: 'Today'
    };
  }
  
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = daysOfWeek[nextDayIndex];
    if (deliveryDays.includes(nextDay)) {
      const isNextDay = i === 1;
      return {
        nextOpeningDay: isNextDay ? 'Tomorrow' : nextDay,
        nextOpeningTime: formatTime(deliveryHours.start),
        nextDeliveryDay: isNextDay ? 'Tomorrow' : nextDay
      };
    }
  }
  
  return {
    nextOpeningDay: deliveryDays[0] || 'Next week',
    nextOpeningTime: formatTime(deliveryHours.start),
    nextDeliveryDay: deliveryDays[0] || 'Next week'
  };
};

export function DeliveryOverlay({ isOpen, onClose }: DeliveryOverlayProps) {
  const {
    locationState,
    overlayMessage,
    switchToGlobalMode,
    setShowOverlay
  } = useLocation();
  
  const { cartItems } = useCartContext();

  if (!isOpen) return null;

  const handleSwitchToGlobal = () => {
    // Always switch to global mode - the warehouse conflict hook will handle conflicts
    switchToGlobalMode();
    setShowOverlay(false);
    onClose();
  };

  const handleClose = () => {
    setShowOverlay(false);
    onClose();
  };

  const warehouse = locationState.matchedWarehouse;
  const nextOpeningInfo = warehouse ? getNextOpeningInfo(warehouse) : null;
  const isOutsideHours = warehouse?.deliverySettings && !warehouse.deliverySettings.is24x7Delivery;
  const isDisabled = warehouse?.deliverySettings && !warehouse.deliverySettings.isDeliveryEnabled;

  // Status message
  const statusMessage = isDisabled
    ? (overlayMessage || 'Delivery is currently disabled for this store.')
    : isOutsideHours
      ? `Store is currently closed. ${nextOpeningInfo ? `Opens ${nextOpeningInfo.nextOpeningDay} at ${nextOpeningInfo.nextOpeningTime}` : ''}`
      : (overlayMessage || 'Delivery is currently unavailable in your area.');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 text-center border-b">
          <div className={`inline-flex items-center justify-center p-3 rounded-full ${isDisabled ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'} mb-3`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Store Unavailable</h2>
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5" />
            <span>PIN: {locationState.pincode}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status alert */}
          <div className={`rounded-md p-3 flex items-start gap-2 text-sm ${
            isDisabled ? 'bg-red-50 text-red-800' : 'bg-orange-50 text-orange-800'
          }`}>
            <AlertTriangle className={`flex-shrink-0 mt-0.5 ${isDisabled ? 'text-red-500' : 'text-orange-500'}`} />
            <p>{statusMessage}</p>
          </div>

          {/* Warehouse details */}
          {warehouse && (
            <div className="space-y-3">
              {/* Store info */}
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-1.5 rounded-md text-blue-800">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{warehouse.name}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{warehouse.address}</p>
                </div>
              </div>

              {/* Schedule info - single column */}
              <div className="space-y-2">
                {/* Working hours */}
                {warehouse.deliverySettings && !warehouse.deliverySettings.is24x7Delivery && warehouse.deliverySettings.deliveryHours && (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md text-sm">
                    <Clock className="text-blue-600 w-4 h-4 flex-shrink-0" />
                    <span className="text-gray-500">Hours:</span>
                    <span className="font-medium">
                      {formatTime(warehouse.deliverySettings.deliveryHours.start)} - {formatTime(warehouse.deliverySettings.deliveryHours.end)}
                    </span>
                  </div>
                )}

                {/* Working days */}
                {warehouse.deliverySettings && !warehouse.deliverySettings.is24x7Delivery && warehouse.deliverySettings.deliveryDays && warehouse.deliverySettings.deliveryDays.length > 0 && (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md text-sm">
                    <Calendar className="text-blue-600 w-4 h-4 flex-shrink-0" />
                    <span className="text-gray-500">Days:</span>
                    <div className="flex flex-wrap gap-1">
                      {warehouse.deliverySettings.deliveryDays.map((day: string) => (
                        <span key={day} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium">
                          {day.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleSwitchToGlobal}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              <Store className="mr-2 w-4 h-4" />
              Switch to Global Store
            </Button>
            
            {!isDisabled && (
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full h-10 text-sm font-medium border-gray-300 hover:bg-gray-50"
              >
                {isOutsideHours && nextOpeningInfo && warehouse?.deliverySettings?.isDeliveryEnabled
                  ? `Order for ${nextOpeningInfo.nextDeliveryDay}`
                  : 'Stay with Local Store'
                }
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}