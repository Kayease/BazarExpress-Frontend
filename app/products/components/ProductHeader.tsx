import { memo, useState, useEffect } from 'react';
import { Grid3X3, List, X, Filter, TrendingUp, IndianRupee } from 'lucide-react';
import { ViewMode } from '../types';

interface ProductHeaderProps {
  category?: string;
  subcategory?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  productsCount: number;
  categoryName?: string;
  subcategoryName?: string;
  brands: any[];
  selectedBrands: string[];
  onBrandChange: (brands: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (min: number, max: number) => void;
}

function ProductHeader({
  category,
  subcategory,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onResetFilters,
  productsCount,
  categoryName,
  subcategoryName,
  brands,
  selectedBrands,
  onBrandChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange
}: ProductHeaderProps) {
  // Determine title based on category/subcategory
  const title = subcategoryName || categoryName || 'All Products';
  
  // State for dropdown visibility
  const [dropdownStates, setDropdownStates] = useState({
    brandDropdown: false,
    sortDropdown: false,
    priceDropdown: false
  });





  // Sort options for products page (different from search page)
  const SORT_OPTIONS = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popularity', label: 'Most Popular' }
  ];

  // Handle click outside to close dropdowns (using same approach as search page)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.brand-dropdown') && !target.closest('.sort-dropdown') && !target.closest('.price-dropdown')) {

        setDropdownStates(prev => ({ brandDropdown: false, sortDropdown: false, priceDropdown: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // Handle price range changes
  const handleMinPriceChange = (value: number[]) => {
    const newMin = value[0];
    if (newMin < priceRange[1]) {
      onPriceRangeChange(newMin, priceRange[1]);
    }
  };

  const handleMaxPriceChange = (value: number[]) => {
    const newMax = value[0];
    if (newMax > priceRange[0]) {
      onPriceRangeChange(priceRange[0], newMax);
    }
  };

  // Check if price filter is active
  const isPriceFilterActive = priceRange[0] !== 10 || priceRange[1] !== 100000;
  


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4">
      {/* Main Header Row */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate flex-1">
          {title}
        </h1>
        
        {/* View Mode Toggle Only */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            aria-label="List view"
          >
            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Products Count & Filter Buttons Row */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm sm:text-base text-gray-600 flex-shrink-0">
          {productsCount} product{productsCount !== 1 ? 's' : ''} found
        </p>
        
        <div className="flex items-center gap-1 flex-nowrap flex-shrink-0" style={{ overflow: 'visible' }}>
          {/* Brand Filter Icon */}
        <div className="relative brand-dropdown" style={{ overflow: 'visible', zIndex: 50 }}>
          <button
            onClick={() => {
              setDropdownStates(prev => ({ 
                brandDropdown: !prev.brandDropdown, 
                sortDropdown: false, 
                priceDropdown: false 
              }));
            }}
            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
              selectedBrands.length > 0 
                ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Select brand filter"
          >
            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span 
              className="hidden md:inline text-xs font-medium max-w-20 truncate"
              title={selectedBrands.length === 0 
                ? "Brands" 
                : selectedBrands.length === 1 
                  ? brands.find(b => b._id === selectedBrands[0])?.name || "Brand"
                  : `${selectedBrands.length} Brands`
              }
            >
              {selectedBrands.length === 0 
                ? "Brands" 
                : selectedBrands.length === 1 
                  ? brands.find(b => b._id === selectedBrands[0])?.name || "Brand"
                  : `${selectedBrands.length} Brands`
              }
            </span>
          </button>
          {dropdownStates.brandDropdown && (
            <div 
              className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50"
              style={{ 
                opacity: 1, 
                visibility: 'visible',
                display: 'block',
                zIndex: 1000
              }}
            >
              <div className="p-2">
                <div className="max-h-48 overflow-y-auto">
                  {brands.map((brand) => (
                    <label key={brand._id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onBrandChange([...selectedBrands, brand._id]);
                          } else {
                            onBrandChange(selectedBrands.filter(b => b !== brand._id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort Filter Icon */}
        <div className="relative sort-dropdown" style={{ overflow: 'visible', zIndex: 50 }}>
          <button
            onClick={() => {
              setDropdownStates(prev => ({ 
                brandDropdown: false, 
                sortDropdown: !prev.sortDropdown, 
                priceDropdown: false 
              }));
            }}
            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
              sortBy !== 'relevance' 
                ? 'bg-green-100 text-green-600 border border-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Select sort option"
          >
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span 
              className="hidden md:inline text-xs font-medium max-w-24 truncate"
              title={sortBy === 'relevance' 
                ? "Sort" 
                : SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || "Sort"
              }
            >
              {sortBy === 'relevance' 
                ? "Sort" 
                : SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || "Sort"
              }
            </span>
          </button>
          {dropdownStates.sortDropdown && (
            <div 
              className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
              style={{ 
                opacity: 1, 
                visibility: 'visible',
                display: 'block',
                zIndex: 1000
              }}
            >
              <div className="p-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setDropdownStates(prev => ({ ...prev, sortDropdown: false }));
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                      sortBy === option.value 
                        ? 'bg-green-100 text-green-700 font-medium' 
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

        {/* Price Filter Icon */}
        <div className="relative price-dropdown" style={{ overflow: 'visible', zIndex: 50 }}>
          <button
            onClick={() => {
              setDropdownStates(prev => ({ 
                brandDropdown: false, 
                sortDropdown: false, 
                priceDropdown: !prev.priceDropdown 
              }));
            }}
            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
              isPriceFilterActive
                ? 'bg-purple-100 text-purple-600 border border-purple-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Set price range"
          >
            <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden md:inline text-xs font-medium">
              Price
            </span>
          </button>
          {dropdownStates.priceDropdown && (
            <div 
              className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50"
              style={{ 
                opacity: 1, 
                visibility: 'visible',
                display: 'block',
                zIndex: 1000
              }}
            >
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Price Range
                  </span>
                </div>
                <div className="w-full space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 font-medium">Min Price: ₹{priceRange[0].toLocaleString()}</label>
                    <input
                      type="range"
                      min={10}
                      max={priceRange[1] - 100}
                      step={100}
                      value={priceRange[0]}
                      onChange={(e) => handleMinPriceChange([parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 font-medium">Max Price: ₹{priceRange[1].toLocaleString()}</label>
                    <input
                      type="range"
                      min={priceRange[0] + 100}
                      max={100000}
                      step={100}
                      value={priceRange[1]}
                      onChange={(e) => handleMaxPriceChange([parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded border mt-3">
                  <span className="font-medium">₹{priceRange[0].toLocaleString()}</span>
                  <span className="text-gray-400">-</span>
                  <span className="font-medium">₹{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="p-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1"
            aria-label="Clear all filters"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden md:inline text-xs font-medium">Clear</span>
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

export default memo(ProductHeader); 