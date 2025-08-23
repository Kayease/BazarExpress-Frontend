"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Package, 
  X,
  Loader2,
  Store
} from 'lucide-react';
import { useAppContext } from '@/components/app-provider';
import { validateCartDelivery, CartValidationResponse, formatDistance } from '@/lib/location';
import toast from 'react-hot-toast';

interface CartValidationAlertProps {
  deliveryAddress: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  onValidationChange?: (isValid: boolean, validation: CartValidationResponse | null) => void;
}

export default function CartValidationAlert({ 
  deliveryAddress, 
  onValidationChange 
}: CartValidationAlertProps) {
  const { cartItems } = useAppContext();
  
  const [validation, setValidation] = useState<CartValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Validate cart when address or cart items change
  useEffect(() => {
    if (deliveryAddress && cartItems.length > 0) {
      validateCart();
    } else {
      setValidation(null);
      onValidationChange?.(true, null);
    }
  }, [deliveryAddress, cartItems]);

  const validateCart = async () => {
    if (!deliveryAddress || cartItems.length === 0) return;

    setIsValidating(true);

    try {
      // Prepare cart items for validation
      const cartItemsForValidation = cartItems.map((item: any) => ({
        _id: item._id || item.id,
        name: item.name,
        warehouseId: item.warehouseId || item.warehouse?._id,
        quantity: item.quantity
      }));

      // Filter items that have warehouse information
      const validItems = cartItemsForValidation.filter(item => item.warehouseId);

      if (validItems.length === 0) {
        console.warn('No cart items have warehouse information');
        setValidation(null);
        onValidationChange?.(true, null);
        return;
      }

      const result = await validateCartDelivery(validItems, deliveryAddress);
      setValidation(result);
      onValidationChange?.(result.allItemsDeliverable, result);

      if (!result.allItemsDeliverable && result.undeliverableItems.length > 0) {
        toast.error(`${result.undeliverableItems.length} item(s) cannot be delivered to your address`);
      }

    } catch (error) {
      console.error('Error validating cart:', error);
      toast.error('Failed to validate cart delivery');
      setValidation(null);
      onValidationChange?.(false, null);
    } finally {
      setIsValidating(false);
    }
  };

  // Don't show anything if no address or no cart items
  if (!deliveryAddress || cartItems.length === 0) {
    return null;
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium text-blue-800">
              Validating Cart Delivery
            </p>
            <p className="text-sm text-blue-600">
              Checking if all items can be delivered to your address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No validation result yet
  if (!validation) {
    return null;
  }

  // All items deliverable - success state
  if (validation.allItemsDeliverable) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-brand-primary mt-0.5" />
            <div>
              <p className="font-medium text-green-800">
                All Items Can Be Delivered
              </p>
              <p className="text-sm text-brand-primary mt-1">
                {validation.deliverableItemCount} item(s) from {validation.validationResults.length} warehouse(s) can be delivered to your address.
              </p>
              
              {showDetails && (
                <div className="mt-3 space-y-2">
                  {validation.validationResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                      <Store className="h-3 w-3" />
                      <span className="font-medium">{result.warehouseName}</span>
                      <span>({formatDistance(result.distance)})</span>
                      <span>• {result.itemCount} item(s)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
            className="text-brand-primary hover:text-brand-primary-dark"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>
    );
  }

  // Some items not deliverable - error state
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-800">
              Some Items Cannot Be Delivered
            </p>
            <p className="text-sm text-red-600 mt-1">
              {validation.undeliverableItems.length} out of {validation.totalItemCount} item(s) cannot be delivered to your selected address.
            </p>

            {/* Undeliverable Items */}
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800 mb-2">
                Items outside delivery zone:
              </p>
              <div className="space-y-2">
                {validation.undeliverableItems.map((item, index) => (
                  <div key={index} className="bg-red-100 rounded p-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-red-800 text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-red-600">
                          From: {item.warehouseName}
                        </p>
                        <p className="text-xs text-red-600">
                          Reason: {item.reason}
                        </p>
                      </div>
                      <Package className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverable Items */}
            {validation.deliverableItemCount > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Items that can be delivered ({validation.deliverableItemCount}):
                </p>
                <div className="space-y-1">
                  {validation.validationResults
                    .filter(result => result.canDeliver)
                    .map((result, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        <span>{result.warehouseName}</span>
                        <span>({formatDistance(result.distance)})</span>
                        <span>• {result.itemCount} item(s)</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Action Suggestions */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                What you can do:
              </p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Select a delivery address within the delivery zones</li>
                <li>• Remove items that cannot be delivered</li>
                <li>• Contact support for assistance</li>
              </ul>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          {showDetails ? 'Hide' : 'Details'}
        </Button>
      </div>
    </div>
  );
}