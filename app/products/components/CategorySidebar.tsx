import { useEffect, useState, memo, useRef } from 'react';
import Image from 'next/image';
import { Grid3X3, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '../types';

interface CategorySidebarProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategoryChange: (category?: string) => void;
  onSubcategoryChange: (subcategory?: string) => void;
}

function CategorySidebar({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange
}: CategorySidebarProps) {
  // State
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'parent' | 'subcategory'>('parent');
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  
  // Debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[CategorySidebar] ${message}`, data || '');
  };

  // Fetch parent categories on mount
  useEffect(() => {
    fetchParentCategories();
  }, []);

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
  }, [selectedCategory, parentCategories.length, selectedSubcategory, sidebarMode]);

  // Function to fetch parent categories
  const fetchParentCategories = async () => {
    try {
      setLoadingCategories(true);
      logDebug('Fetching parent categories');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ;
      const response = await fetch(`${apiUrl}/categories`);
      
      if (response.ok) {
        const categories = await response.json();
        // Filter only parent categories (no parentId or empty parentId)
        const parents = categories.filter((cat: Category) => !cat.parentId || cat.parentId === '');
        setParentCategories(parents);
        logDebug('Parent categories fetched', { count: parents.length });
      } else {
        logDebug('Error fetching parent categories', { status: response.status });
      }
    } catch (error) {
      logDebug('Exception fetching categories', { error });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Function to fetch subcategories
  const fetchSubcategories = async (parentId: string) => {
    if (!parentId) return;
    
    try {
      logDebug('Fetching subcategories', { parentId });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ;
      const response = await fetch(`${apiUrl}/categories/subcategories/${parentId}`);
      
      if (response.ok) {
        const subs = await response.json();
        setSubcategories(subs);
        logDebug('Subcategories fetched', { count: subs.length });
      } else {
        logDebug('Error fetching subcategories', { status: response.status });
        setSubcategories([]);
      }
    } catch (error) {
      logDebug('Exception fetching subcategories', { error });
      setSubcategories([]);
    }
  };

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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden sticky top-6" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Header */}
        <div className="p-2 sm:p-3 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-xs sm:text-sm">Categories</h2>
          </div>
        </div>
        
        {/* Categories Grid - Scrollable */}
        <div className="p-2 sm:p-3 overflow-y-auto flex-1" style={{ height: 'calc(100vh - 220px)' }}>
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
              {parentCategories.map((cat) => (
                <div key={cat._id} className="flex flex-col items-center">
                  <button
                    onClick={() => handleParentCategoryClick(cat)}
                    className={`w-full h-16 sm:h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
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
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-100 mb-1">
                        <Image
                          src={cat.thumbnail}
                          alt={cat.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
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
              ))}
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
              {subcategories.map((subcat) => (
                <div key={subcat._id} className="flex flex-col items-center">
                  <button
                    onClick={() => handleSubcategoryClick(subcat)}
                    className={`w-full h-16 sm:h-20 rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative ${
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
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-100 mb-1">
                        <Image
                          src={subcat.thumbnail}
                          alt={subcat.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-1">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {subcat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-[8px] sm:text-[10px] text-gray-600 text-center font-medium leading-tight px-1">
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
  );
}

export default memo(CategorySidebar);