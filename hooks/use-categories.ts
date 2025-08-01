"use client";

import { useQuery } from '@tanstack/react-query';
import { monitoredCacheService as cacheService } from '@/components/performance-monitor';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Category {
  _id: string;
  name: string;
  thumbnail?: string;
  showOnHome: boolean;
  hide: boolean;
  sortOrder: number;
  parentId?: string;
  popular?: boolean;
  icon?: string;
  description?: string;
  productCount?: number;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Fetch function for categories
async function fetchCategories(): Promise<Category[]> {
  const cacheKey = 'categories';
  
  // Try cache first
  const cached = cacheService.get<Category[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  const visibleCategories = data
    .filter((cat: Category) => {
      // Only show categories that are not hidden and are parent categories
      return !cat.hide && (!cat.parentId || cat.parentId === "");
    })
    .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);

  // Cache the result for 15 minutes (categories don't change often)
  cacheService.set(cacheKey, visibleCategories, 15 * 60 * 1000);
  
  return visibleCategories;
}

export function useCategories() {
  const cacheKey = 'categories';
  
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    // Use cached data as initial data if available
    initialData: () => {
      const cached = cacheService.get<Category[]>(cacheKey);
      return cached || undefined;
    },
  });
}

// Hook for all categories (including subcategories) - used for product organization
export function useAllCategories() {
  const cacheKey = 'all_categories';
  
  return useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      // Try cache first
      const cached = cacheService.get<Category[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch all categories');
      }

      const data = await response.json();
      
      // Cache the result for 15 minutes
      cacheService.set(cacheKey, data, 15 * 60 * 1000);
      
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    // Use cached data as initial data if available
    initialData: () => {
      const cached = cacheService.get<Category[]>(cacheKey);
      return cached || undefined;
    },
  });
}