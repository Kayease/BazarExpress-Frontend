"use client";

import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Table Skeleton for list views
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasActions?: boolean;
  className?: string;
}

export const TableSkeleton = memo(({ 
  rows = 5, 
  columns = 4, 
  hasActions = true, 
  className = '' 
}: TableSkeletonProps) => {
  return (
    <div className={`w-full bg-white rounded-2xl shadow-lg p-0 overflow-x-auto ${className}`}>
      <table className="min-w-[900px] w-full text-left">
        <thead>
          <tr className="bg-gray-50">
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="py-3.5 px-6">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
            {hasActions && (
              <th className="py-3.5 px-6 text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="py-4 px-6">
                  {colIndex === 0 ? (
                    // First column often has images
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  ) : (
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  )}
                </td>
              ))}
              {hasActions && (
                <td className="py-4 px-6">
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

// Card Grid Skeleton for card-based layouts
interface CardGridSkeletonProps {
  count?: number;
  columns?: 'auto' | 1 | 2 | 3 | 4;
  hasImage?: boolean;
  className?: string;
}

export const CardGridSkeleton = memo(({ 
  count = 6, 
  columns = 'auto',
  hasImage = true,
  className = '' 
}: CardGridSkeletonProps) => {
  const getGridClass = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className={`grid ${getGridClass()} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {hasImage && (
            <Skeleton className="aspect-[16/9] w-full rounded-lg mb-4" />
          )}
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

CardGridSkeleton.displayName = 'CardGridSkeleton';

// Stats Cards Skeleton for dashboard
interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export const StatsCardsSkeleton = memo(({ count = 4, className = '' }: StatsSkeletonProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
});

StatsCardsSkeleton.displayName = 'StatsCardsSkeleton';

// Form Skeleton for add/edit forms
interface FormSkeletonProps {
  fields?: number;
  hasImage?: boolean;
  className?: string;
}

export const FormSkeleton = memo(({ 
  fields = 5, 
  hasImage = false, 
  className = '' 
}: FormSkeletonProps) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 space-y-6 ${className}`}>
      {hasImage && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="aspect-video w-full max-w-md rounded-lg" />
        </div>
      )}
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
});

FormSkeleton.displayName = 'FormSkeleton';

// Page Header Skeleton
interface PageHeaderSkeletonProps {
  hasButton?: boolean;
  hasTabs?: boolean;
  tabCount?: number;
  className?: string;
}

export const PageHeaderSkeleton = memo(({ 
  hasButton = true, 
  hasTabs = false,
  tabCount = 2,
  className = '' 
}: PageHeaderSkeletonProps) => {
  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        {hasButton && (
          <div className="flex gap-2">
            {hasTabs && Array.from({ length: tabCount }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-32 rounded-lg" />
            ))}
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
});

PageHeaderSkeleton.displayName = 'PageHeaderSkeleton';

// Full Page Skeleton combining header and content
interface FullPageSkeletonProps {
  type: 'table' | 'cards' | 'stats' | 'form';
  hasButton?: boolean;
  hasTabs?: boolean;
  tabCount?: number;
  contentProps?: any;
  className?: string;
}

export const FullPageSkeleton = memo(({ 
  type, 
  hasButton = true, 
  hasTabs = false,
  tabCount = 2,
  contentProps = {},
  className = '' 
}: FullPageSkeletonProps) => {
  const renderContent = () => {
    switch (type) {
      case 'table':
        return <TableSkeleton {...contentProps} />;
      case 'cards':
        return <CardGridSkeleton {...contentProps} />;
      case 'stats':
        return <StatsCardsSkeleton {...contentProps} />;
      case 'form':
        return <FormSkeleton {...contentProps} />;
      default:
        return <TableSkeleton {...contentProps} />;
    }
  };

  return (
    <div className={className}>
      <PageHeaderSkeleton 
        hasButton={hasButton} 
        hasTabs={hasTabs}
        tabCount={tabCount}
      />
      {renderContent()}
    </div>
  );
});

FullPageSkeleton.displayName = 'FullPageSkeleton';

// Special Banners Skeleton (for banners page)
export const SpecialBannersSkeleton = memo(() => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="aspect-[16/9] rounded-lg" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

SpecialBannersSkeleton.displayName = 'SpecialBannersSkeleton';

// Orders Table Skeleton (specialized for orders)
export const OrdersTableSkeleton = memo(({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-0 overflow-x-auto">
      <table className="min-w-[1200px] w-full text-left">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-3.5 px-6"><Skeleton className="h-4 w-16" /></th>
            <th className="py-3.5 px-6"><Skeleton className="h-4 w-20" /></th>
            <th className="py-3.5 px-6"><Skeleton className="h-4 w-16" /></th>
            <th className="py-3.5 px-6"><Skeleton className="h-4 w-20" /></th>
            <th className="py-3.5 px-6"><Skeleton className="h-4 w-16" /></th>
            <th className="py-3.5 px-6"><Skeleton className="h-4 w-20" /></th>
            <th className="py-3.5 px-6 text-center"><Skeleton className="h-4 w-16 mx-auto" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
              <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>
              <td className="py-4 px-6"><Skeleton className="h-4 w-16" /></td>
              <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
              <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
              <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
              <td className="py-4 px-6">
                <div className="flex justify-center">
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

OrdersTableSkeleton.displayName = 'OrdersTableSkeleton';