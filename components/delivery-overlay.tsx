"use client";

import React from 'react';
import { AlertTriangle, MapPin, Clock, Store, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/components/location-provider';
import { useCartContext } from '@/components/app-provider';
import type { Warehouse } from '@/types/warehouse';

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
  
  // Provide default values for deliveryDays and deliveryHours
  const deliveryDays = warehouse.deliverySettings.deliveryDays || [];
  const deliveryHours = warehouse.deliverySettings.deliveryHours || { start: '09:00', end: '18:00' };
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
  
  // Ensure deliveryDays is an array before calling includes
  if (Array.isArray(deliveryDays) && deliveryDays.includes(currentDay) && currentTime < (deliveryHours?.start || '00:00')) {
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

  const warehouse = locationState.matchedWarehouse as Warehouse | undefined;
  const nextOpeningInfo = warehouse ? getNextOpeningInfo(warehouse) : null;
  const isOutsideHours = warehouse?.deliverySettings?.is24x7Delivery === false;
  const isDisabled = warehouse?.deliverySettings?.isDeliveryEnabled === false;

  // Status message
  const statusMessage = isDisabled
    ? (overlayMessage || 'Delivery is currently disabled for this store.')
    : isOutsideHours
      ? `Store is currently closed. ${nextOpeningInfo ? `Opens ${nextOpeningInfo.nextOpeningDay} at ${nextOpeningInfo.nextOpeningTime}` : ''}`
      : (overlayMessage || 'Delivery is currently unavailable in your area.');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-auto overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 text-center border-b">
          <div className={`inline-flex items-center justify-center p-2.5 sm:p-3 rounded-full ${isDisabled ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'} mb-2.5 sm:mb-3`}>
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Store Unavailable</h2>
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-600">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" />
            <span>PIN: {locationState.pincode}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Status alert */}
          <div className={`rounded-md p-3 flex items-start gap-2 text-xs sm:text-sm ${
            isDisabled ? 'bg-red-50 text-red-800' : 'bg-purple-50 text-purple-800'
          }`}>
            <AlertTriangle className={`flex-shrink-0 mt-0.5 ${isDisabled ? 'text-red-500' : 'text-purple-500'}`} />
            <p className="break-words">{statusMessage}</p>
          </div>

          {/* Warehouse details */}
          {warehouse && (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="bg-purple-100 p-1.5 rounded-md text-purple-800 flex-shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">{warehouse.name}</h3>
                  <p className="text-xs text-gray-600 mt-0.5 break-words">{warehouse.address}</p>
                </div>
              </div>

              <div className="space-y-2">
                {warehouse?.deliverySettings?.deliveryHours && !warehouse.deliverySettings.is24x7Delivery && (
                  <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-md text-xs sm:text-sm">
                    <Clock className="text-purple-600 w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-gray-600">Hours:</span>
                    <span className="font-medium text-purple-800">
                      {formatTime(warehouse.deliverySettings.deliveryHours.start)} - {formatTime(warehouse.deliverySettings.deliveryHours.end)}
                    </span>
                  </div>
                )}

                {warehouse?.deliverySettings?.deliveryDays?.length > 0 && !warehouse.deliverySettings.is24x7Delivery && (
                  <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-md text-xs sm:text-sm">
                    <Calendar className="text-purple-600 w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-gray-600">Days:</span>
                    <div className="flex flex-wrap gap-1">
                      {warehouse.deliverySettings.deliveryDays.map((day: string) => (
                        <span key={day} className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-xs font-medium">
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
              className="w-full h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Store className="mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Switch to Global Store
            </Button>
            
            {!isDisabled && (
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm font-medium border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isOutsideHours && nextOpeningInfo && warehouse?.deliverySettings?.isDeliveryEnabled === true
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