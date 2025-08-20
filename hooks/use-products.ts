"use client";

import { useQuery } from '@tanstack/react-query';
import { monitoredCacheService as cacheService } from '@/components/performance-monitor';
import { getProductsByPincode } from '@/lib/warehouse-location';
import { ProductWithWarehouse } from '@/lib/warehouse-validation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Product {
  _id: string;
  name: string;
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
}

interface Category {
  _id: string;
  name: string;
  popular: boolean;
  showOnHome: boolean;
  hide?: boolean;
  icon?: string;
  description?: string;
  thumbnail?: string;
  productCount?: number;
  parentId?: string | null;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductSection {
  category: Category;
  products: ProductWithWarehouse[];
}

interface ProductsParams {
  pincode?: string;
  isGlobalMode?: boolean;
  searchQuery?: string;
  limit?: number;
}

// Fetch products by location
async function fetchProductsByLocation(params: ProductsParams): Promise<{
  success: boolean;
  products: ProductWithWarehouse[];
  message?: string;
}> {
  const { pincode, isGlobalMode, searchQuery, limit = 100 } = params;
  
  if (!pincode) {
    return { success: false, products: [], message: 'Pincode is required' };
  }

  const cacheKey = cacheService.generateLocationKey(
    `products_${searchQuery || 'home'}_${limit}`, 
    pincode, 
    isGlobalMode
  );
  
  // Try cache first
  const cached = cacheService.get<{ success: boolean; products: ProductWithWarehouse[] }>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use the existing getProductsByPincode function
    const mode = isGlobalMode ? 'global' : 'auto';
    const data = await getProductsByPincode(pincode, {
      limit,
      search: searchQuery,
      mode
    });

    const result = {
      success: data.success,
      products: data.products || []
    };

    // Cache for 5 minutes for search results, 10 minutes for home products
    const cacheTime = searchQuery ? 5 * 60 * 1000 : 10 * 60 * 1000;
    cacheService.set(cacheKey, result, cacheTime);
    
    return result;
  } catch (error) {
    console.error('Error fetching products by location:', error);
    return { 
      success: false, 
      products: [], 
      message: 'Failed to fetch products' 
    };
  }
}

// Hook for home page products
export function useHomeProducts(pincode?: string, isGlobalMode?: boolean) {
  const cacheKey = cacheService.generateLocationKey('home_products', pincode, isGlobalMode);
  
  return useQuery({
    queryKey: ['home-products', pincode, isGlobalMode],
    queryFn: async () => {
      if (!pincode) {
        return [];
      }

      // Get products by location using the correct function
      const locationProducts = await fetchProductsByLocation({
        pincode,
        isGlobalMode,
        limit: 100
      });

      if (!locationProducts.success || locationProducts.products.length === 0) {
        return [];
      }

      // Fetch categories to organize products
      const categoriesResponse = await fetch(`${API_URL}/categories`);
      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories');
      }
      const categoriesData = await categoriesResponse.json();

      // Find all parent categories with showOnHome = true
      const homeCategories = categoriesData.filter((category: Category) =>
        category.showOnHome === true && (!category.parentId || category.parentId === "")
      );

      // Build a map of parentId -> subcategories
      const subcategoriesByParent: { [parentId: string]: string[] } = {};
      categoriesData.forEach((cat: Category) => {
        if (cat.parentId) {
          if (!subcategoriesByParent[cat.parentId]) subcategoriesByParent[cat.parentId] = [];
          subcategoriesByParent[cat.parentId].push(cat._id);
        }
      });

      // Organize products by category
      const productSections: ProductSection[] = homeCategories.map((parentCat: Category) => {
        // Get all subcategory IDs for this parent
        const subcatIds = subcategoriesByParent[parentCat._id] || [];
        // Include parent category ID as well
        const allCatIds = [parentCat._id, ...subcatIds];
        
        // Filter products for this category and its subcategories
        const catProducts = locationProducts.products.filter((product: ProductWithWarehouse) => {
          if (!product.category) return false;
          const categoryId = typeof product.category === 'object' ? product.category._id : product.category;
          return allCatIds.includes(categoryId);
        });
        
        // Shuffle and pick up to 15 random products
        const shuffled = [...catProducts].sort(() => 0.5 - Math.random());
        const selectedProducts = shuffled.slice(0, 15);
        
        return {
          category: parentCat,
          products: selectedProducts
        };
      }).filter((section: ProductSection) => section.products.length > 0);

      return productSections;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    enabled: !!pincode,
    // Use cached data as initial data if available
    initialData: () => {
      const cached = cacheService.get<ProductSection[]>(cacheKey);
      return cached || undefined;
    },
  });
}

// Hook for search products
export function useSearchProducts(searchQuery: string, pincode?: string, isGlobalMode?: boolean) {
  const cacheKey = cacheService.generateLocationKey(`search_${searchQuery}`, pincode, isGlobalMode);
  
  return useQuery({
    queryKey: ['search-products', searchQuery, pincode, isGlobalMode],
    queryFn: async () => {
      if (!searchQuery.trim() || !pincode) {
        return [];
      }

      const locationProducts = await fetchProductsByLocation({
        pincode,
        isGlobalMode,
        searchQuery,
        limit: 50
      });

      if (!locationProducts.success) {
        return [];
      }

      // Create a single section with search results
      const searchSection: ProductSection = {
        category: {
          _id: 'search',
          name: `Search Results for "${searchQuery}"`,
          popular: false,
          showOnHome: false,
          parentId: null,
          hide: false
        },
        products: locationProducts.products
      };

      return [searchSection];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for search results
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    enabled: !!searchQuery.trim() && !!pincode,
    // Use cached data as initial data if available
    initialData: () => {
      const cached = cacheService.get<ProductSection[]>(cacheKey);
      return cached || undefined;
    },
  });
}