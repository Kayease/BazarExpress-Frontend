import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with auth header
const createAuthAxios = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

export interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    brand?: string;
    weight?: string;
    [key: string]: any;
  };
  quantity: number;
  addedAt: string;
}

export interface CartResponse {
  cart: CartItem[];
  message?: string;
  error?: string;
  existingWarehouse?: string;
  newWarehouse?: string;
  validItems?: any[];
  conflictingItems?: any[];
  warning?: string;
  isPartialSync?: boolean;
}

// Get user's cart from database
export const getCartFromDB = async (): Promise<CartResponse> => {
  const api = createAuthAxios();
  const response = await api.get('/cart');
  return response.data;
};

// Add item to cart in database
export const addToCartDB = async (productId: string, quantity: number = 1): Promise<CartResponse> => {
  const api = createAuthAxios();
  try {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.error === 'WAREHOUSE_CONFLICT') {
      // Return the error data for handling in the UI
      throw {
        isWarehouseConflict: true,
        ...error.response.data
      };
    }
    throw error;
  }
};

// Update cart item quantity in database
export const updateCartItemDB = async (productId: string, quantity: number): Promise<CartResponse> => {
  const api = createAuthAxios();
  const response = await api.put('/cart/update', { productId, quantity });
  return response.data;
};

// Remove item from cart in database
export const removeFromCartDB = async (productId: string): Promise<CartResponse> => {
  const api = createAuthAxios();
  const response = await api.delete(`/cart/remove/${productId}`);
  return response.data;
};

// Clear entire cart in database
export const clearCartDB = async (): Promise<CartResponse> => {
  const api = createAuthAxios();
  const response = await api.delete('/cart/clear');
  return response.data;
};

// Sync local cart with database cart
export const syncCartDB = async (localCart: any[]): Promise<CartResponse> => {
  const api = createAuthAxios();
  try {
    const response = await api.post('/cart/sync', { localCart });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 207 && error.response?.data?.warning === 'WAREHOUSE_CONFLICT') {
      // Return partial sync data for handling in the UI
      return {
        ...error.response.data,
        isPartialSync: true
      };
    }
    throw error;
  }
};