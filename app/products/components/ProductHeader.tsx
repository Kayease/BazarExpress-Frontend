import { memo } from 'react';
import { Grid3X3, List, X, Filter } from 'lucide-react';
import { ViewMode } from '../types';

interface ProductHeaderProps {
  category?: string;
  subcategory?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  productsCount: number;
  categoryName?: string;
  subcategoryName?: string;
}

function ProductHeader({
  category,
  subcategory,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onResetFilters,
  productsCount,
  categoryName,
  subcategoryName
}: ProductHeaderProps) {
  // Determine title based on category/subcategory
  const title = subcategoryName || categoryName || 'All Products';
  
  // Count of active filters
  const activeFiltersCount = hasActiveFilters ? 1 : 0;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>
        {viewMode === 'list' && (
          <p className="text-gray-600 mt-1">
            {productsCount} product{productsCount !== 1 ? 's' : ''} found
          </p>
        )}
      </div>
      
      {/* Sort and Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        
        {/* Filter Button / Close Button */}
        <button
          onClick={onToggleFilters}
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
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            title="Reset all filters"
            className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ProductHeader);