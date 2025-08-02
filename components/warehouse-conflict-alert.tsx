/**
 * Warehouse Conflict Alert Component
 * 
 * Displays warnings and information about warehouse conflicts in the cart.
 * Shows users which warehouses their cart items are from and explains
 * the warehouse mixing rules.
 */

"use client";

import React from 'react';
import { AlertTriangle, Store, Globe, ShoppingCart, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WarehouseInfo, getWarehouseTypeLabel, isGlobalWarehouse } from '@/lib/warehouse-validation';

interface WarehouseConflictAlertProps {
  existingWarehouse: WarehouseInfo;
  conflictingWarehouse: WarehouseInfo;
  onClearCart?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function WarehouseConflictAlert({
  existingWarehouse,
  conflictingWarehouse,
  onClearCart,
  onDismiss,
  className = ''
}: WarehouseConflictAlertProps) {
  const existingType = getWarehouseTypeLabel(existingWarehouse);
  const conflictingType = getWarehouseTypeLabel(conflictingWarehouse);

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium mb-2">Cannot mix products from different warehouses</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {isGlobalWarehouse(existingWarehouse) ? (
                  <Globe className="h-3 w-3 text-blue-600" />
                ) : (
                  <Store className="h-3 w-3 text-green-600" />
                )}
                <span>Your cart: <strong>{existingWarehouse.name}</strong> ({existingType})</span>
              </div>
              <div className="flex items-center gap-2">
                {isGlobalWarehouse(conflictingWarehouse) ? (
                  <Globe className="h-3 w-3 text-blue-600" />
                ) : (
                  <Store className="h-3 w-3 text-green-600" />
                )}
                <span>Trying to add: <strong>{conflictingWarehouse.name}</strong> ({conflictingType})</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {onClearCart && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClearCart}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Clear Cart
                </Button>
              )}
            </div>
          </div>
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-orange-600 hover:bg-orange-100 p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface WarehouseInfoDisplayProps {
  cartItems: any[];
  className?: string;
}

export function WarehouseInfoDisplay({ cartItems, className = '' }: WarehouseInfoDisplayProps) {
  // Group items by warehouse
  const warehouseGroups = cartItems.reduce((groups: any, item: any) => {
    const warehouse = item.warehouse || item.productId?.warehouse;
    if (!warehouse) return groups;
    
    const warehouseId = warehouse._id;
    if (!groups[warehouseId]) {
      groups[warehouseId] = {
        warehouse,
        items: []
      };
    }
    groups[warehouseId].items.push(item);
    return groups;
  }, {});

  const warehouseList = Object.values(warehouseGroups) as any[];

  if (warehouseList.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Cart Warehouses</h4>
      <div className="space-y-2">
        {warehouseList.map((group: any) => (
          <div key={group.warehouse._id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isGlobalWarehouse(group.warehouse) ? (
                <Globe className="h-3 w-3 text-blue-600" />
              ) : (
                <Store className="h-3 w-3 text-green-600" />
              )}
              <span className="font-medium">{group.warehouse.name}</span>
              <span className="text-gray-500">({getWarehouseTypeLabel(group.warehouse)})</span>
            </div>
            <span className="text-gray-600">{group.items.length} item(s)</span>
          </div>
        ))}
      </div>
      {warehouseList.length > 1 && (
        <div className="mt-2 text-xs text-gray-600">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          Multiple warehouses detected. This may affect delivery options.
        </div>
      )}
    </div>
  );
}