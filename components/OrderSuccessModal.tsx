'use client';

import React, { useEffect } from 'react';
import { CheckCircle, Package, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    total: number;
    paymentMethod: string;
    estimatedDelivery?: string;
    itemCount: number;
  };
  onViewOrder: () => void;
}

export default function OrderSuccessModal({ 
  isOpen, 
  onClose, 
  orderData, 
  onViewOrder 
}: OrderSuccessModalProps) {

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[9999]"
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-in fade-in-0 zoom-in-95 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >

        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-gray-600">
            Thank you for your order. We'll get it ready for you.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Order ID</span>
            <span className="text-sm font-bold text-gray-900">{orderData.orderId}</span>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Total Amount</span>
            <span className="text-lg font-bold text-brand-primary">₹{orderData.total}</span>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Items</span>
            <span className="text-sm font-medium text-gray-900">
              {orderData.itemCount} {orderData.itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Payment Method</span>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">
                {orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onViewOrder}
            className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-3"
          >
            <Package className="h-4 w-4 mr-2" />
            View Order
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-brand-primary text-brand-primary hover:bg-brand-primary/10 font-semibold py-3"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}