import axios from 'axios';
import { getToken, handleAuthError } from '../auth-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with auth header
const createAuthAxios = () => {
  const token = getToken();
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      handleAuthError(error);
      return Promise.reject(error);
    }
  );

  return instance;
};

export interface WishlistItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    rating?: number;
    [key: string]: any;
  };
  addedAt: string;
}

export interface WishlistResponse {
  wishlist: WishlistItem[];
  message?: string;
}

// Get user's wishlist from database
export const getWishlistFromDB = async (): Promise<WishlistResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  const api = createAuthAxios();
  const response = await api.get('/wishlist');
  return response.data;
};

// Add item to wishlist in database
export const addToWishlistDB = async (productId: string): Promise<WishlistResponse> => {
  const api = createAuthAxios();
  const response = await api.post('/wishlist/add', { productId });
  return response.data;
};

// Remove item from wishlist in database
export const removeFromWishlistDB = async (productId: string): Promise<WishlistResponse> => {
  const api = createAuthAxios();
  const response = await api.delete(`/wishlist/remove/${productId}`);
  return response.data;
};

// Clear entire wishlist in database
export const clearWishlistDB = async (): Promise<WishlistResponse> => {
  const api = createAuthAxios();
  const response = await api.delete('/wishlist/clear');
  return response.data;
};

// Sync local wishlist with database wishlist
export const syncWishlistDB = async (localWishlist: any[]): Promise<WishlistResponse> => {
  const api = createAuthAxios();
  const response = await api.post('/wishlist/sync', { localWishlist });
  return response.data;
};

// Check if item is in wishlist
export const isInWishlistDB = async (productId: string): Promise<{ isInWishlist: boolean }> => {
  const api = createAuthAxios();
  const response = await api.get(`/wishlist/check/${productId}`);
  return response.data;
};