import { useState, memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Brand } from '../types';

interface ProductFiltersProps {
  brands: Brand[];
  selectedBrands: string[];
  onBrandChange: (brands: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (min: number, max: number) => void;
}

function ProductFilters({
  brands,
  selectedBrands,
  onBrandChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange
}: ProductFiltersProps) {
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  // Debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[ProductFilters] ${message}`, data || '');
  };

  // Handle brand selection
  const handleBrandChange = (brandId: string, isChecked: boolean) => {
    logDebug('Brand selection changed', { brandId, isChecked });
    
    if (isChecked) {
      onBrandChange([...selectedBrands, brandId]);
    } else {
      onBrandChange(selectedBrands.filter(id => id !== brandId));
    }
  };

  // Handle price range change
  const handleMinPriceChange = (value: number[]) => {
    const newMin = value[0];
    logDebug('Min price changed', { from: priceRange[0], to: newMin });
    
    if (newMin < priceRange[1]) {
      onPriceRangeChange(newMin, priceRange[1]);
    }
  };

  const handleMaxPriceChange = (value: number[]) => {
    const newMax = value[0];
    logDebug('Max price changed', { from: priceRange[1], to: newMax });
    
    if (newMax > priceRange[0]) {
      onPriceRangeChange(priceRange[0], newMax);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 transition-all duration-300 ease-in-out animate-in slide-in-from-left-2">
      {/* Brand Dropdown */}
      <div className="relative brand-dropdown">
        <button
          onClick={() => setShowBrandDropdown(!showBrandDropdown)}
          className="w-[220px] h-[40px] bg-white border border-gray-300 hover:bg-gray-50 shadow-sm focus:ring-0 focus:border-gray-300 focus:outline-none focus-visible:ring-0 focus-visible:border-gray-300 focus-visible:outline-none flex items-center justify-between px-3 rounded-lg text-left"
          style={{ boxShadow: 'none' }}
        >
          <span className="truncate">
            {selectedBrands.length === 0 
              ? "Select Brand" 
              : selectedBrands.length === 1 
                ? brands.find(b => b._id === selectedBrands[0])?.name || "Brand"
                : `${selectedBrands.length} Brands Selected`
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
                  onClick={() => onBrandChange([])}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {/* Brand List */}
            <div className="p-2">
              {brands.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No brands available</div>
              ) : (
                brands.map((brand) => (
                  <label key={brand._id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand._id)}
                      onChange={(e) => handleBrandChange(brand._id, e.target.checked)}
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
      <Select value={sortBy} onValueChange={onSortChange}>
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
                        onValueChange={handleMinPriceChange}
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
                        onValueChange={handleMaxPriceChange}
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
  );
}

export default memo(ProductFilters);