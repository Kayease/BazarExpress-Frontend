"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag, Truck, CreditCard, Tag } from 'lucide-react';
import Image from 'next/image';

interface OrderSummaryProps {
  cartItems: any[];
  cartTotal: number;
  selectedAddress: any;
  selectedPaymentMethod: string;
  onPlaceOrder: () => void;
  isProcessing: boolean;
}

export default function OrderSummary({ 
  cartItems, 
  cartTotal, 
  selectedAddress, 
  selectedPaymentMethod, 
  onPlaceOrder, 
  isProcessing 
}: OrderSummaryProps) {
  const [showItems, setShowItems] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // Calculate pricing
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = 0; // Free delivery
  const codCharge = selectedPaymentMethod === 'cod' ? 0 : 0; // No COD charge for now
  const discount = promoApplied ? 50 : 0; // Example discount
  const taxAmount = 0; // Tax calculation can be added here
  const total = subtotal + deliveryCharge + codCharge + taxAmount - discount;

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'save50') {
      setPromoApplied(true);
    }
  };

  const canPlaceOrder = selectedAddress && selectedPaymentMethod && !isProcessing;

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div>
        <button
          onClick={() => setShowItems(!showItems)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {showItems ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {showItems && (
          <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={item.cartItemId || `${item.id}_${item.variantId}` || index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image 
                    src={item.image || "/placeholder.svg"} 
                    alt={item.name} 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </h4>
                  {item.variantName && (
                    <p className="text-xs text-purple-600">
                      {item.variantName}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promo Code */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Promo Code</span>
        </div>
        
        {!promoApplied ? (
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleApplyPromo}
              disabled={!promoCode}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">SAVE50 Applied</span>
            </div>
            <button
              onClick={() => {
                setPromoApplied(false);
                setPromoCode('');
              }}
              className="text-sm text-green-600 hover:text-green-800"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="text-green-600">
            {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
          </span>
        </div>

        {codCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">COD Charges</span>
            <span className="text-gray-900">₹{codCharge}</span>
          </div>
        )}

        {taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Taxes</span>
            <span className="text-gray-900">₹{taxAmount}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="text-green-600">-₹{discount}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-semibold pt-3 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-purple-600">₹{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Delivery Info */}
      {selectedAddress && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Delivery Details</span>
          </div>
          <p className="text-xs text-blue-600">
            Delivering to: {selectedAddress.area}, {selectedAddress.city}
          </p>
          <p className="text-xs text-blue-600">
            Expected delivery: 15-20 minutes
          </p>
        </div>
      )}

      {/* Payment Method Info */}
      {selectedPaymentMethod && (
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Payment: {
                selectedPaymentMethod === 'cod' ? 'Cash on Delivery' :
                selectedPaymentMethod === 'upi' ? 'UPI' :
                selectedPaymentMethod === 'card' ? 'Card' :
                selectedPaymentMethod === 'netbanking' ? 'Net Banking' :
                'Online Payment'
              }
            </span>
          </div>
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={onPlaceOrder}
        disabled={!canPlaceOrder}
        className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
          canPlaceOrder
            ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </div>
        ) : (
          `Place Order • ₹${total.toLocaleString()}`
        )}
      </button>

      {/* Security Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          By placing this order, you agree to our Terms & Conditions
        </p>
      </div>
    </div>
  );
}