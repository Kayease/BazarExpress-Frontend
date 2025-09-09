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
  ArrowDownZA, 
  X, 
  Clock, 
  Grid3X3,
  List,
  Star,
  SlidersHorizontal
} from 'lucide-react';

// Toast
import toast from 'react-hot-toast';
import { showStockLimitToast } from '@/lib/toasts';

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
    brandDropdown: false,
    sortDropdown: false
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
      page: 1,
      includeOutOfStock: true
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.brand-dropdown') && !target.closest('.sort-dropdown')) {
        setShowFilters(prev => ({ ...prev, brandDropdown: false, sortDropdown: false }));
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
    // Check if product is out of stock
    const isOutOfStock = product.stock === 0 || product.stock < 0;
    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }
    
    if (!canAddToCart(product, cartItems)) {
      showConflictModal(product);
      return;
    }
    
    // If variants exist but none selected, redirect to product detail to select variant
    if (product.variants && Object.keys(product.variants).length > 0 && !product.variantId) {
      router.push(`/products/${product._id}`);
      return;
    }

    // If variant already selected or no variants, proceed to add
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
    } else {
      addToCart({ ...product, id: product._id, quantity: 1 });
    }
  }, [cartItems, showConflictModal, addToCart, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Recent Searches Section - Hidden on Mobile */}
        {searchHistory.length > 0 && (
          <div className="hidden sm:block mb-4 sm:mb-6">
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Recent Searches:</span>
              </div>
              <button
                onClick={clearSearchHistory}
                className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors self-start sm:self-auto"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {searchHistory.slice(0, 6).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryItemClick(item.query)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors flex items-center space-x-1 whitespace-nowrap"
                >
                  <Search className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate max-w-[120px]">{item.query}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Search Results Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
          {/* Search Results Header with Inline Filters */}
          <div className="mb-4">
            {searchQuery ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate flex-1">
                    Showing results for "{searchQuery}"
                  </h1>
                  
                  {/* View Mode Toggle and Filter Controls */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors ${filters.viewMode === 'grid' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors ${filters.viewMode === 'list' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        aria-label="List view"
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Brand Filter Icon */}
                    <div className="relative brand-dropdown">
                      <button
                        onClick={() => setShowFilters(prev => ({ 
                          ...prev,
                          brandDropdown: !prev.brandDropdown,
                          sortDropdown: false
                        }))}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors flex items-center gap-1 sm:gap-2 ${
                          filters.brands.length > 0 
                            ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        aria-label="Select brand filter"
                      >
                        <ArrowDownZA className="h-4 w-4" />
                        <span className="hidden sm:inline text-sm font-medium">
                          {filters.brands.length === 0 
                            ? "Brands" 
                            : filters.brands.length === 1 
                              ? brands.find(b => b._id === filters.brands[0])?.name || "Brand"
                              : `${filters.brands.length} Brands`
                          }
                        </span>
                        {filters.brands.length > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                            {filters.brands.length}
                          </span>
                        )}
                      </button>
                      
                      {/* Compact Brand Dropdown */}
                      {showFilters.brandDropdown && (
                        <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
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
                                <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sort Filter Icon */}
                    <div className="relative sort-dropdown">
                      <button
                        onClick={() => setShowFilters(prev => ({ 
                          brandDropdown: false,
                          sortDropdown: !prev.sortDropdown 
                        }))}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors flex items-center gap-1 sm:gap-2 ${
                          filters.sortBy !== 'relevance' 
                            ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        aria-label="Select sort option"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline text-sm font-medium">
                          Sort
                        </span>
                      </button>
                      
                      {/* Compact Sort Dropdown */}
                      {showFilters.sortDropdown && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <div className="p-1">
                            {SORT_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setFilters(prev => ({ ...prev, sortBy: option.value }));
                                  setShowFilters(prev => ({ ...prev, sortDropdown: false }));
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                                  filters.sortBy === option.value 
                                    ? 'bg-purple-100 text-purple-700 font-medium' 
                                    : 'text-gray-700'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm sm:text-base text-gray-600 mb-3">
                  {productsLoading || showSkeletonOnTyping ? 'Searching...' : `${sortedProducts.length} products found`}
                </p>


              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Search Products
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Enter a search term to find products or browse by categories
                </p>
              </>
            )}
          </div>
        </div>

        {/* Applied Filters Section */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Applied filters:</span>
                {filters.brands.length > 0 && (
                  <>
                    {filters.brands.map((brandId) => {
                      const brand = brands.find(b => b._id === brandId);
                      return (
                        <span key={brandId} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <span className="truncate max-w-[100px]">{brand?.name || "Brand"}</span>
                          <button
                            onClick={() => setFilters(prev => ({ 
                              ...prev, 
                              brands: prev.brands.filter(b => b !== brandId) 
                            }))}
                            className="ml-2 hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
                            aria-label={`Remove ${brand?.name || 'brand'} filter`}
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
                      className="ml-2 hover:bg-green-200 rounded-full p-0.5 flex-shrink-0"
                      aria-label="Remove category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <span className="truncate">₹{filters.priceRange[0].toLocaleString()} - ₹{filters.priceRange[1].toLocaleString()}</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 10000] }))}
                      className="ml-2 hover:bg-purple-200 rounded-full p-0.5 flex-shrink-0"
                      aria-label="Remove price filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.sortBy !== 'relevance' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <span className="truncate">Sort: {SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label}</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'relevance' }))}
                      className="ml-2 hover:bg-orange-200 rounded-full p-0.5 flex-shrink-0"
                      aria-label="Remove sort filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline self-start sm:self-auto"
                aria-label="Clear all filters"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Products Section */}
        {productsLoading || showSkeletonOnTyping ? (
          <ProductGridSkeleton count={14} viewMode={filters.viewMode} />
        ) : sortedProducts.length === 0 && searchQuery ? (
          <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
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
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 items-start' 
              : 'space-y-3 sm:space-y-4'
          }`}>
            {sortedProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isInWishlist={isInWishlist}
                handleWishlistClick={(product, e) => {
                  e.stopPropagation();
                  
                  // Handle variants properly when adding to wishlist
                  if (product.variants && Object.keys(product.variants).length > 0) {
                    const firstVariantKey = Object.keys(product.variants)[0];
                    const firstVariant = product.variants[firstVariantKey];
                    
                    const productWithVariant = {
                      ...product,
                      variantId: firstVariantKey,
                      variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
                      selectedVariant: firstVariant,
                      price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
                    };
                    
                    addToWishlist(productWithVariant);
                  } else {
                    addToWishlist(product);
                  }
                }}
                handleAddToCart={handleAddToCart}
                quantity={cartItems.find(item => {
                  const idMatch = (item.id || item._id) === product._id;
                  if (product.variants && Object.keys(product.variants).length > 0) {
                    const firstVariantKey = Object.keys(product.variants)[0];
                    return idMatch && item.variantId === firstVariantKey;
                  }
                  return idMatch && !item.variantId;
                })?.quantity || 0}
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
