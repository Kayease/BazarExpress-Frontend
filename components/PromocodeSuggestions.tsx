/**
 * PromocodeSuggestions Component
 * 
 * This component displays smart promocode suggestions after the "View available offers" section:
 * 1. Shows ALL active applicable promocodes (sorted by highest discount first)
 * 2. Shows only ONE nearest promocode that can be unlocked with minimal additional cart value
 * 
 * Features:
 * - Automatically fetches and filters ONLY ACTIVE (non-expired) promocodes
 * - Displays all applicable promocodes sorted by potential discount
 * - Shows only the nearest almost-available promocode
 * - Allows users to copy promocode or directly apply it
 * - Responsive design with appropriate styling for each type
 * - Proper date validation to exclude expired promocodes
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tag, 
  TrendingUp, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Gift,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PromocodeSuggestionsProps {
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
  startDate?: string;
  status: 'applicable' | 'almost_available';
  message: string;
  amountNeeded?: number;
  isActive?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PromocodeSuggestions({
  cartTotal,
  cartItems,
  userId,
  onPromoCodeSelect,
  appliedPromoCode
}: PromocodeSuggestionsProps) {
  const [applicablePromos, setApplicablePromos] = useState<PromoCode[]>([]);
  const [nearestPromo, setNearestPromo] = useState<PromoCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string>('');



  // Helper function to check if a promocode is active (not expired)
  const isPromoCodeActive = (promo: PromoCode): boolean => {
    const now = new Date();
    
    // Check if explicitly marked as inactive
    if (promo.isActive === false) {
      return false;
    }
    
    // Check start date
    if (promo.startDate) {
      const startDate = new Date(promo.startDate);
      if (now < startDate) {
        return false;
      }
    }
    
    // Check end date
    if (promo.endDate) {
      const endDate = new Date(promo.endDate);
      if (now > endDate) {
        return false;
      }
    }
    
    return true;
  };

  const fetchPromocodeSuggestions = async () => {
    // Don't return early if cartTotal is 0, as promocodes might still be available
    if (!API_URL) {
      console.warn('API_URL not configured, skipping promocode fetch');
      setApplicablePromos([]);
      setNearestPromo(null);
      return;
    }
    
    
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        cartTotal: Math.max(0, cartTotal).toString(), // Ensure cartTotal is never negative
        ...(userId && { userId }),
        cartItems: JSON.stringify(cartItems.map(item => ({
          productId: item.id || item._id,
          categoryId: item.categoryId || item.category?._id || item.category,
          brandId: item.brandId || item.brand?._id || item.brand,
          quantity: item.quantity,
          price: item.price,
          codAvailable: item.codAvailable
        })))
      });

      const response = await fetch(`${API_URL}/promocodes/available?${params}`);
      
              if (!response.ok) {
          setApplicablePromos([]);
          setNearestPromo(null);
          return;
        }
      
              const data = await response.json();
        
        // Check if we have valid data
        if (!data || typeof data !== 'object') {
          setApplicablePromos([]);
          setNearestPromo(null);
          return;
        }
        
        // Filter and get all active applicable promocodes (limit to top 3 to avoid UI clutter)
        const availablePromocodes = data.available || [];
        
        const activeApplicablePromocodes = availablePromocodes
        .filter((promo: PromoCode) => isPromoCodeActive(promo))
        .sort((a: PromoCode, b: PromoCode) => {
          // Sort by potential discount (highest first)
          const aDiscount = a.potentialDiscount || 0;
          const bDiscount = b.potentialDiscount || 0;
          return bDiscount - aDiscount;
        })
        .slice(0, 3); // Limit to top 3 applicable promocodes
      
              setApplicablePromos(activeApplicablePromocodes);
        
        // Get the nearest active almost available promocode (lowest amount needed)
        const almostAvailablePromocodes = data.almostAvailable || [];
        
        const activeAlmostAvailablePromocodes = almostAvailablePromocodes
        .filter((promo: PromoCode) => isPromoCodeActive(promo));
      
              if (activeAlmostAvailablePromocodes.length > 0) {
          const nearestAvailable = activeAlmostAvailablePromocodes.reduce((nearest: PromoCode, current: PromoCode) => {
            const nearestAmount = nearest.amountNeeded || ((nearest.minOrderAmount || 0) - cartTotal);
            const currentAmount = current.amountNeeded || ((current.minOrderAmount || 0) - cartTotal);
            return currentAmount < nearestAmount && currentAmount > 0 ? current : nearest;
          });
          setNearestPromo(nearestAvailable);
        } else {
          setNearestPromo(null);
        }
      
    } catch (error) {
      setApplicablePromos([]);
      setNearestPromo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromocodeSuggestions();
  }, [cartTotal, cartItems, userId]);

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

  // Show loading state
  if (loading) {
    return (
      <div className="mt-3">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Don't render if no suggestions available
  if (applicablePromos.length === 0 && !nearestPromo) {
    // Show a helpful message instead of nothing
    return (
      <div className="mt-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600">
            {loading ? 'Loading offers...' : 'No offers available at the moment'}
          </p>
          {!loading && (
            <p className="text-xs text-gray-500 mt-1">
              Check back later for new promocodes
            </p>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {/* All Applicable Promocodes */}
      {applicablePromos.length > 0 && (
        <div className="space-y-2">
          {applicablePromos.map((promo, index) => {
            const isCurrentlyApplied = appliedPromoCode && appliedPromoCode.code === promo.code;
            return (
              <Card 
                key={promo._id} 
                className={`border-2 transition-all ${
                  isCurrentlyApplied 
                    ? 'border-green-300 bg-green-50 cursor-default' 
                    : 'border-brand-primary/20 bg-brand-primary/5 cursor-pointer hover:shadow-md hover:border-brand-primary/30 hover:bg-brand-primary/10'
                }`}
                onClick={() => !isCurrentlyApplied && onPromoCodeSelect(promo.code)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className={`h-3 w-3 ${isCurrentlyApplied ? 'text-green-600' : 'text-brand-primary'}`} />
                        <span className={`text-xs font-medium ${isCurrentlyApplied ? 'text-green-600' : 'text-brand-primary'}`}>
                          {isCurrentlyApplied ? 'Currently Applied' : (index === 0 ? 'Best Offer Available' : 'Available Offer')}
                        </span>
                      </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={`font-mono text-xs ${
                        isCurrentlyApplied 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                      }`}>
                        {promo.code}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${
                        isCurrentlyApplied 
                          ? 'border-green-300 text-green-700' 
                          : 'border-brand-primary/30 text-brand-primary'
                      }`}>
                        {formatDiscount(promo)}
                      </Badge>
                      {promo.usageType === 'single_use' && (
                        <Badge variant="secondary" className={`text-xs ${
                          isCurrentlyApplied 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-brand-primary/5 text-brand-primary border-brand-primary/20'
                        }`}>
                          Single Use
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs ${isCurrentlyApplied ? 'text-green-700' : 'text-brand-primary'}`}>
                      {isCurrentlyApplied ? 'Applied - ' : ''}Save ₹{promo.potentialDiscount} on this order
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(promo.code);
                      }}
                      className={`h-6 w-6 p-0 ${
                        isCurrentlyApplied 
                          ? 'hover:bg-green-100' 
                          : 'hover:bg-brand-primary/10'
                      }`}
                    >
                      {copiedCode === promo.code ? (
                        <CheckCircle className={`h-3 w-3 ${isCurrentlyApplied ? 'text-green-600' : 'text-brand-primary'}`} />
                      ) : (
                        <Copy className={`h-3 w-3 ${isCurrentlyApplied ? 'text-green-600' : 'text-brand-primary'}`} />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Nearest Promocode */}
      {nearestPromo && (
        <Card className="border-2 border-brand-primary-dark/20 bg-brand-primary-dark/5 hover:border-brand-primary-dark/30 hover:bg-brand-primary-dark/10 transition-all">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3 w-3 text-brand-primary-dark" />
                  <span className="text-xs font-medium text-brand-primary-dark">Add More to Save</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="bg-brand-primary-dark/10 text-brand-primary-dark font-mono text-xs border-brand-primary-dark/20">
                    {nearestPromo.code}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-brand-primary-dark/30 text-brand-primary-dark">
                    {formatDiscount(nearestPromo)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Plus className="h-3 w-3 text-brand-primary-dark" />
                  <p className="text-xs text-brand-primary-dark">
                    Add ₹{(nearestPromo.minOrderAmount || 0) - cartTotal} more to save ₹{nearestPromo.potentialDiscount}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(nearestPromo.code)}
                className="h-6 w-6 p-0 hover:bg-brand-primary-dark/10"
              >
                {copiedCode === nearestPromo.code ? (
                  <CheckCircle className="h-3 w-3 text-brand-primary" />
                ) : (
                  <Copy className="h-3 w-3 text-brand-primary-dark" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}