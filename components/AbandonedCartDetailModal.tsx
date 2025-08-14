"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ShoppingCart, User, Clock, IndianRupee, Mail, Calendar, Package } from 'lucide-react';

interface AbandonedCartItem {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  addedAt: string;
}

interface AbandonedCart {
  _id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  phone?: string;
  items: AbandonedCartItem[];
  totalValue: number;
  abandonedAt: string;
  lastActivity: string;
  isRegistered: boolean;
  remindersSent: number;
  lastReminderSent?: string;
  status: string;
}

interface AbandonedCartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: AbandonedCart;
  onSendReminder: (cartId: string) => void;
  sendingReminder: boolean;
}

export default function AbandonedCartDetailModal({ 
  isOpen, 
  onClose, 
  cart, 
  onSendReminder, 
  sendingReminder 
}: AbandonedCartDetailModalProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  if (!isOpen || !cart) return null;

  const handleSendEmailReminder = async () => {
    if (!cart.userEmail) {
      return;
    }

    setIsSendingEmail(true);

    const subject = "Complete Your Purchase - Special Discount Inside!";
    const body = `Dear ${cart.userName || 'Valued Customer'},

We noticed you left some amazing items in your cart! Don't miss out on these great products.

Your Cart Summary:
${cart.items.map(item => `• ${item.productName} (Qty: ${item.quantity}) - ₹${item.price}`).join('\n')}

Total Value: ₹${cart.totalValue}

🎉 SPECIAL OFFER: Complete your purchase now and get an extra 10% discount!
Use code: COMEBACK10

Visit our website to complete your order: ${window.location.origin}

This offer is valid for a limited time only. Don't let these items slip away!

Best regards,
Your Shopping Team`;

    // Try multiple methods to open email client
    try {
      // Method 1: Direct mailto link with window.open (most reliable)
      const mailtoLink = `mailto:${cart.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      // Method 2: Fallback - try to trigger email client directly
      setTimeout(() => {
        try {
          // Alternative approach: create a clickable element and trigger it
          const emailButton = document.createElement('button');
          emailButton.onclick = () => {
            window.location.href = mailtoLink;
          };
          emailButton.click();
        } catch (e) {
          console.log('Alternative email opening failed:', e);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error opening email client:', error);
      
      // Method 3: Copy to clipboard as fallback
      const emailContent = `To: ${cart.userEmail}\nSubject: ${subject}\n\n${body}`;
      try {
        await navigator.clipboard.writeText(emailContent);
        console.log('Email content copied to clipboard');
      } catch (clipboardError) {
        console.log('Could not copy to clipboard');
      }
    } finally {
      // Reset the loading state after a short delay
      setTimeout(() => {
        setIsSendingEmail(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Abandoned Cart Details</h3>
              <p className="text-white/80">Cart ID: #{cart._id.slice(-8)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Customer Info and Cart Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-600">Customer</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">{cart.userName}</p>
                {cart.userEmail && (
                  <p className="text-xs text-gray-600">{cart.userEmail}</p>
                )}
                {cart.phone && (
                  <p className="text-xs text-gray-600">{cart.phone}</p>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-600">Abandoned Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(cart.abandonedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-600">
                {new Date(cart.abandonedAt).toLocaleTimeString('en-IN')}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-600">Last Activity</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(cart.lastActivity).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-600">
                {new Date(cart.lastActivity).toLocaleTimeString('en-IN')}
              </p>
            </div>
          </div>



          {/* Cart Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-brand-primary" />
              Cart Items ({cart.items.length})
            </h4>
            <div className="space-y-3">
              {cart.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex items-center p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 ml-4">
                    <h5 className="font-medium text-gray-900 mb-1">{item.productName}</h5>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium text-gray-900">
                          <IndianRupee className="inline h-3 w-3" />
                          {item.price}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          <IndianRupee className="inline h-3 w-3" />
                          {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Added: {new Date(item.addedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
                         <button
               onClick={handleSendEmailReminder}
               disabled={!cart.userEmail || isSendingEmail}
               className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
               title={!cart.userEmail ? 'No email address available' : 'Send email reminder'}
             >
               <Mail className="h-4 w-4" />
               <span>{isSendingEmail ? 'Opening Email...' : 'Send Email Reminder'}</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}