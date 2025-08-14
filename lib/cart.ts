import cartTracker from './cartTracker';

// This file is now deprecated. Use cartSlice and Redux for all cart operations.

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  brand?: string;
  weight?: string;
  [key: string]: any;
}

// Helper function to convert cart items to the format expected by cartTracker
function mapCartItemsForTracking(items: CartItem[]) {
  return items.map(item => ({
    productId: item.id,
    productName: item.name,
    productImage: item.image,
    price: item.price,
    quantity: item.quantity
  }));
}

const CART_KEY = 'cart';

export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const cartStr = localStorage.getItem(CART_KEY);
  return cartStr ? JSON.parse(cartStr) : [];
}

export function setCartItems(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(product: CartItem) {
  const items = getCartItems();
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...product, quantity: 1 });
  }
  setCartItems(items);
  
  // Track cart for unregistered users
  try {
    const mappedItems = mapCartItemsForTracking(items);
    cartTracker.trackCartUpdate(mappedItems);
  } catch (error) {
    console.error('Failed to track cart for unregistered user:', error);
  }
}

export function removeFromCart(productId: string) {
  const items = getCartItems().filter((item) => item.id !== productId);
  setCartItems(items);
  
  // Track cart for unregistered users
  try {
    const mappedItems = mapCartItemsForTracking(items);
    cartTracker.trackCartUpdate(mappedItems);
  } catch (error) {
    console.error('Failed to track cart for unregistered user:', error);
  }
}

export function updateCartQuantity(productId: string, quantity: number) {
  const items = getCartItems();
  const item = items.find((item) => item.id === productId);
  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      return removeFromCart(productId);
    }
    setCartItems(items);
    
    // Track cart for unregistered users
    try {
      const mappedItems = mapCartItemsForTracking(items);
      cartTracker.trackCartUpdate(mappedItems);
    } catch (error) {
      console.error('Failed to track cart for unregistered user:', error);
    }
  }
}

export function clearCart() {
  setCartItems([]);
  
  // Track cart clear for unregistered users
  try {
    cartTracker.trackCartClear();
  } catch (error) {
    console.error('Failed to track cart clear for unregistered user:', error);
  }
}

export function getCartTotals() {
  const items = getCartItems();
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = itemsTotal > 500 ? 0 : 25; // Free delivery over 500
  const handlingCharge = 2;
  const tax = Math.round(itemsTotal * 0.05); // 5% tax
  const grandTotal = itemsTotal + deliveryCharge + handlingCharge + tax;
  return { itemsTotal, deliveryCharge, handlingCharge, tax, grandTotal };
}

export function getCartCount(): number {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
} 