"use client";
import { useState, useEffect, useCallback } from 'react';

interface RecentlyViewedProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  category?: any;
  brand?: any;
  timestamp: number;
  // Add variant support
  variants?: Record<string, any>;
  variantId?: string;
  variantName?: string;
  selectedVariant?: any;
  warehouse?: any;
  unit?: string;
}

const RECENTLY_VIEWED_KEY = 'recentlyViewedProducts';
const MAX_RECENT_PRODUCTS = 20;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

  // Load recently viewed products from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRecentlyViewed(parsed);
        } catch (error) {
          console.error('Error parsing recently viewed products:', error);
        }
      }
    }
  }, []);

  // Add a product to recently viewed
  const addToRecentlyViewed = useCallback((product: any) => {
    if (!product?._id) return;

    // Extract unit from variant if available, otherwise use product unit
    let unit = product.unit;
    if (product.variantId && product.variants && product.variants[product.variantId]) {
      const variant = product.variants[product.variantId];
      unit = variant.unit || product.unit;
      console.log('Extracted unit from variant:', { variantId: product.variantId, variantUnit: variant.unit, finalUnit: unit });
    } else if (product.selectedVariant && product.selectedVariant.unit) {
      unit = product.selectedVariant.unit;
      console.log('Extracted unit from selectedVariant:', { selectedVariantUnit: product.selectedVariant.unit, finalUnit: unit });
    } else {
      console.log('Using product unit:', { productUnit: product.unit, finalUnit: unit });
    }

    const productData: RecentlyViewedProduct = {
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      category: product.category,
      brand: product.brand,
      timestamp: Date.now(),
      // Include variant information if available
      variants: product.variants,
      variantId: product.variantId,
      variantName: product.variantName,
      selectedVariant: product.selectedVariant,
      warehouse: product.warehouse,
      // Include unit information (extracted from variant if available)
      unit: unit
    };

    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p._id !== product._id);
      
      // Add to beginning
      const updated = [productData, ...filtered];
      
      // Keep only max items
      const limited = updated.slice(0, MAX_RECENT_PRODUCTS);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(limited));
      }
      
      return limited;
    });
  }, []);

  // Clear recently viewed products
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    }
  }, []);

  // Get recently viewed products (excluding current product)
  const getRecentlyViewed = useCallback((excludeProductId?: string) => {
    if (excludeProductId) {
      return recentlyViewed.filter(p => p._id !== excludeProductId);
    }
    return recentlyViewed;
  }, [recentlyViewed]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    getRecentlyViewed
  };
}
