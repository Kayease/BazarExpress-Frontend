"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useLocation } from "@/components/location-provider";
import { useCartContext, useWishlistContext } from "@/components/app-provider";
import { useProductsByLocation, useBrands } from "@/hooks/use-api";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

import ProductCard from "@/components/product-card";
import ProductGridSkeleton from "@/components/product-grid-skeleton";
import { Grid3X3, List, ArrowLeft, X, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Types for categories
interface Category {
  _id: string;
  name: string;
  parentId: string;
  hide: boolean;
  popular: boolean;
  icon: string;
  description?: string;
  slug?: string;
  thumbnail?: string;
  showOnHome: boolean;
  productCount?: number;
}

// Types for brands
interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  productCount?: number;
}

export default function ProductsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") || "";
  const subcategory = params.get("subcategory") || "";
  const search = params.get("search") || "";
  
  // Location context
  const { locationState } = useLocation();
  const contextPincode = locationState?.pincode;
  const isLocationDetected = locationState?.isLocationDetected;

  // State for categories
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(category);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategory);
  
  // State for filters and UI
  const [priceRange, setPriceRange] = useState<[number, number]>([10, 100000]);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(search);
  const [sidebarMode, setSidebarMode] = useState<'parent' | 'subcategory'>('parent');
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  
  // State for brand dropdown
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  
  // Lazy loading state
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [isCategorySelectionInProgress, setIsCategorySelectionInProgress] = useState(false);

  // Cart and wishlist context
  const { addToCart, cartItems, updateCartItem } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();
  
  // Recently viewed products hook
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Quantity tracking for cart items
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Use the useBrands hook instead of custom fetchBrands
  const { data: brands = [], isLoading: loadingBrands } = useBrands();

  // Sync local quantity state with cartItems - handle variants
  useEffect(() => {
    const newQuantities: { [key: string]: number } = {};
    
    cartItems.forEach(item => {
      const itemId = item.id || item._id;
      // Create a unique key that includes both product ID and variant ID (if present)
      const cartKey = item.variantId ? `${itemId}:${itemId}` : itemId;
      newQuantities[cartKey] = item.quantity;
    });
    
    setQuantities(newQuantities);
  }, [cartItems]);

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.brand-dropdown')) {
        setShowBrandDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync component state with URL parameters on mount and when URL changes
  useEffect(() => {
    console.log('URL params changed:', { category, subcategory, search });
    
    // If category selection is in progress, completely ignore URL changes
    if (isCategorySelectionInProgress) {
      console.log('🚫 Ignoring URL changes during category selection');
      return;
    }
    
    // Only update state if URL params are different from current state
    // AND if the user haven't just made a selection (to prevent overriding user choices)
    if (category !== selectedCategory && !forceRefresh) {
      console.log('Updating selectedCategory from URL:', { from: selectedCategory, to: category });
      setSelectedCategory(category);
    }
    if (subcategory !== selectedSubcategory && !forceRefresh) {
      console.log('Updating selectedSubcategory from URL:', { from: selectedSubcategory, to: subcategory });
      setSelectedSubcategory(subcategory);
    }
    if (search !== searchQuery) {
      setSearchQuery(search);
    }
    
    // Reset products when URL changes to ensure fresh data
    if (category !== selectedCategory || subcategory !== selectedSubcategory || search !== searchQuery) {
      setCurrentPage(1);
      setAllProducts([]);
      setHasMore(true);
      setLoadingMore(false);
      setShowSkeleton(true);
      
      // Set a flag to indicate we need to refetch after state update
      // This will be handled by the enhanced navigation return handler
      console.log('🔄 URL changed, products cleared, waiting for refetch...');
    }
  }, [category, subcategory, search, selectedCategory, selectedSubcategory, searchQuery, forceRefresh, isCategorySelectionInProgress, params]);

  // Read filter parameters from URL on initial load only
  useEffect(() => {
    const brand = params.get('brand');
    const sort = params.get('sort');
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    
    if (brand && brand !== selectedBrands.join(',')) {
      console.log('Setting brand from URL:', brand);
      setSelectedBrands(brand.split(',').filter(b => b.trim() !== ''));
    }
    if (sort && sort !== sortBy) {
      console.log('Setting sort from URL:', sort);
      setSortBy(sort);
    }
    if (minPrice && maxPrice) {
      const min = parseInt(minPrice);
      const max = parseInt(maxPrice);
      if (!isNaN(min) && !isNaN(max) && (min !== priceRange[0] || max !== priceRange[1])) {
        console.log('Setting price range from URL:', [min, max]);
        setPriceRange([min, max]);
      }
    }
  }, []); // Empty dependency array - only run on initial load

  // Monitor category changes and reset products when needed
  useEffect(() => {
    console.log('Category state changed:', { selectedCategory, selectedSubcategory });
    
    // If we're going back to show all products, reset the products state
    if (!selectedCategory && !selectedSubcategory) {
      console.log('Resetting to show all products');
      setCurrentPage(1);
      setAllProducts([]);
      setHasMore(true);
      setLoadingMore(false);
      setShowSkeleton(true);
      
      // Don't call setForceRefresh here to avoid infinite loop
      // The back button will handle this directly
    }
    
    // If a category was just selected, don't reset products immediately
    // Let the API call handle it
    if (selectedCategory && !forceRefresh) {
      console.log('Category selected, waiting for API response');
    }
  }, [selectedCategory, selectedSubcategory, forceRefresh]);

  // Determine which category to use for filtering
  const categoryForFiltering = selectedSubcategory || selectedCategory || '';
  
  // Determine if we're filtering by parent category (to include all subcategories)
  const isParentCategoryFilter = selectedCategory && !selectedSubcategory;
  
  // Determine if we should show all products (no category filter)
  const showAllProducts = !selectedCategory && !selectedSubcategory;
  
  // Determine if we're filtering by subcategory
  const isSubcategoryFilter = !!(selectedSubcategory && selectedCategory);
  
  // API call parameters for debugging
  const apiParams = {
    search: searchQuery || undefined,
    category: selectedCategory || undefined, // Always pass the selected category
    subcategory: selectedSubcategory || undefined, // Always pass the selected subcategory
    parentCategory: undefined, // Not needed for this API
    mode: locationState?.isGlobalMode ? 'global' : 'auto',
    limit: 100,
    page: currentPage
  };

  // Debug logging for API parameters
  console.log('🔍 API Parameters Debug:', {
    showAllProducts,
    selectedCategory,
    selectedSubcategory,
    isSubcategoryFilter,
    isParentCategoryFilter,
    category: apiParams.category,
    subcategory: apiParams.subcategory,
    parentCategory: apiParams.parentCategory,
    search: apiParams.search,
    apiParams
  });

  console.log('API Parameters:', {
    selectedCategory,
    selectedSubcategory,
    showAllProducts,
    isParentCategoryFilter,
    isSubcategoryFilter,
    apiParams,
    contextPincode,
    locationState: locationState?.isGlobalMode
  });

  const { 
    data: locationProducts, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts
  } = useProductsByLocation(
    contextPincode || '000000',
    {
      ...apiParams,
      forceRefresh // Add this to trigger query key changes
    }
  );

  // Enhanced error logging
  useEffect(() => {
    if (productsError) {
      console.error('🚨 Products API Error:', {
        error: productsError,
        message: productsError?.message,
        stack: productsError?.stack,
        pincode: contextPincode,
        apiParams
      });
    }
  }, [productsError, contextPincode, apiParams]);

  // Debug environment and API configuration
  useEffect(() => {
    console.log('🔧 Debug Info:', {
      contextPincode,
      isLocationDetected,
      apiParams,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV
    });
  }, [contextPincode, isLocationDetected, apiParams]);

  // Monitor forceRefresh changes and trigger refetch
  useEffect(() => {
    if (forceRefresh > 0) {
      console.log('🔄 Force refresh triggered:', forceRefresh);
      // Trigger a refetch when forceRefresh changes
      if (refetchProducts) {
        setTimeout(() => {
          console.log('🔄 Triggering refetch due to forceRefresh change');
          refetchProducts();
        }, 100);
      }
    }
  }, [forceRefresh, refetchProducts]);

  // Simplified navigation return handling
  useEffect(() => {
    // When the component mounts or URL changes, ensure we have products
    if (refetchProducts && allProducts.length === 0 && !productsLoading) {
      console.log('🔄 Navigation return detected - ensuring products are loaded');
      // Small delay to ensure state is settled
      setTimeout(() => {
        refetchProducts();
      }, 100);
    }
  }, [refetchProducts, allProducts.length, productsLoading, category, subcategory, search]);

  // Browser navigation event listener for back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      console.log('🔄 Browser navigation detected (back/forward button)');
      if (refetchProducts) {
        // Small delay to ensure URL is updated
        setTimeout(() => {
          console.log('🔄 Triggering refetch after browser navigation');
          refetchProducts();
        }, 200);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [refetchProducts]);


  // Frontend filtering for categories, subcategories, brands, and price range
  const filteredProducts = useMemo(() => {
    console.log('🔍 Frontend filtering:', {
      selectedCategory,
      selectedSubcategory,
      selectedBrands,
      priceRange,
      allProductsLength: allProducts.length,
      subcategoriesLength: subcategories.length
    });
    
    let filtered = allProducts;
    
    // Category filtering
    if (selectedCategory && allProducts.length) {
      // If subcategory is selected, filter by subcategory
      if (selectedSubcategory) {
        console.log('🔍 Filtering by subcategory:', selectedSubcategory);
        const subcategoryName = subcategories.find(sub => sub._id === selectedSubcategory)?.name || '';
        
        filtered = filtered.filter(product => {
          // Try exact ID matches first
          if (
            product.subcategory === selectedSubcategory ||
            product.subcategoryId === selectedSubcategory ||
            product.subcategory_id === selectedSubcategory ||
            product.category === selectedSubcategory ||
            product.categoryId === selectedSubcategory ||
            product.category_id === selectedSubcategory ||
            (product.categories && product.categories.includes(selectedSubcategory))
          ) {
            return true;
          }
          
          // Try matching populated objects
          if (typeof product.subcategory === 'object' && product.subcategory?._id === selectedSubcategory) {
            return true;
          }
          
          if (typeof product.category === 'object' && product.category?._id === selectedSubcategory) {
            return true;
          }
          
          // Name-based filtering as fallback
          if (subcategoryName) {
            const productName = product.name?.toLowerCase() || '';
            const subName = subcategoryName.toLowerCase();
            
            if (subName.includes('children')) {
              return productName.includes('nursery') || productName.includes('early');
            }
            if (subName.includes('non-fiction')) {
              return productName.includes('business') || productName.includes('scammer');
            }
          }
          
          return false;
        });
      } else {
        // If only parent category is selected, filter by parent category
        console.log('🔍 Filtering by parent category:', selectedCategory);
        filtered = filtered.filter(product => {
          // Try exact ID matches first
          if (
            product.category === selectedCategory ||
            product.categoryId === selectedCategory ||
            product.category_id === selectedCategory ||
            (product.categories && product.categories.includes(selectedCategory))
          ) {
            return true;
          }
          
          // Try matching populated objects
          if (typeof product.category === 'object' && product.category?._id === selectedCategory) {
            return true;
          }
          
          // Check if product belongs to any subcategory of the selected parent category
          if (subcategories.length > 0) {
            const subcategoryIds = subcategories.map(sub => sub._id);
            if (
              product.subcategory && subcategoryIds.includes(product.subcategory) ||
              product.subcategoryId && subcategoryIds.includes(product.subcategoryId) ||
              product.subcategory_id && subcategoryIds.includes(product.subcategory_id)
            ) {
              return true;
            }
          }
          
          return false;
        });
      }
    }
    
    // Brand filtering
    if (selectedBrands.length > 0) {
      console.log('🔍 Filtering by brands:', selectedBrands);
      filtered = filtered.filter(product => {
        const productBrands = product.brand || product.brandId || product.brand_id;
        if (typeof productBrands === 'object' && productBrands?._id && selectedBrands.includes(productBrands._id)) {
          return true;
        }
        if (typeof productBrands === 'string' && selectedBrands.includes(productBrands)) {
          return true;
        }
        return false;
      });
    }
    
    // Price range filtering
    if (priceRange[0] > 10 || priceRange[1] < 100000) {
      console.log('🔍 Filtering by price range:', priceRange);
      filtered = filtered.filter(product => {
        const productPrice = product.price || 0;
        return productPrice >= priceRange[0] && productPrice <= priceRange[1];
      });
    }
    
    // Sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'relevance':
      default:
        // Relevance: keep original order (most relevant from API)
        break;
    }
    
    console.log('🔍 Final filtering result:', { 
      filteredCount: sorted.length, 
      totalCount: allProducts.length,
      brandFilter: selectedBrands,
      priceFilter: priceRange,
      sortBy
    });
    
    return sorted;
  }, [allProducts, selectedCategory, selectedSubcategory, subcategories, selectedBrands, priceRange, sortBy]);

  const products = filteredProducts;

  // Handle product loading and pagination
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    console.log('Product loading effect:', { 
      locationProducts: locationProducts?.success, 
      productsCount: locationProducts?.products?.length,
      productsLoading,
      showSkeleton 
    });
    
    if (locationProducts?.success && Array.isArray(locationProducts?.products)) {
      console.log('🔍 API returned products:', {
        count: locationProducts.products.length,
        selectedCategory,
        selectedSubcategory,
        currentPage
      });
      
      if (currentPage === 1) {
        // First page - replace all products
        setAllProducts(locationProducts.products);
      } else {
        // Subsequent pages - append products
        setAllProducts(prev => [...prev, ...locationProducts.products]);
      }
      
      // Check if there are more products
      setHasMore(locationProducts.products.length === 100);
      setLoadingMore(false);
      
      // Hide skeleton after a brief delay to prevent flicker
      timeoutId = setTimeout(() => {
        console.log('Hiding skeleton - products loaded:', locationProducts.products.length);
        setShowSkeleton(false);
        
        // Reset forceRefresh when products are successfully loaded
        if (forceRefresh > 0) {
          console.log('Resetting forceRefresh after successful product load');
          setForceRefresh(0);
        }
      }, 100);
    } else if (locationProducts?.success && (!locationProducts.products || locationProducts.products.length === 0)) {
      // API returned successfully but no products - clear the array
      console.log('API returned no products');
      setAllProducts([]);
      setHasMore(false);
      setLoadingMore(false);
      
      // Hide skeleton after a brief delay to prevent flicker
      timeoutId = setTimeout(() => {
        console.log('Hiding skeleton - no products found');
        setShowSkeleton(false);
        
        // Reset forceRefresh when no products found
        if (forceRefresh > 0) {
          console.log('Resetting forceRefresh after no products found');
          setForceRefresh(0);
        }
      }, 100);
    } else if (locationProducts?.success === false) {
      // API returned error
      console.log('API returned error');
      setAllProducts([]);
      setHasMore(false);
      setLoadingMore(false);
      
      // Hide skeleton after a brief delay to prevent flicker
      timeoutId = setTimeout(() => {
        console.log('Hiding skeleton - API error');
        setShowSkeleton(false);
        
        // Reset forceRefresh when API error occurs
        if (forceRefresh > 0) {
          console.log('Resetting forceRefresh after API error');
          setForceRefresh(0);
        }
      }, 100);
    }
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // Don't handle the case where locationProducts is undefined/null - that means API hasn't responded yet
  }, [locationProducts, currentPage, productsLoading, forceRefresh]);

  // Reset products when search or location changes
  useEffect(() => {
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
    setShowSkeleton(true);
  }, [searchQuery, locationState?.isGlobalMode, contextPincode]);

  // Fallback to hide skeleton if it's been showing too long
  useEffect(() => {
    if (showSkeleton) {
      const fallbackTimeout = setTimeout(() => {
        console.log('Fallback: Hiding skeleton after 5 seconds');
        setShowSkeleton(false);
      }, 5000); // Hide skeleton after 5 seconds regardless
      
      return () => clearTimeout(fallbackTimeout);
    }
  }, [showSkeleton]);

  // Let React Query handle refetching automatically when dependencies change

  // Sync URL parameters with state
  useEffect(() => {
    console.log('URL parameters changed:', { category, subcategory, search });
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSearchQuery(search);
  }, [category, subcategory, search]);

  // Force refetch when URL parameters change (including navigation returns)
  useEffect(() => {
    if (refetchProducts) {
      console.log('URL parameters changed, triggering refetch:', { category, subcategory, search });
      
      // Reset products state for fresh data
      setCurrentPage(1);
      setAllProducts([]);
      setHasMore(true);
      setLoadingMore(false);
      setShowSkeleton(true);
      
      // Force refetch for the new parameters
      setTimeout(() => {
        console.log('Refetching products for URL parameters:', { category, subcategory, search });
        refetchProducts();
      }, 100);
    }
  }, [category, subcategory, search, refetchProducts]);

  // Simple fallback refetch when no products are loaded
  useEffect(() => {
    if (refetchProducts && allProducts.length === 0 && !locationProducts && !productsLoading) {
      console.log('No products loaded, triggering fallback refetch...');
      setTimeout(() => {
        refetchProducts();
      }, 500);
    }
  }, [refetchProducts, allProducts.length, locationProducts, productsLoading]);

  // Direct URL change detection for navigation returns
  useEffect(() => {
    if (refetchProducts) {
      console.log('🔄 URL change detected, ensuring products are loaded for:', { category, subcategory, search });
      
      // If we have URL parameters but no products, trigger refetch
      if ((category || subcategory || search) && allProducts.length === 0) {
        console.log('🔄 Navigation return detected - triggering immediate refetch');
        setTimeout(() => {
          refetchProducts();
        }, 100);
      }
    }
  }, [category, subcategory, search, refetchProducts, allProducts.length]);

  // Removed aggressive refetch effects that were causing interference

  // Component cleanup and reset
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      console.log('Products page unmounting, clearing state...');
      setAllProducts([]);
      setCurrentPage(1);
      setHasMore(true);
      setLoadingMore(false);
      setShowSkeleton(true);
    };
  }, []);

  // Fetch parent categories on mount
  useEffect(() => {
    fetchParentCategories();
  }, []);

  // Fetch subcategories when parent category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  // Handle parent category click
  const handleParentCategoryClick = (category: Category) => {
    console.log('Parent category clicked:', category);
    
    // Set flag to prevent URL synchronization from overriding selection
    setIsCategorySelectionInProgress(true);
    
    setSelectedParentCategory(category);
    setSelectedCategory(category._id || '');
    setSelectedSubcategory('');
    setSidebarMode('subcategory');
    
    // Reset products state
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
    setLoadingMore(false);
    setShowSkeleton(true);
    
    console.log('Parent category state updated, waiting for API refetch...');
    
          // Force a refetch to ensure the new category is used
      setTimeout(() => {
        if (refetchProducts) {
          console.log('Forcing refetch for parent category:', category._id);
          refetchProducts();
        }
        
        // Clear the flag after a longer delay to ensure URL update completes
        setTimeout(() => {
          console.log('🔄 Clearing category selection flag');
          setIsCategorySelectionInProgress(false);
        }, 500);
      }, 100);
  };

  // Handle back to parent categories
  const handleBackToParentCategories = () => {
    // Prevent multiple rapid clicks
    if (forceRefresh > 0) {
      console.log('Back button clicked while refresh is in progress, ignoring');
      return;
    }
    
    console.log('Back to parent categories clicked - current state:', {
      selectedCategory,
      selectedSubcategory,
      sidebarMode,
      allProductsLength: allProducts.length
    });
    
    // Set flag to prevent URL synchronization from interfering
    setIsCategorySelectionInProgress(true);
    
    // Immediately clear ALL state completely
    setSidebarMode('parent');
    setSelectedParentCategory(null);
    setSelectedCategory('');
    setSelectedSubcategory('');
    setAllProducts([]);
    setShowSkeleton(true);
    setCurrentPage(1);
    setHasMore(true);
    setLoadingMore(false);
    
    console.log('State reset completed, waiting for API refetch...');
    
    // Update URL to remove category parameters FIRST
    router.replace('/products');
    
    // Force a refresh to ensure the query key changes
    setForceRefresh(prev => {
      const newValue = prev + 1;
      console.log(`Incrementing forceRefresh from ${prev} to ${newValue}`);
      return newValue;
    });
    
    // Use a longer delay to ensure URL and state changes are complete
    setTimeout(() => {
      console.log('Forcing refetch for all products after back click');
      if (refetchProducts) {
        refetchProducts();
      }
      
      // Clear the flag after a longer delay to ensure URL update completes
      setTimeout(() => {
        console.log('🔄 Clearing category selection flag after back click');
        setIsCategorySelectionInProgress(false);
      }, 1000);
    }, 200);
  };

  // Handle subcategory click
  const handleSubcategoryClick = (subcategory: Category) => {
    console.log('Subcategory clicked:', subcategory);
    
    // Set flag to prevent URL synchronization from overriding selection
    setIsCategorySelectionInProgress(true);
    
    setSelectedSubcategory(subcategory._id || '');
    
    // Reset products state to force fresh API call
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
    setLoadingMore(false);
    setShowSkeleton(true);
    
    console.log('Subcategory state updated, waiting for API refetch...');
    
    // Force a refetch to ensure the new subcategory is used
    setTimeout(() => {
      if (refetchProducts) {
        console.log('Forcing refetch for subcategory:', subcategory._id);
        refetchProducts();
      }
      
      // Clear the flag after a longer delay to ensure URL update completes
      setTimeout(() => {
        console.log('🔄 Clearing category selection flag');
        setIsCategorySelectionInProgress(false);
      }, 500);
    }, 100);
  };

  // Handle all subcategories click (show parent category products)
  const handleAllSubcategoryClick = () => {
    // Prevent rapid clicking by checking if we're already in the desired state
    if (!selectedSubcategory && allProducts.length > 0) {
      return;
    }
    
    // Set flag to prevent URL synchronization from interfering
    setIsCategorySelectionInProgress(true);
    
    // Clear subcategory selection but keep parent category
    setSelectedSubcategory('');
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
    setLoadingMore(false);
    setShowSkeleton(true);
    
    // React Query will automatically refetch when parameters change
    
    // The useProductsByLocation hook will automatically refetch when dependencies change
    
    // Clear the flag after a delay to allow URL update
    setTimeout(() => {
      console.log('🔄 Clearing category selection flag for all subcategories');
      setIsCategorySelectionInProgress(false);
    }, 500);
  };

  // Handle all categories click (show all products)
  const handleAllCategoriesClick = () => {
    // Prevent multiple rapid clicks
    if (forceRefresh > 0) {
      console.log('All categories clicked while refresh is in progress, ignoring');
      return;
    }
    
    // Prevent rapid clicking by checking if we're already in the desired state
    if (!selectedCategory && !selectedSubcategory && allProducts.length > 0) {
      return;
    }
    
    // Set flag to prevent URL synchronization from interfering
    setIsCategorySelectionInProgress(true);
    
    // Immediately clear products and show skeleton for better UX
    setAllProducts([]);
    setShowSkeleton(true);
    
    // Reset ALL state completely
    setSidebarMode('parent');
    setSelectedParentCategory(null);
    setSelectedCategory('');
    setSelectedSubcategory('');
    setCurrentPage(1);
    setHasMore(true);
    setLoadingMore(false);
    
    // Clear any existing filters
    setSearchQuery('');
    setSelectedBrands([]);
    setPriceRange([10, 100000]);
    setSortBy('relevance');
    
    // Update URL to remove category parameters
    router.replace('/products');
    
    // Force a refresh to ensure the query key changes
    setForceRefresh(prev => {
      const newValue = prev + 1;
      console.log(`Incrementing forceRefresh from ${prev} to ${newValue}`);
      return newValue;
    });
    
    // Force a refetch after state is updated
    setTimeout(() => {
      console.log('Forcing refetch for all products after all categories click');
      if (refetchProducts) {
        refetchProducts();
      }
      
      // Clear the flag after a delay to allow URL update
      setTimeout(() => {
        setIsCategorySelectionInProgress(false);
      }, 200);
    }, 100);
  };

  // Reset all filters
  const resetFilters = () => {
    console.log('Resetting filters...');
    
    // Reset all filter states
    setSelectedBrands([]);
    setPriceRange([10, 100000]);
    setSortBy('relevance');
    
    // Clear URL parameters for filters
    const newParams = new URLSearchParams();
    if (selectedCategory) newParams.set('category', selectedCategory);
    if (selectedSubcategory) newParams.set('subcategory', selectedSubcategory);
    if (searchQuery) newParams.set('search', searchQuery);
    
    const newUrl = `/products${newParams.toString() ? '?' + newParams.toString() : ''}`;
    router.replace(newUrl);
    
    console.log('Filters reset successfully');
  };

  // Check if any filters are active
  const hasActiveFilters = selectedBrands.length > 0 || priceRange[0] > 10 || priceRange[1] < 100000 || sortBy !== 'relevance';

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: any) => {
    console.log('Filter changed:', filterType, value);
    
    switch (filterType) {
      case 'brand':
        console.log('Setting brand filter to:', value);
        setSelectedBrands(Array.isArray(value) ? value : [value]);
        break;
      case 'sort':
        console.log('Setting sort filter to:', value);
        setSortBy(value);
        break;
      case 'priceRange':
        console.log('Setting price range filter to:', value);
        setPriceRange(value);
        break;
      default:
        console.warn('Unknown filter type:', filterType);
    }
  };

  // Update URL when selections change
  useEffect(() => {
    // Add a small delay to prevent race conditions with URL synchronization
    const timeoutId = setTimeout(() => {
      const newParams = new URLSearchParams();
      if (selectedCategory) newParams.set('category', selectedCategory);
      if (selectedSubcategory) newParams.set('subcategory', selectedSubcategory);
      if (searchQuery) newParams.set('search', searchQuery);
      if (selectedBrands.length > 0) newParams.set('brand', selectedBrands.join(','));
      if (sortBy && sortBy !== 'relevance') newParams.set('sort', sortBy);
      if (priceRange[0] > 10 || priceRange[1] < 100000) {
        newParams.set('minPrice', priceRange[0].toString());
        newParams.set('maxPrice', priceRange[1].toString());
      }
      
      const newUrl = `/products${newParams.toString() ? '?' + newParams.toString() : ''}`;
      console.log('Updating URL to:', newUrl);
      router.replace(newUrl);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [selectedCategory, selectedSubcategory, searchQuery, selectedBrands, sortBy, priceRange, router]);

  // Function to fetch parent categories
  const fetchParentCategories = async () => {
    try {
      setLoadingCategories(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/categories`);
      if (response.ok) {
        const categories = await response.json();
        // Filter only parent categories (no parentId or empty parentId)
        const parents = categories.filter((cat: Category) => !cat.parentId || cat.parentId === '');
        setParentCategories(parents);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Function to fetch subcategories
  const fetchSubcategories = async (parentId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/categories/subcategories/${parentId}`);
      if (response.ok) {
        const subs = await response.json();
        setSubcategories(subs);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  // Handle add to cart
  const handleAddToCart = (product: any) => {
    // Check if product has variants and include the first variant by default
    if (product.variants && Object.keys(product.variants).length > 0) {
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
  };

  // Handle increment quantity
  const handleInc = (product: any) => {
    const id = product._id;
    const variantId = product.variantId;
    
    // Create a unique key that includes variant ID if present
    const cartKey = variantId ? `${id}:${variantId}` : id;
    
    const newQty = (quantities[cartKey] || 0) + 1;
    setQuantities(q => ({ ...q, [cartKey]: newQty }));
    
    // Pass both product ID and variant ID to updateCartItem
    updateCartItem(id, newQty, variantId);
  };

  // Handle decrement quantity
  const handleDec = (product: any) => {
    const id = product._id;
    const variantId = product.variantId;
    
    // Create a unique key that includes variant ID if present
    const cartKey = variantId ? `${id}:${variantId}` : id;
    
    const newQty = (quantities[cartKey] || 0) - 1;
    if (newQty <= 0) {
      setQuantities(q => ({ ...q, [cartKey]: 0 }));
      // Pass both product ID and variant ID to updateCartItem
      updateCartItem(id, 0, variantId);
    } else {
      setQuantities(q => ({ ...q, [cartKey]: newQty }));
      // Pass both product ID and variant ID to updateCartItem
      updateCartItem(id, newQty, variantId);
    }
  };

  // Handle wishlist
  const handleWishlistClick = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
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
  };

  // Handle product click - navigate to product detail page
  const handleProductClick = (product: any) => {
    console.log('Product clicked:', product._id, product.name);
    // Add to recently viewed products
    addToRecentlyViewed(product);
    // Navigate to product detail page with product ID
    router.push(`/products/${product._id}`);
  };

  // Load more products
  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  };

  // Scroll detection for lazy loading
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-full mx-auto px-2 py-6">
        <div className="flex gap-3">
          {/* Left Sidebar - Categories */}
          <div className="w-32 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden sticky top-6" style={{ height: 'calc(100vh - 160px)' }}>
              {/* Header */}
              <div className="p-3 border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 text-sm">Categories</h2>
                </div>
              </div>
              
              {/* Categories Grid - Scrollable */}
              <div className="p-3 overflow-y-auto flex-1" style={{ height: 'calc(100vh - 220px)' }}>
                {sidebarMode === 'parent' ? (
                  /* Parent Categories - Images Only */
                  <div className="space-y-3">
                    {/* All Categories Option */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleAllCategoriesClick}
                        className={`w-full h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
                          !selectedCategory
                            ? 'bg-purple-50' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        title="All Categories"
                      >
                        {!selectedCategory && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                        )}
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-1">
                          <Grid3X3 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-[10px] text-gray-600 text-center font-medium leading-tight">All Categories</span>
                      </button>
                    </div>

                    {/* Parent Category Images */}
                    {parentCategories.map((cat) => (
                      <div key={cat._id} className="flex flex-col items-center">
                        <button
                          onClick={() => handleParentCategoryClick(cat)}
                          className={`w-full h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
                            selectedCategory === cat._id
                              ? 'bg-purple-50' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                          title={cat.name}
                        >
                          {selectedCategory === cat._id && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                          )}
                          {cat.thumbnail ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 mb-1">
                              <Image
                                src={cat.thumbnail}
                                alt={cat.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-1">
                              <span className="text-white font-bold text-lg">
                                {cat.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-[10px] text-gray-600 text-center font-medium leading-tight px-1">
                            {cat.name}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Subcategories - Images Only */
                  <div className="space-y-3">
                    {/* Back Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleBackToParentCategories}
                        className="w-full h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative bg-white hover:bg-gray-50"
                        title="Back to Categories"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-1">
                          <ArrowLeft className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-[10px] text-gray-600 text-center font-medium leading-tight">Back</span>
                      </button>
                    </div>

                    {/* All Subcategories Option */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleAllSubcategoryClick}
                        className={`w-full h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
                          !selectedSubcategory
                            ? 'bg-purple-50' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        title="All Subcategories"
                      >
                        {!selectedSubcategory && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                        )}
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-1">
                          <Grid3X3 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-[10px] text-gray-600 text-center font-medium leading-tight">All Subcategories</span>
                      </button>
                    </div>

                    {/* Subcategory Images */}
                    {subcategories.map((subcat) => (
                      <div key={subcat._id} className="flex flex-col items-center">
                        <button
                          onClick={() => handleSubcategoryClick(subcat)}
                          className={`w-full h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
                            selectedSubcategory === subcat._id
                              ? 'bg-purple-50' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                          title={subcat.name}
                        >
                          {selectedSubcategory === subcat._id && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                          )}
                          {subcat.thumbnail ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 mb-1">
                              <Image
                                src={subcat.thumbnail}
                                alt={subcat.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-1">
                              <span className="text-white font-bold text-lg">
                                {subcat.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-[10px] text-gray-600 text-center font-medium leading-tight px-1">
                            {subcat.name}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Products */}
          <div className="flex-1">
            {/* Products Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedSubcategory 
                    ? subcategories.find(s => s._id === selectedSubcategory)?.name
                    : selectedParentCategory
                      ? selectedParentCategory.name
                      : 'All Products'
                  }
                </h1>
                {viewMode === 'list' && (
                  <p className="text-gray-600 mt-1">
                    {productsLoading ? 'Loading products...' : (
                      hasActiveFilters ? 
                        `${products.length} of ${allProducts.length} product${allProducts.length !== 1 ? 's' : ''} found` :
                        `${products.length} product${products.length !== 1 ? 's' : ''} found`
                    )}
                  </p>
                )}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBrands.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Brand: {selectedBrands.map(id => brands.find(b => b._id === id)?.name || id).join(', ')}
                      </span>
                    )}
                    {sortBy !== 'relevance' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Sort: {sortBy === 'price-low' ? 'Price: Low to High' : 
                               sortBy === 'price-high' ? 'Price: High to Low' : 
                               sortBy === 'newest' ? 'Newest First' : sortBy}
                      </span>
                    )}
                    {(priceRange[0] > 10 || priceRange[1] < 100000) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Price: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sort Dropdown with Enhanced Price Range */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Filter Dropdowns - Hidden by default */}
                {showFilters && (
                  <div className="flex flex-wrap items-center gap-3 transition-all duration-300 ease-in-out animate-in slide-in-from-left-2">
                    {/* Brand Dropdown */}
                    <div className="relative brand-dropdown">
                                             <button
                         onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                         className="w-[220px] h-[40px] bg-white border border-gray-300 hover:bg-gray-50 shadow-sm focus:ring-0 focus:border-gray-300 focus:outline-none focus-visible:ring-0 focus-visible:border-gray-300 focus-visible:outline-none flex items-center justify-between px-3 rounded-lg text-left"
                         style={{ boxShadow: 'none' }}
                       >
                         <span className="truncate">
                           {loadingBrands 
                             ? "Loading..." 
                             : selectedBrands.length === 0 
                               ? "Select Brand" 
                               : selectedBrands.length === 1 
                                 ? brands.find(b => b._id === selectedBrands[0])?.name || "Brand"
                                 : "Multiple Brands"
                           }
                         </span>
                         <svg
                           xmlns="http://www.w3.org/2000/svg"
                           viewBox="0 0 20 20"
                           fill="currentColor"
                           className="h-4 w-4 text-gray-400"
                         >
                           <path
                             fillRule="evenodd"
                             d="M5.293 7.293a1 1 0 011.293 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                             clipRule="evenodd"
                           />
                         </svg>
                       </button>
                                             {showBrandDropdown && (
                         <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                           {/* Header */}
                           <div className="p-3 border-b border-gray-200 bg-gray-50">
                             <div className="flex items-center justify-between">
                               <span className="font-medium text-gray-700">Select Brands</span>
                               <button
                                 onClick={() => setSelectedBrands([])}
                                 className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                               >
                                 Clear All
                               </button>
                             </div>
                           </div>
                           
                           {/* Brand List */}
                           <div className="p-2">
                             {loadingBrands ? (
                               <div className="px-3 py-2 text-sm text-gray-500">Loading brands...</div>
                             ) : brands.length === 0 ? (
                               <div className="px-3 py-2 text-sm text-gray-500">No brands available</div>
                             ) : (
                               brands.map((brand) => (
                                 <label key={brand._id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={selectedBrands.includes(brand._id)}
                                     onChange={(e) => {
                                       if (e.target.checked) {
                                         setSelectedBrands(prev => [...prev, brand._id]);
                                       } else {
                                         setSelectedBrands(prev => prev.filter(b => b !== brand._id));
                                       }
                                     }}
                                     className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                   />
                                   <span className="ml-3 text-sm text-gray-700">{brand.name}</span>
                                 </label>
                               ))
                             )}
                           </div>
                         </div>
                       )}
                    </div>
                    

                    
                    {/* Sort Dropdown with Price Range */}
                    <Select value={sortBy} onValueChange={(value) => handleFilterChange('sort', value)}>
                      <SelectTrigger className="w-[180px] h-[40px] bg-white border border-gray-300 hover:bg-gray-50 shadow-sm focus:ring-0 focus:border-gray-300 focus:outline-none focus-visible:ring-0 focus-visible:border-gray-300 focus-visible:outline-none" style={{ boxShadow: 'none' }}>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="relevance" className="hover:bg-green-50">Relevance</SelectItem>
                        <SelectItem value="price-low" className="hover:bg-green-50">Price: Low to High</SelectItem>
                        <SelectItem value="price-high" className="hover:bg-green-50">Price: High to Low</SelectItem>
                        <SelectItem value="newest" className="hover:bg-green-50">Newest First</SelectItem>
                        
                        {/* Price Range Section */}
                        <div className="border-t border-gray-200 pt-3 mt-3 bg-gradient-to-r from-gray-50 to-white">
                          <div className="px-3 pb-3">
                            <div className="flex items-center mb-3">
                              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Price Range
                              </span>
                            </div>
                            <div className="w-full mb-3 px-2">
                              <div className="bg-gray-100 p-3 rounded border w-[280px]">
                                <div className="w-full space-y-4">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-2 font-medium">Min Price: ₹{priceRange[0].toLocaleString()}</label>
                                    <Slider
                                      value={[priceRange[0]]}
                                      onValueChange={(value) => {
                                        const newMin = value[0];
                                        console.log('Min price slider changed to:', newMin);
                                        if (newMin < priceRange[1]) {
                                          const newRange: [number, number] = [newMin, priceRange[1]];
                                          console.log('Setting new price range:', newRange);
                                          setPriceRange(newRange);
                                        }
                                      }}
                                      min={10}
                                      max={priceRange[1] - 100}
                                      step={100}
                                      className="w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-2 font-medium">Max Price: ₹{priceRange[1].toLocaleString()}</label>
                                    <Slider
                                      value={[priceRange[1]]}
                                      onValueChange={(value) => {
                                        const newMax = value[0];
                                        console.log('Max price slider changed to:', newMax);
                                        if (newMax > priceRange[0]) {
                                          const newRange: [number, number] = [priceRange[0], newMax];
                                          console.log('Setting new price range:', newRange);
                                          setPriceRange(newRange);
                                        }
                                      }}
                                      min={priceRange[0] + 100}
                                      max={100000}
                                      step={100}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 bg-white px-3 py-2 rounded border w-[280px] mx-2">
                              <span className="font-medium">₹{priceRange[0].toLocaleString()}</span>
                              <span className="text-gray-400">-</span>
                              <span className="font-medium">₹{priceRange[1].toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Filter Button / Close Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  title={showFilters ? "Close filters" : "Show filters"}
                  className={`px-4 h-[40px] rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center relative ${
                    showFilters
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                  {hasActiveFilters && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {[selectedBrands.length > 0, priceRange[0] > 10, priceRange[1] < 100000, sortBy !== 'relevance'].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    title="Reset all filters"
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Products Grid/List */}
            {(productsLoading || showSkeleton) && products.length === 0 && !locationProducts?.success ? (
              <ProductGridSkeleton count={14} viewMode={viewMode} />
            ) : hasActiveFilters && products.length === 0 && allProducts.length > 0 ? (
              <div className="text-center py-14 px-4">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                      <Filter className="h-12 w-12 text-yellow-500" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No Products Match Your Filters
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Try adjusting your filters or browse all products to find what you're looking for.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={handleAllCategoriesClick}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Browse All Products
                    </button>
                  </div>
                </div>
              </div>
            ) : productsError ? (
              <div className="text-center py-14 px-4">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-4xl">⚠️</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Unable to Load Products
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    There was an error loading products. This might be due to a temporary server issue.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => refetchProducts()}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleAllCategoriesClick}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Browse All Products
                    </button>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-xs text-gray-400">
                      Error: {productsError?.message || 'Unknown error occurred'}
                    </div>
                  </div>
                </div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`${viewMode === 'grid'
                    ? 'grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8'
                    : 'space-y-3'
                }`}>
                  {products.map((product) => {
                    // Create a unique key for quantity tracking that includes variant
                    const variantId = product.variantId;
                    const cartKey = variantId ? `${product._id}:${variantId}` : product._id;
                    const productQuantity = quantities[cartKey] || 0;
                    
                    return (
                    <ProductCard
                        key={`${product._id}-${variantId || 'default'}`}
                      product={product}
                      isInWishlist={isInWishlist}
                      handleWishlistClick={handleWishlistClick}
                      handleAddToCart={handleAddToCart}
                        handleInc={handleInc}
                        handleDec={handleDec}
                        quantity={productQuantity}
                      viewMode={viewMode}
                      onClick={() => {
                        addToRecentlyViewed(product);
                        router.push(`/products/${product._id}`);
                      }}
                    />
                    );
                  })}
                </div>
                
                {/* Loading More Indicator */}
                {loadingMore && (
                  <div className="mt-6">
                    <ProductGridSkeleton count={6} viewMode={viewMode} />
                  </div>
                )}
                
                {/* Load More Button (fallback) */}
                {!loadingMore && hasMore && (
                  <div className="flex justify-center py-8">
                    <button
                      onClick={loadMoreProducts}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Load More Products
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-14 px-4">
                <div className="max-w-md mx-auto">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Grid3X3 className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Main Message */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {searchQuery ? `No products match "${searchQuery}"` : selectedCategory ? `No products found in this category` : 'No products available'}
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                  {searchQuery 
                      ? "Try adjusting your search terms or browse our categories to find what you're looking for."
                      : selectedCategory 
                        ? "This category is currently empty. Check back later or explore other categories."
                        : "This category is currently empty. Check back later or explore other categories."
                  }
                </p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Clear Search
                      </button>
                    )}
                    <button
                      onClick={handleAllCategoriesClick}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Browse All Products
                    </button>
                  </div>
                  
                  {/* Helpful Tips */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Grid3X3 className="w-3 h-3" />
                        Try different keywords
                      </span>
                      <span className="flex items-center gap-1">
                        <Grid3X3 className="w-3 h-3" />
                        Browse categories
                      </span>
                      <span className="flex items-center gap-1">
                        <List className="w-3 h-3" />
                        Adjust filters
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}