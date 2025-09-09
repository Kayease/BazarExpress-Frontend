"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartContext, useWishlistContext } from "@/components/app-provider";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useBrands } from "@/hooks/use-api";
import { useLocation } from "@/components/location-provider";

// Custom hooks
import { useQueryState } from "@/hooks/use-query-state";
import { useProducts } from "./hooks/useProducts";
import { useCategories } from "./hooks/useCategories";

// Components
import CategorySidebar from "./components/CategorySidebar";
import ProductHeader from "./components/ProductHeader";
import ProductGrid from "./components/ProductGrid";
import { ProductLoadingState } from "./components/ProductLoadingState";

// Types
import { ViewMode, Category } from "./types";

export default function ProductsPage() {
  // Debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[ProductsPage] ${message}`, data || '');
  };

  // Navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const navigationLock = useRef(false);
  const lastNavigationTime = useRef(Date.now());
  const { locationState } = useLocation();

  // URL state management
  const [category, setCategory] = useQueryState("category");
  const [subcategory, setSubcategory] = useQueryState("subcategory");
  const [search, setSearch] = useQueryState("search");
  const [brand, setBrand] = useQueryState("brand");
  const [sort, setSort] = useQueryState("sort", "relevance");
  const [minPrice, setMinPrice] = useQueryState("minPrice", "10");
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", "100000");

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  // Removed showFilters state since filters are now inline

  // Context hooks
  const { addToCart, cartItems, updateCartItem } = useCartContext();
  const { addToWishlist, isInWishlist: isProductInWishlist } = useWishlistContext();
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Custom hooks
  const { products, isLoading, error, hasMore, loadMore, forceRefetch } = useProducts({
    category,
    subcategory,
    search,
    brand,
    sort,
    minPrice,
    maxPrice
  });

  const { data: brands = [] } = useBrands();
  const { 
    categoryName, 
    subcategoryName 
  } = useCategories(category, subcategory);

  // Handle back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      logDebug('Browser navigation detected (back/forward)');
      
      // Set navigation lock
      navigationLock.current = true;
      lastNavigationTime.current = Date.now();
      
      setTimeout(() => {
        forceRefetch();
        
        // Release navigation lock after a delay
        setTimeout(() => {
          navigationLock.current = false;
          logDebug('Navigation lock released');
        }, 500);
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [forceRefetch]);
  
  // Monitor URL changes
  useEffect(() => {
    const handleURLChange = () => {
      const now = Date.now();
      const timeSinceLastNavigation = now - lastNavigationTime.current;
      
      logDebug('URL parameters changed', { 
        category, 
        subcategory,
        timeSinceLastNavigation 
      });
      
      // Update the last navigation time
      lastNavigationTime.current = now;
    };
    
    handleURLChange();
  }, [category, subcategory, search, brand, sort, minPrice, maxPrice]);
  
  // Force product refresh when category or subcategory changes
  // This is especially important when going back to parent categories
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      return;
    }
    
    logDebug('Category or subcategory changed, refreshing products', {
      category,
      subcategory,
      action: 'Force refreshing products'
    });
    
    // Force refresh products to ensure they match the current selection
    forceRefetch();
  }, [category, subcategory, forceRefetch]);

  // Log initial parameters
  useEffect(() => {
    if (isInitialMount.current) {
      logDebug('Initial parameters', {
        category,
        subcategory,
        search,
        brand,
        sort,
        minPrice,
        maxPrice
      });
      isInitialMount.current = false;
    }
  }, [category, subcategory, search, brand, sort, minPrice, maxPrice]);

  // Handle category change with debounce to prevent rapid changes
  const categoryChangeInProgress = useRef(false);
  const handleCategoryChange = useCallback((newCategory?: string) => {
    logDebug('Category changed', { from: category, to: newCategory });
    
    // Check for navigation lock
    if (navigationLock.current) {
      logDebug('Navigation lock active, delaying category change');
      setTimeout(() => handleCategoryChange(newCategory), 600);
      return;
    }
    
    // Prevent multiple rapid changes
    if (categoryChangeInProgress.current) {
      logDebug('Category change already in progress, skipping');
      return;
    }
    
    // Set lock
    categoryChangeInProgress.current = true;
    navigationLock.current = true;
    lastNavigationTime.current = Date.now();
    
    // Update state
    setCategory(newCategory);
    setSubcategory(undefined);
    
    // Reset the flags after a delay
    setTimeout(() => {
      categoryChangeInProgress.current = false;
      navigationLock.current = false;
      logDebug('Category change completed');
    }, 500);
  }, [category, setCategory, setSubcategory]);

  // Handle subcategory change
  const subcategoryChangeInProgress = useRef(false);
  const handleSubcategoryChange = useCallback((newSubcategory?: string) => {
    logDebug('Subcategory changed', { 
      from: subcategory, 
      to: newSubcategory, 
      currentCategory: category 
    });
    
    // Check for navigation lock
    if (navigationLock.current) {
      logDebug('Navigation lock active, delaying subcategory change');
      setTimeout(() => handleSubcategoryChange(newSubcategory), 600);
      return;
    }
    
    // Prevent multiple rapid changes
    if (subcategoryChangeInProgress.current) {
      logDebug('Subcategory change already in progress, skipping');
      return;
    }
    
    // Make sure we have a category selected when setting a subcategory
    if (newSubcategory && !category) {
      logDebug('Warning: Attempting to set subcategory without a category');
      // In this case, the CategorySidebar component should have set the category
    }
    
    // Set lock
    subcategoryChangeInProgress.current = true;
    
    // Update state
    setSubcategory(newSubcategory);
    
    // Reset the flag after a delay
    setTimeout(() => {
      subcategoryChangeInProgress.current = false;
      logDebug('Subcategory change completed');
    }, 500);
  }, [subcategory, category, setSubcategory]);

  // Handle filter changes
  const handleBrandChange = useCallback((brands: string[]) => {
    logDebug('Brands changed', { brands });
    setBrand(brands.length > 0 ? brands.join(',') : undefined);
  }, [setBrand]);

  const handleSortChange = useCallback((newSort: string) => {
    logDebug('Sort changed', { from: sort, to: newSort });
    setSort(newSort);
  }, [sort, setSort]);

  const handlePriceRangeChange = useCallback((min: number, max: number) => {
    logDebug('Price range changed', { from: [minPrice, maxPrice], to: [min, max] });
    setMinPrice(min.toString());
    setMaxPrice(max.toString());
  }, [minPrice, maxPrice, setMinPrice, setMaxPrice]);

  // Reset filters (only brand, sort, and price - keep category/subcategory)
  const resetFilters = useCallback(() => {
    logDebug('Resetting filters only (keeping category/subcategory)');
    logDebug('Before reset - brand state:', brand);
    
    // Force reset all filter states
    setBrand(undefined);
    setSort('relevance');
    setMinPrice('10');
    setMaxPrice('100000');
    
    logDebug('After reset - brand state set to undefined');
    
    // Force URL update to ensure brand parameter is removed
    const params = new URLSearchParams(searchParams.toString());
    params.delete('brand');
    params.delete('sort');
    params.delete('minPrice');
    params.delete('maxPrice');
    
    // Keep category and subcategory
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    
    const newUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl);
    
    logDebug('Forced URL update to:', newUrl);
    
    // Force a small delay to ensure state updates are processed
    setTimeout(() => {
      logDebug('After delay - brand state should be:', undefined);
      // Double-check if the state was actually updated
      if (brand !== undefined) {
        logDebug('Warning: Brand state was not reset properly, forcing again');
        setBrand(undefined);
      }
    }, 100);
  }, [setBrand, setSort, setMinPrice, setMaxPrice, brand, searchParams, router, category, subcategory]);

  // Reset everything including category and subcategory
  const resetAllFilters = useCallback(() => {
    logDebug('Resetting all filters including category/subcategory)');
    setBrand(undefined);
    setSort('relevance');
    setMinPrice('10');
    setMaxPrice('100000');
    setCategory(undefined);
    setSubcategory(undefined);
    setSearch(undefined);
  }, [setBrand, setSort, setMinPrice, setMaxPrice, setCategory, setSubcategory, setSearch]);

  // Handle product click
  const handleProductClick = useCallback((product: any) => {
    logDebug('Product clicked', { id: product._id, name: product.name });
    addToRecentlyViewed(product);
    router.push(`/products/${product._id}`);
  }, [addToRecentlyViewed, router]);

  // Check for active filters
  const hasActiveFilters = !!(
    brand || 
    sort !== 'relevance' || 
    parseInt(minPrice || '10') > 10 || 
    parseInt(maxPrice || '100000') < 100000
  );
  
  // Debug logging for filters
  console.log('Products page filter state:', {
    brand,
    sort,
    minPrice,
    maxPrice,
    hasActiveFilters,
    selectedBrands: brand?.split(',') || []
  });

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  // Memoize props to prevent unnecessary re-renders of ProductHeader
  const selectedBrands = useMemo(() => brand?.split(',') || [], [brand]);
  const priceRange = useMemo(() => [parseInt(minPrice || '10'), parseInt(maxPrice || '100000')] as [number, number], [minPrice, maxPrice]);
  const productsCount = useMemo(() => products.length, [products.length]);

  // Preload parent categories for sidebar immediate render
  const [initialParentCategories, setInitialParentCategories] = useState<Category[] | undefined>(undefined);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
        const res = await fetch(`${apiUrl}/categories`, { cache: 'force-cache' });
        if (res.ok) {
          const all = await res.json();
          const parents = (all as Category[]).filter(c => !c.parentId || c.parentId === '');
          if (isMounted) setInitialParentCategories(parents);
        }
      } catch {}
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-2 sm:gap-3">
          {/* Category Sidebar */}
          <CategorySidebar
            selectedCategory={category}
            selectedSubcategory={subcategory}
            onCategoryChange={handleCategoryChange}
            onSubcategoryChange={handleSubcategoryChange}
            initialParentCategories={initialParentCategories}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <ProductHeader
              category={category}
              subcategory={subcategory}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
              productsCount={productsCount}
              categoryName={categoryName}
              subcategoryName={subcategoryName}
              brands={brands}
              selectedBrands={selectedBrands}
              onBrandChange={handleBrandChange}
              sortBy={sort || 'relevance'}
              onSortChange={handleSortChange}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
            />

            <ProductLoadingState
              isLoading={isLoading && products.length === 0}
              error={error}
              isEmpty={!isLoading && products.length === 0}
              hasActiveFilters={hasActiveFilters}
              searchQuery={search}
              categoryName={categoryName}
              subcategoryName={subcategoryName}
              onClearSearch={() => setSearch(undefined)}
              onResetFilters={resetFilters}
              onStayInCategory={() => {
                // Force a refresh without changing category
                logDebug('Staying in current category', { category, subcategory });
                forceRefetch();
              }}
              onBrowseAll={() => {
                logDebug('Browsing all products');
                resetAllFilters();
              }}
            >
              <ProductGrid
                products={products}
                viewMode={viewMode}
                onProductClick={handleProductClick}
                onAddToCart={addToCart}
                onUpdateCart={updateCartItem}
                onAddToWishlist={addToWishlist}
                isInWishlist={isProductInWishlist}
                cartItems={cartItems}
              />

              {isLoading && products.length > 0 && (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse flex space-x-4">
                    <div className="h-10 w-40 bg-gray-200 rounded"></div>
                  </div>
                </div>
              )}
                
              {!isLoading && hasMore && (
                <div className="flex justify-center py-8">
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
                  >
                    Load More Products
                  </button>
                </div>
              )}
            </ProductLoadingState>
          </div>
        </div>
      </div>
    </div>
  );
}