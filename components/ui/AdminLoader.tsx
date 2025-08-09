import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function AdminLoader({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: AdminLoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center py-16';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-brand-primary mx-auto mb-4`} />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Skeleton loader for table rows
export function AdminTableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse border-b border-gray-200">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="py-4 px-3">
              <div className="h-4 bg-gray-200 rounded"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Skeleton loader for grid items
export function AdminGridSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 animate-pulse">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 bg-gray-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for brand grid
export function AdminBrandSkeleton({ items = 12 }: { items?: number }) {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 animate-pulse">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-gray-200"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="flex gap-1 justify-center">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for category grid
export function AdminCategorySkeleton({ items = 12 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gray-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}