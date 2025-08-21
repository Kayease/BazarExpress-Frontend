"use client";

import { Skeleton } from '@/components/ui/skeleton';

export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <main>
        {/* Hero Section Skeleton */}
        <section className="py-4 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            {/* Main Banner Skeleton */}
            <div className="w-full h-32 sm:h-40 md:h-56 lg:h-64 bg-gray-200 animate-pulse rounded-xl mb-6 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-48 h-6 bg-gray-300 rounded animate-pulse mx-auto"></div>
                <div className="w-32 h-4 bg-gray-300 rounded animate-pulse mx-auto"></div>
              </div>
            </div>
            
            {/* Special Banner Tiles Skeleton */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[16/9] bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section Skeleton */}
        <section className="py-8 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4">
              {/* Mobile: 3 categories (3 cols × 1 row) */}
              {/* Tablet: 6 categories (4 cols × 1.5 rows) */}
              {/* Medium+: 10+ categories (6+ cols × multiple rows) */}
              
              {/* Mobile - 3 categories */}
              <div className="text-center p-2 sm:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="text-center p-2 sm:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="text-center p-2 sm:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>

              {/* Tablet - 6 categories */}
              <div className="hidden sm:block text-center p-2 md:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden sm:block text-center p-2 md:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden sm:block text-center p-2 md:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden sm:block text-center p-2 md:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden sm:block text-center p-2 md:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden sm:block text-center p-2 md:hidden">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>

              {/* Medium+ - 10 categories */}
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="hidden md:block text-center p-2">
                <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section Skeleton */}
        <section className="py-4 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {/* Mobile: 2 products per row */}
              {/* Small: 3 products per row */}
              {/* Medium: 4 products per row */}
              {/* Large: 5 products per row */}
              {/* XL: 6 products per row */}
              {/* 2XL: 7 products per row */}
              
              {/* Mobile - 2 products */}
              <div className="sm:hidden">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="sm:hidden">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>

              {/* Tablet - 4 products */}
              <div className="hidden sm:block md:hidden">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block md:hidden">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block md:hidden">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>

                             {/* Medium+ - 6 products */}
               <div className="hidden md:block">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-full bg-white border rounded-lg flex flex-col relative animate-pulse">
                  <div className="absolute left-2 top-2 z-10 flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                    <div className="w-full h-full bg-gray-200 rounded-b"></div>
                  </div>
                  <div className="aspect-square w-full p-2">
                    <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="p-2 pt-0 flex-1 flex flex-col justify-between">
                    <div className="w-12 h-4 bg-gray-200 rounded-full mb-2"></div>
                    <div className="space-y-1 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


