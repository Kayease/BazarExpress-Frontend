"use client";

import { lazy, Suspense, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductGridSkeleton from '@/components/product-grid-skeleton';

// Lazy load heavy components
export const LazyCartDrawer = lazy(() => import('@/components/cart-drawer'));
export const LazyProductSection = lazy(() => import('@/components/product-section'));
export const LazyCategorySection = lazy(() => import('@/components/category-section'));
export const LazyHeroSection = lazy(() => import('@/components/hero-section'));

// Fallback components
const CartDrawerFallback = () => (
  <div className="fixed inset-0 z-50 bg-black/50">
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl">
      <div className="p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-16 w-16" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ProductSectionFallback = () => (
  <div className="py-12">
    <div className="max-w-7xl mx-auto px-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <ProductGridSkeleton count={8} />
    </div>
  </div>
);

const CategorySectionFallback = () => (
  <div className="py-12">
    <div className="max-w-7xl mx-auto px-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-20 w-20 rounded-full mx-auto mb-2" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const HeroSectionFallback = () => (
  <div className="py-4 bg-white">
    <div className="max-w-7xl mx-auto px-4">
      <div className="w-full h-32 sm:h-40 md:h-56 lg:h-64 bg-gray-200 animate-pulse rounded-xl mb-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-48 h-6 bg-gray-300 rounded animate-pulse mx-auto"></div>
          <div className="w-32 h-4 bg-gray-300 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
      
      {/* Special Banner Tiles Skeleton */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[16/9] bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Memoized wrapped components with Suspense for better performance
export const CartDrawerWithSuspense = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Suspense fallback={isOpen ? <CartDrawerFallback /> : null}>
    <LazyCartDrawer isOpen={isOpen} onClose={onClose} />
  </Suspense>
));

export const ProductSectionWithSuspense = memo(({ onAddToCart, searchQuery }: { onAddToCart: any; searchQuery: string }) => (
  <Suspense fallback={<ProductSectionFallback />}>
    <LazyProductSection onAddToCart={onAddToCart} searchQuery={searchQuery} />
  </Suspense>
));

export const CategorySectionWithSuspense = memo(() => (
  <Suspense fallback={<CategorySectionFallback />}>
    <LazyCategorySection />
  </Suspense>
));

export const HeroSectionWithSuspense = memo(() => (
  <Suspense fallback={<HeroSectionFallback />}>
    <LazyHeroSection />
  </Suspense>
));

// Add display names for better debugging
CartDrawerWithSuspense.displayName = 'CartDrawerWithSuspense';
ProductSectionWithSuspense.displayName = 'ProductSectionWithSuspense';
CategorySectionWithSuspense.displayName = 'CategorySectionWithSuspense';
HeroSectionWithSuspense.displayName = 'HeroSectionWithSuspense';