import { ReactNode } from 'react';
import { Grid3X3, Filter } from 'lucide-react';
import ProductGridSkeleton from '@/components/product-grid-skeleton';

interface ProductLoadingStateProps {
  children: ReactNode;
  isLoading: boolean;
  error: any;
  isEmpty: boolean;
  hasActiveFilters: boolean;
  searchQuery?: string;
  categoryName?: string;
  subcategoryName?: string;
  onClearSearch: () => void;
  onResetFilters: () => void;
  onBrowseAll: () => void;
  onStayInCategory?: () => void;
}

export function ProductLoadingState({
  children,
  isLoading,
  error,
  isEmpty,
  hasActiveFilters,
  searchQuery,
  categoryName,
  subcategoryName,
  onClearSearch,
  onResetFilters,
  onBrowseAll,
  onStayInCategory
}: ProductLoadingStateProps) {
  if (isLoading) {
    return <ProductGridSkeleton count={14} viewMode="grid" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 px-4 text-center min-h-[60vh]">
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
              onClick={onBrowseAll}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Browse All Products
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-400">
              Error: {error?.message || 'Unknown error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    if (hasActiveFilters) {
      return (
        <div className="flex items-center justify-center py-16 px-4 text-center min-h-[60vh]">
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
                onClick={onResetFilters}
                className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors font-medium"
              >
                Reset Filters
              </button>
              <button
                onClick={onBrowseAll}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Browse All Products
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Create a category display message
    const categoryDisplay = categoryName && subcategoryName 
      ? `${categoryName} > ${subcategoryName}` 
      : categoryName || '';

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
        <div>
          <div className="mb-6">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Grid3X3 className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
            {searchQuery 
              ? `No results for "${searchQuery}"` 
              : categoryDisplay 
                ? `Nothing in ${categoryDisplay} yet` 
                : 'No products available'
            }
          </h3>

          <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-gray-600">
            {searchQuery 
              ? "Try different keywords, remove special characters, or browse all products."
              : categoryDisplay
                ? "Hang tight—this category will be available soon!"
                : "We couldn't find anything to show. Check back soon or browse our catalog."
            }
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary-dark"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}