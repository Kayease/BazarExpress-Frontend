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
  price?: number;
  unit?: string;
  image?: string;
  rating?: number;
  deliveryTime?: string;
  description?: string;
  stock?: number;
  category?: any;
  status?: string;
  brand?: any;
  sku?: string;
  mrp?: number;
  costPrice?: number;
  priceIncludesTax?: boolean;
  allowBackorders?: boolean;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: {
    l?: string;
    w?: string;
    h?: string;
  };
  returnable?: boolean;
  returnWindow?: number;
  codAvailable?: boolean;
  galleryImages?: string[];
  manufacturer?: string;
  warranty?: string;
  createdAt?: string;
  // Allow for additional product properties
  [key: string]: any;
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
  const isGlobal = warehouse.deliverySettings?.is24x7Delivery === true;
  console.log('isGlobalWarehouse check:', {
    warehouseName: warehouse.name,
    deliverySettings: warehouse.deliverySettings,
    is24x7Delivery: warehouse.deliverySettings?.is24x7Delivery,
    isGlobal
  });
  return isGlobal;
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
 * Find the first warehouse in cart items (either custom or global)
 */
export function findAnyWarehouseInCart(cartItems: CartItemWithWarehouse[]): WarehouseInfo | null {
  for (const cartItem of cartItems) {
    if (cartItem.warehouse && cartItem.warehouse._id) {
      return cartItem.warehouse;
    }
  }
  return null;
}

/**
 * Validate if a product can be added to cart based on warehouse rules
 * NEW RULE: Only products from the SAME warehouse (custom OR global) can be added to cart
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

  // Find ANY existing warehouse in cart (custom or global)
  const existingWarehouse = findAnyWarehouseInCart(cartItems);

  // No warehouse in cart - can add anything
  if (!existingWarehouse) {
    console.log('validateWarehouseCompatibility: Allowing - no warehouse in cart');
    return { isValid: true };
  }

  // Product is from same warehouse (custom or global) - can add
  if (existingWarehouse._id === product.warehouse._id) {
    console.log('validateWarehouseCompatibility: Allowing - product is from same warehouse', {
      warehouseName: existingWarehouse.name
    });
    return { isValid: true };
  }

  // Different warehouse (custom or global) - conflict
  console.log('validateWarehouseCompatibility: Blocking - different warehouses', {
    existingWarehouse: existingWarehouse.name,
    productWarehouse: product.warehouse.name,
    existingIsGlobal: isGlobalWarehouse(existingWarehouse),
    productIsGlobal: isGlobalWarehouse(product.warehouse)
  });
  
  return {
    isValid: false,
    error: `Your cart has items from "${existingWarehouse.name}". Clear cart or choose products from the same warehouse.`,
    existingWarehouse: existingWarehouse
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
   // console.log('canAddToCart: Allowing - no cart items with valid warehouse info');
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