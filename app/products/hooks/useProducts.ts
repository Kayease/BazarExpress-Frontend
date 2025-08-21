import { useState, useEffect, useCallback } from 'react';
import { useProductsByLocation } from '@/hooks/use-api';
import { useLocation } from '@/components/location-provider';

interface ProductsParams {
  category?: string;
  subcategory?: string;
  search?: string;
  brand?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
}

export function useProducts(params: ProductsParams) {
  const { locationState } = useLocation();
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  
  // Debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[useProducts] ${message}`, data || '');
  };

  // Parse parameters
  const apiParams = {
    category: params.category,
    subcategory: params.subcategory,
    search: params.search,
    brand: params.brand?.split(','),
    sort: params.sort || 'relevance',
    minPrice: parseInt(params.minPrice || '10'),
    maxPrice: parseInt(params.maxPrice || '100000'),
    page,
    limit: 24,
    mode: locationState?.isGlobalMode ? 'global' : 'auto'
  };

  // Log current state
  useEffect(() => {
    logDebug('Parameters updated', { 
      category: params.category, 
      subcategory: params.subcategory,
      search: params.search,
      brand: params.brand,
      page
    });
  }, [params, page]);

  // API call with React Query
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    isFetching
  } = useProductsByLocation(
    locationState?.pincode || '000000',
    apiParams
  );

  // Reset products when parameters change
  useEffect(() => {
    logDebug('Resetting products due to parameter change');
    setIsResetting(true);
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
  }, [
    params.category,
    params.subcategory,
    params.search,
    params.brand,
    params.sort,
    params.minPrice,
    params.maxPrice,
    locationState?.pincode,
    locationState?.isGlobalMode
  ]);

  // Process API response
  useEffect(() => {
    if (productsData?.success && Array.isArray(productsData.products)) {
      logDebug('Products received from API', { 
        count: productsData.products.length,
        isReset: isResetting,
        page,
        category: params.category,
        subcategory: params.subcategory
      });
      
      // Filter products by category/subcategory if needed
      // This is a safety measure in case the API doesn't filter correctly
      let filteredProducts = productsData.products;
      
      // Additional client-side filtering for subcategories
      if (params.subcategory) {
        logDebug('Applying client-side subcategory filter', {
          subcategoryId: params.subcategory,
          productsBeforeFilter: filteredProducts.length
        });
        
        // Ensure subcategory filtering is applied
        filteredProducts = filteredProducts.filter(product => {
          // Check if product belongs to this subcategory
          if (typeof product.subcategory === 'string') {
            return product.subcategory === params.subcategory;
          } else if (product.subcategory && typeof product.subcategory === 'object') {
            return product.subcategory._id === params.subcategory;
          }
          return false;
        });
        
        logDebug('After subcategory filtering', {
          productsAfterFilter: filteredProducts.length
        });
      }
      // When category is selected but no subcategory (All Subcategories view)
      else if (params.category) {
        logDebug('Applying client-side category filter', {
          categoryId: params.category,
          productsBeforeFilter: filteredProducts.length
        });
        
        // Ensure category filtering is applied
        filteredProducts = filteredProducts.filter(product => {
          // Check if product belongs to this category
          if (typeof product.category === 'string') {
            return product.category === params.category;
          } else if (product.category && typeof product.category === 'object') {
            return product.category._id === params.category;
          }
          return false;
        });
        
        logDebug('After category filtering', {
          productsAfterFilter: filteredProducts.length
        });
      }
      
      if (isResetting || page === 1) {
        // Replace all products on first page or reset
        setAllProducts(filteredProducts);
        setIsResetting(false);
      } else {
        // Append products on subsequent pages
        setAllProducts(prev => [...prev, ...filteredProducts]);
      }
      
      // Check if there are more products
      setHasMore(filteredProducts.length === 24);
    } else if (productsData?.success === false) {
      logDebug('API returned error', productsData);
      setAllProducts([]);
      setHasMore(false);
    }
  }, [productsData, isResetting, page, params.category, params.subcategory]);

  // Error logging
  useEffect(() => {
    if (productsError) {
      logDebug('Error fetching products', { 
        error: productsError,
        message: productsError.message
      });
    }
  }, [productsError]);

  // Load more products
  const loadMore = useCallback(() => {
    if (!productsLoading && !isFetching && hasMore) {
      logDebug('Loading more products', { currentPage: page });
      setPage(prev => prev + 1);
    }
  }, [productsLoading, isFetching, hasMore, page]);

  // Force refetch (useful after navigation)
  const forceRefetch = useCallback(() => {
    logDebug('Force refetching products');
    refetchProducts();
  }, [refetchProducts]);

  return {
    products: allProducts,
    isLoading: productsLoading || isFetching,
    error: productsError,
    hasMore,
    loadMore,
    forceRefetch
  };
}