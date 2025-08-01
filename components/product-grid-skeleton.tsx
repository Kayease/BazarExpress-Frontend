"use client";

import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

const ProductGridSkeleton = memo(({ count = 6, className = '' }: ProductGridSkeletonProps) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

ProductGridSkeleton.displayName = 'ProductGridSkeleton';

export default ProductGridSkeleton;