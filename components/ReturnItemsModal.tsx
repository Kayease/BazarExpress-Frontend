"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, MapPin, MapPinOff, Package, AlertCircle } from 'lucide-react';

interface ReturnItem {
  productId: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  returnWindow?: number;
  returnable?: boolean;
}

interface Address {
  _id: string;
  name: string;
  building: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

interface Order {
  _id: string;
  orderId: string;
  items: ReturnItem[];
  actualDeliveryDate?: string;
  status: string;
  deliveryInfo?: {
    address: Address;
  };
}

interface ReturnItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  selectedItems: string[];
  onItemToggle: (itemId: string) => void;
  returnReason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  returnableItems: ReturnItem[];
}

export default function ReturnItemsModal({
  isOpen,
  onClose,
  order,
  selectedItems,
  onItemToggle,
  returnReason,
  onReasonChange,
  onSubmit,
  isSubmitting,
  returnableItems
}: ReturnItemsModalProps) {
  
  // Calculate remaining days for return for each item
  const getRemainingReturnDays = (item: ReturnItem) => {
    const deliveryDate = order.actualDeliveryDate;
    if (!deliveryDate) return 0;
    
    const actualDeliveryDate = new Date(deliveryDate);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate.getTime() - actualDeliveryDate.getTime()) / (1000 * 3600 * 24));
    
    const productReturnWindow = item.returnWindow || 7;
    const daysLeft = productReturnWindow - daysSinceDelivery;
    
    console.log(`🔍 ReturnItemsModal - getRemainingReturnDays for ${item.name}:`, {
      deliveryDate,
      daysSinceDelivery,
      itemReturnWindow: item.returnWindow,
      productReturnWindow,
      daysLeft,
      finalResult: Math.max(0, daysLeft)
    });
    
    return Math.max(0, daysLeft);
  };
  
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Add styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scrolling
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  console.log('🔍 ReturnItemsModal - Full order structure:', order);
  console.log('🔍 ReturnItemsModal - order.deliveryInfo:', order.deliveryInfo);
  console.log('🔍 ReturnItemsModal - order.deliveryInfo?.address:', order.deliveryInfo?.address);

  console.log('🎯 ReturnItemsModal - returnableItems received:', returnableItems.map(item => ({
    name: item.name,
    returnable: item.returnable,
    returnWindow: item.returnWindow
  })));
  
  // Use delivery address from order for pickup
  const pickupAddress = order.deliveryInfo?.address;
  
  console.log('📍 ReturnItemsModal - pickupAddress:', pickupAddress);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-xl sm:rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold">Return Items</h3>
              <p className="text-white/80 text-xs sm:text-sm lg:text-base">#{order.orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 sm:p-1.5 lg:p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Order Items */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-brand-primary" />
                Select Items to Return ({returnableItems.length})
              </h4>
              
              {returnableItems.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh] overflow-y-auto">
                  {returnableItems.map((item: ReturnItem, index: number) => {
                    const itemId = item._id || index.toString();
                    const isSelected = selectedItems.includes(itemId);
                    
                    return (
                      <div 
                        key={`${itemId}-${item.name}`} 
                        className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg transition-all cursor-pointer hover:shadow-sm ${
                          isSelected 
                            ? 'border-brand-primary bg-brand-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => onItemToggle(itemId)}
                      >
                        <input
                          type="checkbox"
                          id={`return-item-${itemId}`}
                          checked={isSelected}
                          onChange={() => onItemToggle(itemId)}
                          className="w-3 h-3 sm:w-4 sm:h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary flex-shrink-0"
                        />
                        <label htmlFor={`return-item-${itemId}`} className="flex-1 cursor-pointer min-w-0">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Product Image */}
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-xs sm:text-sm mb-1 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-600 mb-1">
                                Qty: {item.quantity} × ₹{item.price}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(() => {
                                  const remainingDays = getRemainingReturnDays(item);
                                  return remainingDays > 0 
                                    ? `${remainingDays} day${remainingDays !== 1 ? 's' : ''} left to return`
                                    : 'Return window expired';
                                })()}
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-gray-500 text-xs sm:text-sm">No items are currently eligible for return.</p>
                </div>
              )}
            </div>

            {/* Right Column - Address, Reason, and Actions */}
            <div className="space-y-4 sm:space-y-6">
              {/* Pick-up Address */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Pick-up Address</h4>
                </div>
                
                {pickupAddress ? (
                  <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                    <p className="font-medium">{pickupAddress.name}</p>
                    <p>{pickupAddress.building}</p>
                    <p>{pickupAddress.area}</p>
                    <p>{pickupAddress.city}, {pickupAddress.state}</p>
                    <p>{pickupAddress.pincode}</p>
                    {pickupAddress.phone && <p>Phone: {pickupAddress.phone}</p>}
                  </div>
                ) : (
                  <div className="flex items-start space-x-2">
                    <MapPinOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs sm:text-sm">
                      <p className="text-gray-500 mb-2">Delivery address not found for this order</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Return Reason */}
              <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <label htmlFor="returnReason" className="text-xs sm:text-sm font-semibold text-gray-900">
                    Reason for Return *
                  </label>
                </div>
                <div className="relative">
                  <select
                    id="returnReason"
                    value={returnReason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 appearance-none cursor-pointer ${
                      returnReason 
                        ? 'border-green-200 bg-green-50 text-green-900' 
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 focus:border-brand-primary focus:bg-white'
                    }`}
                    required
                  >
                    <option value="" className="text-gray-500">Choose a return reason...</option>
                    <option value="defective" className="text-gray-900 py-2">🚫 Product is defective</option>
                    <option value="wrong_item" className="text-gray-900 py-2">❌ Wrong item received</option>
                    <option value="size_issue" className="text-gray-900 py-2">📏 Size doesn't fit</option>
                    <option value="quality_issue" className="text-gray-900 py-2">⭐ Quality not as expected</option>
                    <option value="damaged" className="text-gray-900 py-2">📦 Item damaged during delivery</option>
                    <option value="other" className="text-gray-900 py-2">💬 Other reason</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${
                      returnReason ? 'text-green-600' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {returnReason && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-green-600">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Reason selected: {returnReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 sm:space-x-3 pt-2 sm:pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={selectedItems.length === 0 || !returnReason || isSubmitting}
                  className="flex-1 px-3 sm:px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Return Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}