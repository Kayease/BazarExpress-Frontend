import React from "react";

// Mobile Product Page Skeleton
export function MobileProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Breadcrumb Skeleton */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 mx-3 min-w-0">
            <div className="flex items-center text-sm text-gray-600 gap-2 overflow-hidden">
              {/* Home */}
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
              {/* All Categories */}
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
              {/* Parent Category */}
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
              {/* Current Category */}
              <div className="h-4 bg-gray-200 rounded w-18 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
              {/* Product Name */}
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Image with Swipe Support Skeleton */}
      <div className="relative bg-white">
        <div className="aspect-[4/3] relative max-h-80 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
          {/* Video/Image indicator skeleton */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-400 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        

      </div>

      {/* Product Info Skeleton */}
      <div className="p-4 space-y-5">
        {/* Product Name & Rating Skeleton */}
        <div className="space-y-3">
          {/* Product Name - Multiple lines for realistic look */}
        <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-4/5 animate-pulse"></div>
          </div>
          
          {/* Rating Stars and Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 w-4 bg-gray-200 rounded-sm animate-pulse"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
          </div>
        </div>

        {/* Price Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 bg-gray-200 rounded w-28 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
        </div>

        {/* Brand Info Skeleton */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
          </div>
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Quantity & Actions Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white">
              <div className="h-10 w-10 bg-gray-200 rounded-l-lg animate-pulse"></div>
              <div className="px-4 py-2 min-w-[50px]">
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-r-lg animate-pulse"></div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
            <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Product Features Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Details Section - Collapsible Skeleton */}
      <div className="mt-4 bg-white border-t border-gray-200">
        <div className="border-b border-gray-200">
          <div className="w-full py-2.5 px-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="p-3 space-y-3">
          {/* Basic Information */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-3"></div>
            {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
          </div>

          {/* Technical Specifications */}
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-3"></div>
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="pt-2 border-t border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-36 animate-pulse mb-3"></div>
            <div className="grid grid-cols-1 gap-3">
              {[...Array(2)].map((_, sectionIdx) => (
                <div key={sectionIdx} className="space-y-2">
                  {[...Array(2)].map((_, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="mt-4 bg-white border-t border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[...Array(2)].map((_, idx) => (
              <div key={idx} className="flex-1 py-2.5 px-3">
                <div className="flex items-center justify-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  {idx === 0 && <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>}
                </div>
              </div>
            ))}
          </nav>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            {/* Overall Rating Section Skeleton */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-12 animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-200 rounded w-8 animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </div>
              
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="mt-6 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-36 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Desktop Product Page Skeleton
export function DesktopProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                {idx < 3 && <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
            {/* Left Sidebar - Gallery Images Skeleton */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="flex flex-col gap-3 relative">
                  {/* Gallery Images Container Skeleton */}
                  <div className="flex flex-col gap-2 max-h-96 items-center">
                    {[...Array(7)].map((_, idx) => (
                      <div key={idx} className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Image Area Skeleton */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4">
                <div className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>

                {/* Product Features Section Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="text-center p-4 bg-white rounded-lg border border-gray-200">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Product Details Skeleton */}
            <div className="lg:col-span-6 space-y-6">
              {/* Product Name Skeleton */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                  <div className="w-16 h-1 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>

              {/* Brand Information Skeleton */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Variant Selection Skeleton */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                
                <div className="space-y-4">
                  {[...Array(2)].map((_, attrIdx) => (
                    <div key={attrIdx} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="flex flex-wrap gap-2">
                        {[...Array(4)].map((_, valIdx) => (
                          <div key={valIdx} className="h-8 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price and Actions Skeleton */}
              <div className="space-y-0">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
                    <div className="h-7 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  
                  {/* Star Rating Section Skeleton */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>

                {/* Quantity and Add to Cart Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white">
                      <div className="h-11 w-11 bg-gray-200 rounded-l-lg animate-pulse"></div>
                      <div className="px-4 py-2">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                      </div>
                      <div className="h-11 w-11 bg-gray-200 rounded-r-lg animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Product Details Section Skeleton */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-4">
                      <div className="py-3 px-1">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </nav>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Basic Information Skeleton */}
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-3"></div>
                        
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                        ))}
                      </div>

                      {/* Technical Specifications Skeleton */}
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-3"></div>
                        
                        {[...Array(4)].map((_, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Information Skeleton */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="h-4 bg-gray-200 rounded w-36 animate-pulse mb-3"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, sectionIdx) => (
                          <div key={sectionIdx} className="space-y-3">
                            {[...Array(3)].map((_, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Description and Reviews Tabs Skeleton */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[...Array(2)].map((_, idx) => (
                  <div key={idx} className="py-2 px-1">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </nav>
            </div>
            
            <div className="mt-6">
              <div className="space-y-4">
                {/* Overall Rating Section Skeleton */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-3 gap-6 items-center">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                      <div className="text-center">
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center text-center border-l border-r border-gray-200 px-6">
                      <div className="h-8 bg-gray-200 rounded w-12 animate-pulse mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                    
                    <div className="flex justify-center">
                      <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Reviews List Skeleton */}
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50/30">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 animate-pulse"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                                ))}
                                <div className="h-3 bg-gray-200 rounded w-8 animate-pulse ml-1"></div>
                              </div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse flex-shrink-0"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-full animate-pulse mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-200/60 p-6 sm:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg w-10 h-10 animate-pulse"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>

            <div className="grid gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Product Page Skeleton Component
export default function ProductPageSkeleton({ isMobile = false }: { isMobile?: boolean }) {
  if (isMobile) {
    return <MobileProductPageSkeleton />;
  }
  
  return <DesktopProductPageSkeleton />;
}
