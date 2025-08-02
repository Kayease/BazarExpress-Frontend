/**
 * Hook for warehouse validation in product components
 * 
 * This hook provides utilities to check warehouse conflicts
 * before adding products to cart, enabling better UI states.
 */

import { useMemo } from 'react';
import { useCartContext } from '@/components/app-provider';
import { 
  validateWarehouseCompatibility, 
  findCustomWarehouseInCart,
  isGlobalWarehouse,
  type ProductWithWarehouse,
  type CartItemWithWarehouse 
} from '@/lib/warehouse-validation';

export interface WarehouseValidationHook {
  canAddToCart: (product: any) => boolean;
  getWarehouseConflictInfo: (product: any) => {
    hasConflict: boolean;
    existingWarehouse?: string;
    productWarehouse?: string;
    message?: string;
  };
  currentCartWarehouse: string | null;
  isCartEmpty: boolean;
  hasCustomWarehouseInCart: boolean;
}

export function useWarehouseValidation(): WarehouseValidationHook {
  const { cartItems } = useCartContext();

  // Convert cart items to the format expected by validation functions
  const cartItemsForValidation: CartItemWithWarehouse[] = useMemo(() => {
    return cartItems.map(item => ({
      productId: {
        _id: item.id || item._id,
        name: item.name,
        warehouse: item.warehouse
      },
      quantity: item.quantity
    }));
  }, [cartItems]);

  // Find current custom warehouse in cart
  const currentCustomWarehouse = useMemo(() => {
    return findCustomWarehouseInCart(cartItemsForValidation);
  }, [cartItemsForValidation]);

  // Check if product can be added to cart
  const canAddToCart = (product: any): boolean => {
    if (!product || !product.warehouse) return false;
    
    const productForValidation: ProductWithWarehouse = {
      _id: product.id || product._id,
      name: product.name,
      warehouse: product.warehouse
    };

    const validation = validateWarehouseCompatibility(productForValidation, cartItemsForValidation);
    return validation.isValid;
  };

  // Get detailed conflict information
  const getWarehouseConflictInfo = (product: any) => {
    if (!product || !product.warehouse) {
      return {
        hasConflict: true,
        message: 'Product warehouse information not available'
      };
    }

    const productForValidation: ProductWithWarehouse = {
      _id: product.id || product._id,
      name: product.name,
      warehouse: product.warehouse
    };

    const validation = validateWarehouseCompatibility(productForValidation, cartItemsForValidation);
    
    return {
      hasConflict: !validation.isValid,
      existingWarehouse: validation.existingWarehouse?.name,
      productWarehouse: product.warehouse.name,
      message: validation.error
    };
  };

  return {
    canAddToCart,
    getWarehouseConflictInfo,
    currentCartWarehouse: currentCustomWarehouse?.name || null,
    isCartEmpty: cartItems.length === 0,
    hasCustomWarehouseInCart: !!currentCustomWarehouse
  };
}

/**
 * Hook specifically for product cards to determine UI states
 */
export function useProductCardState(product: any) {
  const { cartItems } = useCartContext();
  const validation = useWarehouseValidation();

  // Check if product is already in cart
  const cartItem = cartItems.find(item => 
    (item.id || item._id) === (product.id || product._id)
  );
  
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;
  
  // Check if product can be added (warehouse validation)
  const canAdd = validation.canAddToCart(product);
  const conflictInfo = validation.getWarehouseConflictInfo(product);

  // Determine button state
  let buttonState: 'add' | 'quantity' | 'disabled' = 'add';
  let disabledReason = '';

  if (isInCart) {
    buttonState = 'quantity';
  } else if (!canAdd) {
    buttonState = 'disabled';
    disabledReason = conflictInfo.message || 'Cannot add to cart';
  }

  return {
    quantity,
    isInCart,
    canAdd,
    buttonState,
    disabledReason,
    conflictInfo,
    warehouseName: product.warehouse?.name,
    isGlobalWarehouse: product.warehouse ? isGlobalWarehouse(product.warehouse) : false
  };
}