"use client";

import { useEffect, useState } from 'react';
import { useSearchProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { FilterPanel } from '@/components/filter-panel';

interface LocationBasedProductsProps {
  categoryId?: string;
  searchQuery?: string;
  pincode: string;
}

export function LocationBasedProducts({ categoryId, searchQuery, pincode }: LocationBasedProductsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [filters, setFilters] = useState<any>({});
  
  const {
    data: productsData,
    isLoading,
    error,
    refetch
  } = useSearchProducts(searchQuery || '', {
    category: categoryId,
    pincode,
    page: currentPage,
    limit: 20,
    sort: sortBy,
    ...filters
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, searchQuery, sortBy, filters]);

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading products: {error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const totalProducts = productsData?.totalProducts || 0;

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <img 
          src="/no-results.jpg" 
          alt="No products found" 
          className="w-48 h-48 object-contain mx-auto mb-4 opacity-50"
        />
        <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery 
            ? `No products found for "${searchQuery}" in your area.`
            : categoryId 
              ? "No products found in this category for your area."
              : "No products available in your area."}
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search terms or browse other categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Products'}
          </h2>
          <p className="text-muted-foreground">
            {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {/* Sort options */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="name">Name (A-Z)</option>
            <option value="-name">Name (Z-A)</option>
            <option value="price">Price (Low to High)</option>
            <option value="-price">Price (High to Low)</option>
            <option value="-rating">Rating (High to Low)</option>
            <option value="-createdAt">Newest First</option>
          </select>
        </div>
      </div>

      {/* Filter panel */}
      <FilterPanel filters={filters} onFiltersChange={setFilters} />

      {/* Products grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product: any) => (
          <ProductCard
            key={product._id}
            product={product}
            pincode={pincode}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded ${
                    currentPage === pageNum
                      ? 'bg-primary text-white border-primary'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}