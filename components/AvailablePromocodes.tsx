"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tag, 
  Clock, 
  Gift, 
  TrendingUp, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AvailablePromocodesProps {
  cartTotal: number;
  cartItems: any[];
  userId?: string;
  onPromoCodeSelect: (code: string) => void;
  appliedPromoCode?: any;
}

interface PromoCode {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  discount: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageType: 'single_use' | 'multiple_use';
  description?: string;
  appliesTo: string;
  potentialDiscount: number;
  endDate?: string;
  status: 'applicable' | 'almost_available';
  message: string;
  amountNeeded?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AvailablePromocodes({
  cartTotal,
  cartItems,
  userId,
  onPromoCodeSelect,
  appliedPromoCode
}: AvailablePromocodesProps) {
  const [availablePromocodes, setAvailablePromocodes] = useState<PromoCode[]>([]);
  const [almostAvailablePromocodes, setAlmostAvailablePromocodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string>('');

  const fetchAvailablePromocodes = async () => {
    if (cartTotal <= 0) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        cartTotal: cartTotal.toString(),
        ...(userId && { userId }),
        cartItems: JSON.stringify(cartItems)
      });

      const response = await fetch(`${API_URL}/promocodes/available?${params}`);
      
      if (!response.ok) {
        console.warn('Failed to fetch promocodes:', response.status);
        return;
      }
      
      const data = await response.json();
      setAvailablePromocodes(data.available || []);
      setAlmostAvailablePromocodes(data.almostAvailable || []);
    } catch (error) {
      console.warn('Error fetching available promocodes:', error);
      // Don't show error to user, just fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailablePromocodes();
  }, [cartTotal, userId]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied ${code} to clipboard!`);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const formatDiscount = (promo: PromoCode) => {
    if (promo.type === 'percentage') {
      return `${promo.discount}% OFF`;
    }
    return `₹${promo.discount} OFF`;
  };

  const formatEndDate = (endDate?: string) => {
    if (!endDate) return null;
    const date = new Date(endDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `Expires in ${diffDays} days`;
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700">Loading offers...</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (availablePromocodes.length === 0 && almostAvailablePromocodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Available Promocodes */}
      {availablePromocodes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Available Offers</span>
          </div>
          
          <div className="space-y-2">
            {availablePromocodes.map((promo) => (
              <Card 
                key={promo._id} 
                className={`border-2 transition-all cursor-pointer hover:shadow-md ${
                  appliedPromoCode?.code === promo.code 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-green-200 hover:border-green-300'
                }`}
                onClick={() => !appliedPromoCode && onPromoCodeSelect(promo.code)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 font-mono text-xs">
                          {promo.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatDiscount(promo)}
                        </Badge>
                        {promo.usageType === 'single_use' && (
                          <Badge variant="secondary" className="text-xs">
                            Single Use
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        {promo.message}
                      </p>
                      
                      {promo.description && (
                        <p className="text-xs text-gray-500">
                          {promo.description}
                        </p>
                      )}
                      
                      {formatEndDate(promo.endDate) && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-orange-600">
                            {formatEndDate(promo.endDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {appliedPromoCode?.code === promo.code ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(promo.code);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          {copiedCode === promo.code ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Almost Available Promocodes */}
      {almostAvailablePromocodes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Unlock More Savings</span>
          </div>
          
          <div className="space-y-2">
            {almostAvailablePromocodes.map((promo) => (
              <Card 
                key={promo._id} 
                className="border-2 border-orange-200 bg-orange-50"
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-mono text-xs">
                          {promo.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-orange-300">
                          {formatDiscount(promo)}
                        </Badge>
                        {promo.usageType === 'single_use' && (
                          <Badge variant="secondary" className="text-xs">
                            Single Use
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mb-1">
                        <AlertCircle className="h-3 w-3 text-orange-500" />
                        <p className="text-sm text-orange-700 font-medium">
                          {promo.message}
                        </p>
                      </div>
                      
                      {promo.description && (
                        <p className="text-xs text-gray-600">
                          {promo.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-orange-600 mt-1">
                        Save ₹{promo.potentialDiscount} when you reach ₹{promo.minOrderAmount}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(promo.code)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedCode === promo.code ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}