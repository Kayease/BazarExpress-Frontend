/**
 * Centralized warehouse validation utility
 * 
 * This utility provides warehouse conflict detection logic
 * that can be used across all product components.
 */

export interface WarehouseInfo {
  _id: string;
  name: string;
  deliverySettings?: {
    is24x7Delivery?: boolean;
    deliveryHours?: {
      start: string;
      end: string;
    };
  };
}

export interface ProductWithWarehouse {
  _id: string;
  name: string;
  warehouse?: WarehouseInfo;
}

export interface CartItemWithWarehouse {
  id?: string;
  _id?: string;
  warehouse?: WarehouseInfo;
  quantity: number;
}

/**
 * Check if a warehouse is a global warehouse (24x7 delivery)
 */
export function isGlobalWarehouse(warehouse: WarehouseInfo): boolean {
  return warehouse.deliverySettings?.is24x7Delivery === true;
}

/**
 * Find the first custom warehouse in cart items
 */
export function findCustomWarehouseInCart(cartItems: CartItemWithWarehouse[]): WarehouseInfo | null {
  for (const cartItem of cartItems) {
    if (cartItem.warehouse && !isGlobalWarehouse(cartItem.warehouse)) {
      return cartItem.warehouse;
    }
  }
  return null;
}

/**
 * Validate if a product can be added to cart based on warehouse rules
 */
export function validateWarehouseCompatibility(
  product: ProductWithWarehouse, 
  cartItems: CartItemWithWarehouse[]
): {
  isValid: boolean;
  error?: string;
  existingWarehouse?: WarehouseInfo;
} {
  // Empty cart - can add anything
  if (cartItems.length === 0) {
    return { isValid: true };
  }

  // Product has no warehouse info - allow (fallback)
  if (!product.warehouse) {
    return { isValid: true };
  }

  // Find existing custom warehouse in cart
  const existingCustomWarehouse = findCustomWarehouseInCart(cartItems);

  // No custom warehouse in cart - can add anything
  if (!existingCustomWarehouse) {
    console.log('validateWarehouseCompatibility: Allowing - no custom warehouse in cart');
    return { isValid: true };
  }

  // Product is from global warehouse - can add to any cart
  if (isGlobalWarehouse(product.warehouse)) {
    console.log('validateWarehouseCompatibility: Allowing - product is from global warehouse');
    return { isValid: true };
  }

  // Product is from same custom warehouse - can add
  if (existingCustomWarehouse._id === product.warehouse._id) {
    console.log('validateWarehouseCompatibility: Allowing - product is from same warehouse', {
      warehouseName: existingCustomWarehouse.name
    });
    return { isValid: true };
  }

  // Different custom warehouse - conflict
  console.log('validateWarehouseCompatibility: Blocking - different custom warehouses', {
    existingWarehouse: existingCustomWarehouse.name,
    productWarehouse: product.warehouse.name
  });
  
  return {
    isValid: false,
    error: `Your cart has items from "${existingCustomWarehouse.name}". Clear cart or choose products from the same warehouse.`,
    existingWarehouse: existingCustomWarehouse
  };
}

/**
 * Simple warehouse validation function for components
 */
export function canAddToCart(product: any, cartItems: any[]): boolean {
  if (!product || !cartItems) return true;
  if (!product.warehouse || !product.warehouse._id) return true;
  
  // Check if cart items have valid warehouse information
  const validCartItems = cartItems.filter(item => 
    item.warehouse && 
    item.warehouse._id && 
    item.warehouse.name
  );
  
  // If no cart items have valid warehouse info, allow adding products
  if (validCartItems.length === 0) {
    console.log('canAddToCart: Allowing - no cart items with valid warehouse info');
    return true;
  }
  
  // Convert to expected format
  const productForValidation: ProductWithWarehouse = {
    _id: product.id || product._id,
    name: product.name,
    warehouse: product.warehouse
  };

  const cartItemsForValidation: CartItemWithWarehouse[] = cartItems.map(item => ({
    id: item.id,
    _id: item._id,
    warehouse: item.warehouse,
    quantity: item.quantity
  }));

  const validation = validateWarehouseCompatibility(productForValidation, cartItemsForValidation);
  
  // Only log when there's a conflict
  if (!validation.isValid) {
    console.log('canAddToCart: Blocking product due to warehouse conflict:', {
      productName: product.name,
      productWarehouse: product.warehouse?.name,
      existingWarehouse: validation.existingWarehouse?.name,
      error: validation.error
    });
  }
  
  return validation.isValid;
}

/**
 * Get warehouse conflict information for display
 */
export function getWarehouseConflictInfo(product: any, cartItems: any[]): {
  hasConflict: boolean;
  message?: string;
  existingWarehouse?: string;
} {
  if (!product || !cartItems) {
    return { hasConflict: false };
  }

  const productForValidation: ProductWithWarehouse = {
    _id: product.id || product._id,
    name: product.name,
    warehouse: product.warehouse
  };

  const cartItemsForValidation: CartItemWithWarehouse[] = cartItems.map(item => ({
    id: item.id,
    _id: item._id,
    warehouse: item.warehouse,
    quantity: item.quantity
  }));

  const validation = validateWarehouseCompatibility(productForValidation, cartItemsForValidation);
  
  return {
    hasConflict: !validation.isValid,
    message: validation.error,
    existingWarehouse: validation.existingWarehouse?.name
  };
}