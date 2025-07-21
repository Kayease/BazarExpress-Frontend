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
}

export function removeFromCart(productId: string) {
  const items = getCartItems().filter((item) => item.id !== productId);
  setCartItems(items);
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
  }
}

export function clearCart() {
  setCartItems([]);
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