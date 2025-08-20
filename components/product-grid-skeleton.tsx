"use client";

import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
  viewMode?: 'grid' | 'list';
}

const ProductGridSkeleton = memo(({ count = 4, className = '', viewMode = 'grid' }: ProductGridSkeletonProps) => {
  if (viewMode === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="bg-white border border-gray-100 rounded-lg p-3 animate-pulse">
            <div className="flex gap-3">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              </div>
              
              {/* Product Details */}
              <div className="flex-1 space-y-2">
                {/* Store Type Badge */}
                <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
                
                {/* Product Name */}
                <div className="space-y-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                
                {/* Unit */}
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                
                {/* Price Section */}
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex-shrink-0 ml-3">
                <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid view skeleton with enhanced styling
  return (
    <div className={`grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="w-full max-w-[180px] bg-white border rounded-lg flex flex-col relative animate-pulse"
          style={{ fontFamily: 'Sinkin Sans, sans-serif', boxShadow: 'none' }}
        >
          {/* Discount Badge Skeleton */}
          <div className="absolute left-3 top-0 z-10 flex items-center justify-center" style={{ width: '29px', height: '28px' }}>
            <div className="w-full h-full bg-gray-200 rounded-b"></div>
          </div>
          
          {/* Product Image */}
          <div className="aspect-square w-full p-3">
            <div className="w-full h-full bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Product Details */}
          <div className="p-3 pt-0 flex-1 flex flex-col justify-between">
            {/* Store Type */}
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2.5 h-2.5 bg-gray-200 rounded-full"></div>
              <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
            </div>
            
            {/* Product Name */}
            <div className="space-y-1 mb-1">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
            
            {/* Unit */}
            <div className="mb-1">
              <div className="h-2.5 bg-gray-200 rounded w-12"></div>
            </div>
            
            {/* Price and Button */}
            <div className="flex items-end justify-between mt-1">
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-2.5 bg-gray-200 rounded w-10"></div>
              </div>
              
              {/* Add Button */}
              <div 
                className="bg-gray-200 rounded"
                style={{ minWidth: '65px', width: '65px', height: '26px' }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

ProductGridSkeleton.displayName = 'ProductGridSkeleton';

export default ProductGridSkeleton;