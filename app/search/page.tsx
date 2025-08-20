"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { useLocation } from "@/components/location-provider";
import { useCartContext, useWishlistContext } from "@/components/app-provider";
import { useCategories, useBrands, useProductsByLocation } from "@/hooks/use-api";
import { canAddToCart } from "@/lib/warehouse-validation";
import { useWarehouseConflict } from "@/hooks/use-warehouse-conflict";
import { trackSearchGap, shouldTrackSearchGap } from "@/lib/search-gap-tracker";
import { useAppSelector } from "@/lib/store";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

// Components
import ProductCard from "@/components/product-card";
import ProductGridSkeleton from "@/components/product-grid-skeleton";
import WarehouseConflictModal from "@/components/warehouse-conflict-modal";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Icons
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  Grid3X3,
  List,
  Star,
  TrendingUp
} from 'lucide-react';

// Types
interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number;
}

interface FilterState {
  priceRange: [number, number];
  brands: string[];
  categories: string[];
  sortBy: string;
  viewMode: 'grid' | 'list';
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' }
];

const VIEW_MODES = [
  { value: 'grid', icon: Grid3X3 },
  { value: 'list', icon: List }
];

function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { locationState, isGlobalMode } = useLocation();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [showSkeletonOnTyping, setShowSkeletonOnTyping] = useState(false);
  const [lastSavedQuery, setLastSavedQuery] = useState("");
  
  // Search history
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    brands: [],
    categories: [],
    sortBy: 'relevance',
    viewMode: 'grid'
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState({
    main: false,
    brandDropdown: false
  });
  
  // User and location
  const user = useAppSelector((state: any) => state.auth.user);
  const activePincode = params.get("pincode") || locationState.pincode;
  const activeMode = params.get("mode") || (locationState.isGlobalMode ? 'global' : 'auto');
  
  // Warehouse conflict handling
  const {
    isModalOpen,
    conflictProduct,
    locationConflict,
    showConflictModal,
    handleClearCart,
    handleSwitchToGlobal,
    handleContinueShopping,
    closeModal
  } = useWarehouseConflict();

  // Data hooks
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  
  // Fetch products
  const { 
    data: locationProducts, 
    isLoading: productsLoading, 
    error: productsError 
  } = useProductsByLocation(
    activePincode || '',
    {
      search: searchQuery || undefined,
      category: params.get("category") || undefined,
      mode: activeMode === 'global' ? 'global' : undefined,
      limit: 100,
      page: 1
    }
  );

  // Cart & Wishlist context
  const { cartItems, addToCart, updateCartItem } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();
  
  // Recently viewed products hook
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing search history:', error);
      }
    } else {
      // Initialize with some default search history if none exists
      const defaultHistory = [
        { query: 'milk', timestamp: Date.now() - 1000, count: 1 },
        { query: 'bread', timestamp: Date.now() - 2000, count: 2 },
        { query: 'sugar', timestamp: Date.now() - 3000, count: 1 },
        { query: 'rice', timestamp: Date.now() - 4000, count: 1 },
        { query: 'oil', timestamp: Date.now() - 5000, count: 1 }
      ];
      setSearchHistory(defaultHistory);
      localStorage.setItem('searchHistory', JSON.stringify(defaultHistory));
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prevHistory => {
      const newHistory = [...prevHistory];
    const existingIndex = newHistory.findIndex(item => item.query.toLowerCase() === query.toLowerCase());
    
    if (existingIndex >= 0) {
      newHistory[existingIndex].count += 1;
      newHistory[existingIndex].timestamp = Date.now();
    } else {
      newHistory.unshift({ query, timestamp: Date.now(), count: 1 });
    }
    
    // Keep only last 10 searches
    newHistory.splice(10);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []); // Remove searchHistory dependency to prevent infinite loop



  // Listen for URL parameter changes to detect typing from navbar
  useEffect(() => {
    const currentQuery = params.get("q") || "";
    const isTyping = params.get("typing") === "true";
    
    if (currentQuery !== searchQuery) {
      setSearchQuery(currentQuery);
    }
    
    // Show skeleton when typing parameter is true and keep it showing while typing
    if (isTyping && currentQuery.trim()) {
      setShowSkeletonOnTyping(true);
      // Don't auto-hide - let it continue showing while typing
    } else if (currentQuery.trim() && !isTyping) {
      // Search completed (stopped typing or Enter key pressed)
      // Save to search history when search completes (only if different from last saved)
      if (currentQuery.trim() !== lastSavedQuery) {
        saveSearchHistory(currentQuery.trim());
        setLastSavedQuery(currentQuery.trim());
      }
      
      setTimeout(() => {
        setShowSkeletonOnTyping(false);
      }, 100); // Small delay to ensure smooth transition
    } else if (!currentQuery.trim()) {
      // Clear search - immediately stop skeleton
      setShowSkeletonOnTyping(false);
    }
  }, [params, searchQuery, saveSearchHistory, lastSavedQuery]);

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.brand-dropdown')) {
        setShowFilters(prev => ({ ...prev, brandDropdown: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search submission
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    saveSearchHistory(query);
    setLastSavedQuery(query.trim());
    
    // Build URL with location context
    let url = `/search?q=${encodeURIComponent(query.trim())}`;
    
    if (locationState.isLocationDetected && locationState.pincode) {
      url += `&pincode=${locationState.pincode}`;
    }
    
    if (isGlobalMode) {
      url += `&mode=global`;
    }
    
    router.push(url);
  }, [saveSearchHistory, locationState, isGlobalMode, router]);

  // Handle search history item click
  const handleHistoryItemClick = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    if (!locationProducts?.products) return [];
    
    return locationProducts.products.filter(product => {
      // Price filter
      const price = Number(product.price) || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
      
      // Brand filter
      if (filters.brands.length > 0) {
        const productBrandId = product.brand?._id || product.brandId;
        if (!productBrandId || !filters.brands.includes(productBrandId)) {
          return false;
        }
      }
      
      // Category filter
      if (filters.categories.length > 0) {
        if (!product.category || !filters.categories.includes(product.category)) {
          return false;
        }
      }
      
      return true;
    });
  }, [locationProducts?.products, filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!filteredProducts) return [];
    
    let sorted = [...filteredProducts];
    
    switch (filters.sortBy) {
      case 'price-low-high':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high-low':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // Relevance - no sorting
        break;
    }
    
    return sorted;
  }, [filteredProducts, filters.sortBy]);

  // Check if filters are active
  const hasActiveFilters = filters.brands.length > 0 || 
                          filters.categories.length > 0 || 
                          filters.priceRange[0] > 0 || 
                          filters.priceRange[1] < 10000 ||
                          filters.sortBy !== 'relevance';

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      priceRange: [0, 10000],
      brands: [],
      categories: [],
      sortBy: 'relevance',
      viewMode: 'grid'
    });
  }, []);

  // Track search gaps
  useEffect(() => {
    if (!productsLoading && searchQuery && shouldTrackSearchGap(searchQuery, sortedProducts)) {
      trackSearchGap({
        searchTerm: searchQuery,
        userId: user?._id,
        pincode: activePincode || undefined
      });
    }
  }, [searchQuery, sortedProducts, productsLoading, user?._id, activePincode]);

  // Handle add to cart
  const handleAddToCart = useCallback((product: any) => {
    if (!canAddToCart(product, cartItems)) {
      showConflictModal(product);
      return;
    }
    
    if (product.variantId) {
      const variant = product.variants?.[product.variantId];
      addToCart({ 
        ...product, 
        id: product._id, 
        quantity: 1,
        variantId: product.variantId,
        variantName: variant?.name || product.variantId.replace(/::/g, ' '),
        selectedVariant: variant,
        price: (variant?.price !== undefined ? variant.price : product.price)
      });
    } else if (product.variants && Object.keys(product.variants).length > 0) {
      const firstVariantKey = Object.keys(product.variants)[0];
      const firstVariant = product.variants[firstVariantKey];
      
      addToCart({ 
        ...product, 
        id: product._id, 
        quantity: 1,
        variantId: firstVariantKey,
        variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
        selectedVariant: firstVariant,
        price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
      });
    } else {
      addToCart({ ...product, id: product._id, quantity: 1 });
    }
  }, [cartItems, showConflictModal, addToCart]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Recent Searches - At the top, single row, no rectangle */}
      {searchHistory.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Recent Searches:</span>
                </div>
                <div className="flex items-center space-x-2">
                  {searchHistory.slice(0, 6).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryItemClick(item.query)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors flex items-center space-x-1"
                    >
                      <Search className="h-3 w-3 text-gray-400" />
                      <span>{item.query}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={clearSearchHistory}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Main Content Rectangle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Results Header - Left side */}
            <div className="flex-shrink-0">
              {searchQuery ? (
                <>
                  <h1 className="text-lg font-semibold text-gray-900 mb-1">
                    Showing results for "{searchQuery}"
                  </h1>
                  <p className="text-sm text-gray-600">
                    {productsLoading || showSkeletonOnTyping ? 'Searching...' : `${sortedProducts.length} products found`}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-lg font-semibold text-gray-900 mb-1">
                    Search Products
                  </h1>
                  <p className="text-sm text-gray-600">
                    Enter a search term to find products or browse by categories
                  </p>
                </>
              )}
            </div>

            {/* Right side - Layout and Filter Controls */}
            <div className="flex items-center gap-3 ml-auto">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
                  className={`p-2 rounded-md transition-colors ${filters.viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
                  className={`p-2 rounded-md transition-colors ${filters.viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Controls */}
              {showFilters.main && (
                <div className="flex items-center gap-3">
                  {/* Brand Filter - Custom Checkbox Dropdown */}
                  <div className="relative brand-dropdown">
                    <button
                      onClick={() => setShowFilters(prev => ({ ...prev, brandDropdown: !prev.brandDropdown }))}
                      className="w-[220px] h-[40px] bg-white border border-gray-300 rounded-md px-3 py-2 text-left text-sm flex items-center justify-between hover:border-gray-400 focus:ring-0 focus:border-gray-300 transition-colors"
                    >
                      <span className="truncate">
                        {filters.brands.length === 0 
                          ? "Select Brand" 
                          : filters.brands.length === 1 
                            ? brands.find(b => b._id === filters.brands[0])?.name || "Brand"
                            : "Multiple Brands"
                        }
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Content */}
                    {showFilters.brandDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                        {/* Header */}
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Select Brands</span>
                            <button
                              onClick={() => setFilters(prev => ({ ...prev, brands: [] }))}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                        
                        {/* Brand List */}
                        <div className="p-2">
                          {brands.map((brand) => (
                            <label key={brand._id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.brands.includes(brand._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilters(prev => ({ 
                                      ...prev, 
                                      brands: [...prev.brands, brand._id] 
                                    }));
                                  } else {
                                    setFilters(prev => ({ 
                                      ...prev, 
                                      brands: prev.brands.filter(b => b !== brand._id) 
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm text-gray-700">{brand.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sort Filter */}
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-[180px] h-[40px] bg-white border-gray-300 focus:ring-0 focus:border-gray-300">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(prev => ({ ...prev, main: !prev.main }))}
                className={`px-4 h-[40px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center relative ${
                  showFilters.main
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {showFilters.main ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                {hasActiveFilters && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {[
                      filters.brands.length > 0,
                      filters.categories.length > 0,
                      filters.priceRange[0] > 0,
                      filters.priceRange[1] < 10000,
                      filters.sortBy !== 'relevance'
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Applied Filters - Just before products */}
        {hasActiveFilters && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Applied filters:</span>
                                              {filters.brands.length > 0 && (
                 <>
                   {filters.brands.map((brandId) => {
                     const brand = brands.find(b => b._id === brandId);
                     return (
                       <span key={brandId} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                         <span>{brand?.name || "Brand"}</span>
                         <button
                           onClick={() => setFilters(prev => ({ 
                             ...prev, 
                             brands: prev.brands.filter(b => b !== brandId) 
                           }))}
                           className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                         >
                           <X className="h-3 w-3" />
                         </button>
                       </span>
                     );
                   })}
                 </>
               )}
                {filters.categories.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span>{filters.categories.length} categor{filters.categories.length > 1 ? 'ies' : 'y'}</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                      className="ml-2 hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <span>₹{filters.priceRange[0].toLocaleString()} - ₹{filters.priceRange[1].toLocaleString()}</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 10000] }))}
                      className="ml-2 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
              </button>
                  </span>
                )}
                {filters.sortBy !== 'relevance' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <span>Sort: {SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label}</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'relevance' }))}
                      className="ml-2 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all filters
              </button>
          </div>
        </div>
      )}

        {/* Products Grid/List */}
        {productsLoading || showSkeletonOnTyping ? (
          <ProductGridSkeleton count={20} viewMode={filters.viewMode} />
        ) : sortedProducts.length === 0 && searchQuery ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching "{searchQuery}". Try adjusting your search or filters.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Suggestions:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check your spelling</li>
                  <li>• Try more general keywords</li>
                  <li>• Remove some filters</li>
                </ul>
              </div>
            </div>
              </div>
        ) : (
          <div className={`${
            filters.viewMode === 'grid' 
              ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4' 
              : 'space-y-4'
          }`}>
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isInWishlist={isInWishlist}
                handleWishlistClick={(product, e) => {
                      e.stopPropagation();
                  addToWishlist(product);
                }}
                handleAddToCart={handleAddToCart}
                quantity={cartItems.find(item => item.id === product._id)?.quantity || 0}
                    locationState={locationState}
                    isGlobalMode={isGlobalMode}
                viewMode={filters.viewMode}
                onClick={() => {
                  addToRecentlyViewed(product);
                  router.push(`/products/${product._id}`);
                }}
                  />
                ))}
              </div>
        )}
      </div>
      
      {/* Warehouse Conflict Modal */}
      <WarehouseConflictModal
        isOpen={isModalOpen}
        onClose={closeModal}
        currentWarehouse={conflictProduct?.warehouse?.name || "Unknown"}
        conflictingProduct={conflictProduct?.name || "Product"}
        onClearCart={handleClearCart}
        onSwitchToGlobal={handleSwitchToGlobal}
        onContinueShopping={handleContinueShopping}
        isLocationConflict={!!locationConflict}
        newWarehouse={locationConflict?.newWarehouse}
      />
    </div>
  );
}

export default memo(SearchPage);
