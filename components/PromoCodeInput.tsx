"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromoCodeInputProps {
  cartTotal: number;
  cartItems: any[];
  userId?: string;
  onPromoCodeApplied: (discount: number, promoCode: any) => void;
  onPromoCodeRemoved: () => void;
  appliedPromoCode?: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PromoCodeInput({
  cartTotal,
  cartItems,
  userId,
  onPromoCodeApplied,
  onPromoCodeRemoved,
  appliedPromoCode
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch(`${API_URL}/promocodes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          userId,
          cartItems: cartItems.map(item => ({
            productId: item.productId || item._id,
            categoryId: item.categoryId || item.category,
            brandId: item.brandId || item.brand,
            quantity: item.quantity,
            price: item.price
          })),
          cartTotal
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        toast.success(`Promo code applied! You saved ₹${data.discountAmount}`);
        onPromoCodeApplied(data.discountAmount, data.promocode);
        setPromoCode('');
      } else {
        toast.error(data.error || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Failed to validate promo code');
    } finally {
      setIsValidating(false);
    }
  };

  const removePromoCode = () => {
    onPromoCodeRemoved();
    toast.success('Promo code removed');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validatePromoCode();
    }
  };

  return (
    <div className="space-y-4">
      {/* Applied Promo Code Display */}
      {appliedPromoCode && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <span className="text-sm font-medium text-green-800">
                {appliedPromoCode.code}
              </span>
              <div className="text-xs text-green-600">
                {appliedPromoCode.type === 'percentage' 
                  ? `${appliedPromoCode.discount}% off` 
                  : `₹${appliedPromoCode.discount} off`}
                {appliedPromoCode.usageType === 'single_use' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Single Use
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removePromoCode}
            className="text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Promo Code Input */}
      {!appliedPromoCode && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Have a promo code?</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isValidating}
            />
            <Button
              onClick={validatePromoCode}
              disabled={isValidating || !promoCode.trim()}
              className="px-6"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            <p>• Enter your promo code to get instant discount</p>
            <p>• Some promo codes may have usage restrictions</p>
          </div>
        </div>
      )}
    </div>
  );
}