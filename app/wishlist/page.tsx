"use client";
import { useWishlistContext, useCartContext } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, ArrowLeft, Trash2, AlertTriangle, Grid3X3, List, Star, TrendingUp, Eye, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { canAddToCart, getWarehouseConflictInfo } from "@/lib/warehouse-validation";
import { useLocation } from "@/components/location-provider";
import { useProductsByLocation } from "@/hooks/use-api";
import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/product-card";
import ProductGridSkeleton from "@/components/product-grid-skeleton";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, isInWishlist } = useWishlistContext();
  const { addToCart, cartItems } = useCartContext();
  const router = useRouter();
  const { locationState, isGlobalMode } = useLocation();
  
  // State for view mode and filters
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // State for related products
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  
  // Recently viewed products hook
  const { recentlyViewed } = useRecentlyViewed();

  // Get products for related products section
  const { data: locationProducts } = useProductsByLocation(
    locationState?.pincode || '000000',
    {
      mode: isGlobalMode ? 'global' : 'auto',
      limit: 20,
      page: 1
    }
  );



  // Generate related products based on wishlist categories
  useEffect(() => {
    if (wishlistItems.length > 0 && locationProducts?.products) {
      setIsLoadingRelated(true);
      
      // Get unique categories from wishlist
      const wishlistCategories = [...new Set(
        wishlistItems
          .map(item => {
            if (typeof item.category === 'object' && item.category?._id) {
              return item.category._id;
            }
            return item.category;
          })
          .filter(Boolean)
      )];

      // Filter products by wishlist categories, excluding wishlist items
      const wishlistIds = wishlistItems.map(item => item._id || item.id);
      const related = locationProducts.products
        .filter(product => {
          const productCategory = typeof product.category === 'object' ? product.category._id : product.category;
          return wishlistCategories.includes(productCategory) && !wishlistIds.includes(product._id);
        })
        .slice(0, 8); // Show max 8 related products

      setRelatedProducts(related);
      setIsLoadingRelated(false);
    }
  }, [wishlistItems, locationProducts]);

  const moveToCart = (item: any) => {
    // Check warehouse validation before moving to cart
    if (!canAddToCart(item, cartItems)) {
      console.log('Blocked: Cannot add product due to warehouse conflict');
      return;
    }
    
    // Pass variant information when adding to cart
    const cartItem = {
      ...item,
      variantId: item.variantId,
      variantName: item.variantName,
      selectedVariant: item.selectedVariant
    };
    
    addToCart(cartItem);
    removeFromWishlist(item.id || item._id, item.variantId);
  };

  // Handle add to cart for related/recently viewed products
  const handleAddToCart = (product: any) => {
    if (product.variants && Object.keys(product.variants).length > 0) {
      const firstVariantKey = Object.keys(product.variants)[0];
      const firstVariant = product.variants[firstVariantKey];
      
      addToCart({ 
        ...product, 
        id: product._id, 
        quantity: 1,
        variantId: firstVariantKey,
        variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
        selectedVariant: firstVariant,
        price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
      });
    } else {
      addToCart({ ...product, id: product._id, quantity: 1 });
    }
  };

  // Handle wishlist click for related/recently viewed products
  const handleWishlistClick = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (product.variants && Object.keys(product.variants).length > 0) {
      const firstVariantKey = Object.keys(product.variants)[0];
      const firstVariant = product.variants[firstVariantKey];
      
      const productWithVariant = {
        ...product,
        variantId: firstVariantKey,
        variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
        selectedVariant: firstVariant,
        price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
      };
      
      // This would need to be implemented in the wishlist context
      // For now, we'll just show a toast
      console.log('Add to wishlist:', productWithVariant);
    } else {
      console.log('Add to wishlist:', product);
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" fill="#ef4444" strokeWidth={0} />
              My Wishlist
            </h1>
          </div>

          {/* Empty Wishlist */}
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 max-w-md mx-auto">
              <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-8">Save items you love for later by clicking the heart icon.</p>
              <Link href="/search">
                <Button className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" fill="#ef4444" strokeWidth={0} />
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Items Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Wishlist Items
          </h2>
          
          <div className={`${viewMode === 'grid'
            ? 'grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8'
            : 'space-y-3'
          }`}>
            {wishlistItems.map((item) => {
              const hasDiscount = item.mrp != null && item.mrp > item.price;
              const discountPercent = hasDiscount ? Math.round((((item.mrp ?? 0) - item.price) / (item.mrp ?? 1)) * 100) : 0;
              
              // Warehouse validation
              const canAddProduct = canAddToCart(item, cartItems);
              const conflictInfo = getWarehouseConflictInfo(item, cartItems);
              
              return (
                <ProductCard
                  key={item.wishlistItemId || `${item.id || item._id}_${item.variantId || 'no-variant'}`}
                  product={item}
                  isInWishlist={isInWishlist}
                  handleWishlistClick={(product: any, e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeFromWishlist(item.id || item._id, item.variantId);
                  }}
                  handleAddToCart={moveToCart}
                  quantity={0}
                  locationState={locationState}
                  isGlobalMode={isGlobalMode}
                  viewMode={viewMode}
                  onClick={() => router.push(`/products/${item._id || item.id}`)}
                />
              );
            })}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Related Products
              </h2>
              <Link href="/products">
                <Button variant="outline" className="text-sm">
                  View All
                </Button>
              </Link>
            </div>
            
            {isLoadingRelated ? (
              <ProductGridSkeleton count={8} viewMode={viewMode} />
            ) : (
              <div className={`${viewMode === 'grid'
                ? 'grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8'
                : 'space-y-3'
              }`}>
                {relatedProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isInWishlist={isInWishlist}
                    handleWishlistClick={handleWishlistClick}
                    handleAddToCart={handleAddToCart}
                    quantity={0}
                    locationState={locationState}
                    isGlobalMode={isGlobalMode}
                    viewMode={viewMode}
                    onClick={() => router.push(`/products/${product._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recently Viewed Products Section */}
        {recentlyViewed.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recently Viewed
              </h2>
            </div>
            
            <div className={`${viewMode === 'grid'
              ? 'grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8'
              : 'space-y-3'
            }`}>
              {recentlyViewed.slice(0, 8).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isInWishlist={isInWishlist}
                  handleWishlistClick={handleWishlistClick}
                  handleAddToCart={handleAddToCart}
                  quantity={0}
                  locationState={locationState}
                  isGlobalMode={isGlobalMode}
                  viewMode={viewMode}
                  onClick={() => router.push(`/products/${product._id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Continue Shopping */}
        <div className="flex justify-center">
          <Link href="/search" className="flex">
            <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}