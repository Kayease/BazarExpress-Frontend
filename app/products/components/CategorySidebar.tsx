import { useEffect, useState, memo, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Grid3X3, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '../types';
import OptimizedImage from '@/components/OptimizedImage';

interface CategorySidebarProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategoryChange: (category?: string) => void;
  onSubcategoryChange: (subcategory?: string) => void;
  initialParentCategories?: Category[];
}

// Cache for categories to prevent refetching
const categoriesCache = new Map<string, { data: Category[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function CategorySidebar({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  initialParentCategories
}: CategorySidebarProps) {
  // State
  const [parentCategories, setParentCategories] = useState<Category[]>(initialParentCategories || []);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'parent' | 'subcategory'>('parent');
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  
  // Debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[CategorySidebar] ${message}`, data || '');
  };

  // Check if cached data is still valid
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  // Fetch parent categories with caching
  const fetchParentCategories = useCallback(async () => {
    try {
      // Check cache first
      const cached = categoriesCache.get('parent');
      if (cached && isCacheValid(cached.timestamp)) {
        setParentCategories(cached.data);
        logDebug('Using cached parent categories', { count: cached.data.length });
        return;
      }

      setLoadingCategories(true);
      logDebug('Fetching parent categories');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/categories`);
      
      if (response.ok) {
        const categories = await response.json();
        // Filter only parent categories (no parentId or empty parentId)
        const parents = categories.filter((cat: Category) => !cat.parentId || cat.parentId === '');
        
        // Cache the data
        categoriesCache.set('parent', { data: parents, timestamp: Date.now() });
        
        setParentCategories(parents);
        logDebug('Parent categories fetched and cached', { count: parents.length });
      } else {
        logDebug('Error fetching parent categories', { status: response.status });
      }
    } catch (error) {
      logDebug('Error fetching parent categories', error);
    } finally {
      setLoadingCategories(false);
    }
  }, [isCacheValid, logDebug]);

  // Fetch subcategories with caching
  const fetchSubcategories = useCallback(async (parentId: string) => {
    try {
      // Check cache first
      const cacheKey = `subcategories_${parentId}`;
      const cached = categoriesCache.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        setSubcategories(cached.data);
        logDebug('Using cached subcategories', { count: cached.data.length });
        return;
      }

      logDebug('Fetching subcategories for parent', { parentId });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/categories/subcategories/${parentId}`);
      
      if (response.ok) {
        const subcategoriesData = await response.json();
        
        // Cache the data
        categoriesCache.set(cacheKey, { data: subcategoriesData, timestamp: Date.now() });
        
        setSubcategories(subcategoriesData);
        logDebug('Subcategories fetched and cached', { count: subcategoriesData.length });
      } else {
        logDebug('Error fetching subcategories', { status: response.status });
        setSubcategories([]);
      }
    } catch (error) {
      logDebug('Error fetching subcategories', error);
      setSubcategories([]);
    }
  }, [isCacheValid, logDebug]);

  // Initialize from props then fetch/fill cache
  useEffect(() => {
    if (initialParentCategories && initialParentCategories.length > 0) {
      categoriesCache.set('parent', { data: initialParentCategories, timestamp: Date.now() });
    }
    fetchParentCategories();
  }, [initialParentCategories, fetchParentCategories]);

  // Track if we've manually set the sidebar mode
  const manualModeChange = useRef(false);

  // Update sidebar mode based on selection
  useEffect(() => {
    // Skip this effect if we manually changed the mode
    if (manualModeChange.current) {
      logDebug('Skipping sidebar mode update due to manual change');
      manualModeChange.current = false;
      return;
    }

    if (selectedCategory) {
      // Find the selected parent category
      const parent = parentCategories.find(cat => cat._id === selectedCategory);
      if (parent) {
        // Update the parent category reference
        setSelectedParentCategory(parent);
        
        // IMPORTANT: Only switch to subcategory mode if we have a subcategory selected
        // or if we're not in the process of going back
        if (selectedSubcategory || sidebarMode !== 'parent') {
          setSidebarMode('subcategory');
          
          // Fetch subcategories for this parent
          fetchSubcategories(selectedCategory);
          logDebug('Switched to subcategory mode', { 
            selectedCategory, 
            parent: parent.name,
            subcategory: selectedSubcategory || 'All Subcategories'
          });
        } else {
          logDebug('Maintaining parent category mode', {
            selectedCategory,
            parent: parent.name
          });
        }
      }
    } else {
      // When no category is selected, we're in parent categories view
      setSidebarMode('parent');
      setSelectedParentCategory(null);
      logDebug('Switched to parent category mode');
    }
  }, [selectedCategory, parentCategories.length, selectedSubcategory, sidebarMode, fetchSubcategories]);

  // Memoized category rendering functions for better performance
  const renderCategoryButton = useCallback((cat: Category, isSelected: boolean, onClick: () => void, title: string, index?: number) => (
    <div key={cat._id} className="flex flex-col items-center">
      <button
        onClick={onClick}
        className={`w-full h-16 sm:h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
          isSelected
            ? 'bg-purple-50' 
            : 'bg-white hover:bg-gray-50'
        }`}
        title={title}
      >
        {isSelected && (
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
        )}
        {cat.thumbnail ? (
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-100 mb-1">
            <OptimizedImage
              src={cat.thumbnail}
              alt={cat.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              sizes="48px"
              priority={typeof index === 'number' ? index < 6 : false}
              quality={60}
            />
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-1">
            <span className="text-white font-bold text-sm sm:text-lg">
              {cat.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-[8px] sm:text-[10px] text-gray-600 text-center font-medium leading-tight px-1">
          {cat.name}
        </span>
      </button>
    </div>
  ), []);

  // Memoized parent categories rendering
  const parentCategoriesElements = useMemo(() => 
    parentCategories.map((cat, idx) => 
      renderCategoryButton(
        cat,
        selectedCategory === cat._id,
        () => handleParentCategoryClick(cat),
        cat.name,
        idx
      )
    ), [parentCategories, selectedCategory, renderCategoryButton]);

  // Memoized subcategories rendering
  const subcategoriesElements = useMemo(() => 
    subcategories.map((subcat, idx) => 
      renderCategoryButton(
        subcat,
        selectedSubcategory === subcat._id,
        () => handleSubcategoryClick(subcat),
        subcat.name,
        idx
      )
    ), [subcategories, selectedSubcategory, renderCategoryButton]);

  // Handle parent category click
  const handleParentCategoryClick = (category: Category) => {
    logDebug('Parent category clicked', { id: category._id, name: category.name });
    
    // Set manual mode change flag to prevent the useEffect from overriding our change
    manualModeChange.current = true;
    
    // Update local state synchronously
    setSelectedParentCategory(category);
    setSidebarMode('subcategory');
    
    // Clear any existing subcategory selection
    onSubcategoryChange(undefined);
    
    // Fetch subcategories immediately
    fetchSubcategories(category._id);
    
    // Update category selection after state is updated
    onCategoryChange(category._id);
    
    logDebug('Parent category selected', { 
      categoryId: category._id,
      action: 'Showing all products from this category with All Subcategories selected'
    });
  };

  // Handle back to parent categories
  const handleBackToParentCategories = () => {
    logDebug('Back to parent categories clicked');
    
    // Set manual mode change flag
    manualModeChange.current = true;
    
    // Always switch to parent categories view first
    setSidebarMode('parent');
    setSelectedParentCategory(null);
    
    // Update URL directly to remove all category parameters
    router.push('/products');
    
    logDebug('Back to parent categories - showing all categories', {
      action: 'Showing all categories',
      sidebarMode: 'parent',
      url: 'Cleared all category parameters'
    });
  };

  // Handle subcategory click
  const handleSubcategoryClick = (subcategory: Category) => {
    logDebug('Subcategory clicked', { id: subcategory._id, name: subcategory.name });
    
    // Set manual mode change flag
    manualModeChange.current = true;
    
    // Make sure we're in subcategory mode
    setSidebarMode('subcategory');
    
    // Make sure we keep the current parent category selected
    if (!selectedParentCategory && selectedCategory) {
      const parent = parentCategories.find(cat => cat._id === selectedCategory);
      if (parent) {
        setSelectedParentCategory(parent);
      }
    }
    
    // Update URL state with a slight delay
    setTimeout(() => {
      // Ensure we have the category set when selecting a subcategory
      if (!selectedCategory && selectedParentCategory) {
        onCategoryChange(selectedParentCategory._id);
      }
      
      onSubcategoryChange(subcategory._id);
      logDebug('Subcategory change propagated to URL', { 
        subcategoryId: subcategory._id,
        categoryId: selectedCategory || (selectedParentCategory ? selectedParentCategory._id : undefined)
      });
    }, 50);
  };

  // Handle all subcategories click
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleAllSubcategoryClick = () => {
    logDebug('All subcategories clicked', { 
      currentCategory: selectedCategory,
      parentCategory: selectedParentCategory?._id 
    });
    
    // Set manual mode change flag
    manualModeChange.current = true;
    
    // Make sure we're still in subcategory mode
    setSidebarMode('subcategory');
    
    // Get the current parent category ID
    const categoryId = selectedParentCategory?._id || selectedCategory;
    
    if (!categoryId) {
      logDebug('Warning: No category selected when clicking All Subcategories');
      return;
    }

    // Create new URLSearchParams with only the category parameter
    const params = new URLSearchParams();
    params.set('category', categoryId);
    
    // Update the URL directly
    router.push(`/products?${params.toString()}`);
    
    logDebug('All subcategories selected', {
      categoryId,
      action: 'Showing all products from parent category',
      url: `Will show only category parameter: /products?${params.toString()}`
    });
  };

  // Handle all categories click
  const handleAllCategoriesClick = () => {
    logDebug('All categories clicked');
    
    // Set manual mode change flag
    manualModeChange.current = true;
    
    // Update local state first
    setSidebarMode('parent');
    setSelectedParentCategory(null);
    
    // Update URL directly to remove all category parameters
    router.push('/products');
    
    logDebug('All categories selected', {
      action: 'Showing all products from all categories',
      url: 'Cleared all category parameters'
    });
  };

  return (
    <div className="w-20 sm:w-24 md:w-28 lg:w-32 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden sticky top-20 sm:top-24 md:top-6" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <div className="p-2 sm:p-3 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-xs sm:text-sm">Categories</h2>
          </div>
        </div>
        
        {/* Categories Grid - Scrollable */}
        <div className="p-2 sm:p-3 overflow-y-auto flex-1" style={{ height: 'calc(100vh - 180px)' }}>
          {sidebarMode === 'parent' ? (
            /* Parent Categories - Images Only */
            <div className="space-y-2 sm:space-y-3">
              {/* All Categories Option */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleAllCategoriesClick}
                  className={`w-full h-16 sm:h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
                    !selectedCategory
                      ? 'bg-purple-50' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  title="All Categories"
                >
                  {!selectedCategory && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                  )}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-1">
                    <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <span className="text-[8px] sm:text-[10px] text-gray-600 text-center font-medium leading-tight">All Categories</span>
                </button>
              </div>

              {/* Parent Category Images */}
              {parentCategoriesElements}
            </div>
          ) : (
            /* Subcategories - Images Only */
            <div className="space-y-2 sm:space-y-3">
              {/* Back Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleBackToParentCategories}
                  className="w-full h-16 sm:h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative bg-white hover:bg-gray-50"
                  title="Back to Categories"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-1">
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <span className="text-[8px] sm:text-[10px] text-gray-600 text-center font-medium leading-tight">Back</span>
                </button>
              </div>

              {/* All Subcategories Option */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleAllSubcategoryClick}
                  className={`w-full h-16 sm:h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
                    !selectedSubcategory
                      ? 'bg-purple-50' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  title="All Subcategories"
                >
                  {!selectedSubcategory && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                  )}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-1">
                    <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <span className="text-[8px] sm:text-[10px] text-gray-600 text-center font-medium leading-tight">All Subcategories</span>
                </button>
              </div>

              {/* Subcategory Images */}
              {subcategoriesElements}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(CategorySidebar);