"use client";

import { useQueryClient } from '@tanstack/react-query';
import { cacheService } from './cache-service';

export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    // Clear React Query cache
    queryClient.clear();
    // Clear our custom cache
    cacheService.clearAll();
  };

  const invalidateBanners = (pincode?: string, isGlobalMode?: boolean) => {
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['banners'] });
    // Clear specific cache entries
    const cacheKey = cacheService.generateLocationKey('banners', pincode, isGlobalMode);
    cacheService.clear(cacheKey);
  };

  const invalidateCategories = () => {
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    // Clear specific cache entries
    cacheService.clear('categories');
    cacheService.clear('all_categories');
  };

  const invalidateProducts = (pincode?: string, isGlobalMode?: boolean) => {
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['home-products'] });
    queryClient.invalidateQueries({ queryKey: ['search-products'] });
    
    // Clear specific cache entries
    if (pincode) {
      const homeKey = cacheService.generateLocationKey('home_products', pincode, isGlobalMode);
      cacheService.clear(homeKey);
      
      // Clear all search cache entries for this location
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(`search_`) && key.includes(pincode)) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const invalidateLocationData = (pincode?: string, isGlobalMode?: boolean) => {
    invalidateBanners(pincode, isGlobalMode);
    invalidateProducts(pincode, isGlobalMode);
  };

  const preloadData = async (pincode?: string, isGlobalMode?: boolean) => {
    if (!pincode) return;

    // Preload banners
    queryClient.prefetchQuery({
      queryKey: ['banners', pincode, isGlobalMode],
      staleTime: 10 * 60 * 1000,
    });

    // Preload categories
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      staleTime: 15 * 60 * 1000,
    });

    // Preload home products
    queryClient.prefetchQuery({
      queryKey: ['home-products', pincode, isGlobalMode],
      staleTime: 10 * 60 * 1000,
    });
  };

  return {
    invalidateAll,
    invalidateBanners,
    invalidateCategories,
    invalidateProducts,
    invalidateLocationData,
    preloadData,
  };
}

// Utility function to clear cache when user changes location
export function clearLocationCache(oldPincode?: string, newPincode?: string) {
  if (oldPincode && oldPincode !== newPincode) {
    // Clear old location cache
    const oldKeys = [
      cacheService.generateLocationKey('banners', oldPincode, true),
      cacheService.generateLocationKey('banners', oldPincode, false),
      cacheService.generateLocationKey('home_products', oldPincode, true),
      cacheService.generateLocationKey('home_products', oldPincode, false),
    ];
    
    oldKeys.forEach(key => cacheService.clear(key));
  }
}