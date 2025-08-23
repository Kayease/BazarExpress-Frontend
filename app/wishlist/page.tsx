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
import { toast } from "react-toastify";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, isInWishlist, addToWishlist } = useWishlistContext();
  const { addToCart, cartItems, updateCartItem, clearCart } = useCartContext();
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
  
  // Debug recently viewed products structure
  useEffect(() => {
    if (recentlyViewed.length > 0) {
      console.log('Recently viewed products loaded:', recentlyViewed.map(p => ({
        id: p._id,
        name: p.name,
        hasVariants: !!p.variants,
        variantsCount: p.variants ? Object.keys(p.variants).length : 0,
        variantKeys: p.variants ? Object.keys(p.variants) : [],
        variantId: p.variantId,
        variantName: p.variantName,
        warehouse: p.warehouse
      })));
    }
  }, [recentlyViewed]);

  // Handle cart clearing for warehouse conflicts
  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared successfully. You can now add products from any warehouse.');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart. Please try again.');
    }
  };

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

      // Log the structure of related products to debug variant issues
      console.log('Related products loaded:', related.map(p => ({
        id: p._id,
        name: p.name,
        hasVariants: !!p.variants,
        variantsCount: p.variants ? Object.keys(p.variants).length : 0,
        variantKeys: p.variants ? Object.keys(p.variants) : [],
        warehouse: p.warehouse
      })));

      setRelatedProducts(related);
      setIsLoadingRelated(false);
    }
  }, [wishlistItems, locationProducts]);

  const moveToCart = (item: any) => {
    console.log('moveToCart called with item:', item);
    console.log('Current cart items:', cartItems);
    
    // Check warehouse validation before moving to cart
    if (!canAddToCart(item, cartItems)) {
      console.log('Blocked: Cannot add product due to warehouse conflict');
      toast.error('Cannot add product due to warehouse conflict');
      return;
    }
    
    // Check if product already exists in cart
    const existingCartItem = cartItems.find(cartItem => {
      const idMatch = (cartItem.id || cartItem._id) === (item.id || item._id);
      if (item.variantId) {
        return idMatch && cartItem.variantId === item.variantId;
      }
      return idMatch && !cartItem.variantId;
    });

    console.log('Existing cart item found:', existingCartItem);

    if (existingCartItem) {
      // If product exists in cart, increase quantity by 1
      const newQuantity = existingCartItem.quantity + 1;
      console.log('Increasing quantity to:', newQuantity);
      // Update cart item quantity
      updateCartItem(item.id || item._id, newQuantity, item.variantId);
      removeFromWishlist(item.id || item._id, item.variantId);
      toast.success(`${item.name}${item.variantName ? ` (${item.variantName})` : ''} quantity increased in cart`);
    } else {
      // If product doesn't exist in cart, add it with quantity 1
      const cartItem = {
        ...item,
        id: item.id || item._id,
        quantity: 1,
        warehouse: item.warehouse,
        // Preserve variant information
        variantId: item.variantId,
        variantName: item.variantName,
        selectedVariant: item.selectedVariant,
        // Ensure price is correct
        price: item.price || item.selectedVariant?.price
      };
      
      console.log('Adding new item to cart:', cartItem);
      addToCart(cartItem);
      removeFromWishlist(item.id || item._id, item.variantId);
      toast.success(`${item.name}${item.variantName ? ` (${item.variantName})` : ''} added to cart`);
    }
  };

  // Handle add to cart for related/recently viewed products
  const handleAddToCart = async (product: any) => {
    console.log('handleAddToCart called with product:', product);
    console.log('Product variants:', product.variants);
    console.log('Product variantId:', product.variantId);
    console.log('Product variantName:', product.variantName);
    
    // Check warehouse validation before adding to cart
    if (!canAddToCart(product, cartItems)) {
      console.log('Blocked: Cannot add product due to warehouse conflict');
      toast.error('Cannot add product due to warehouse conflict');
      return;
    }
    
    try {
      // Check if product already has variant information set
      if (product.variantId && product.variantName) {
        // Product already has variant info, use it directly
        const productToAdd = {
          ...product, 
          id: product._id, 
          quantity: 1,
          warehouse: product.warehouse
        };
        
        console.log('Adding product with existing variant info to cart:', productToAdd);
        await addToCart(productToAdd);
        toast.success(`${product.name} (${product.variantName}) added to cart`);
      } else if (product.variants && Object.keys(product.variants).length > 0) {
        // Product has variants object, extract first variant
        const firstVariantKey = Object.keys(product.variants)[0];
        const firstVariant = product.variants[firstVariantKey];
        
        const productWithVariant = {
          ...product, 
          id: product._id, 
          quantity: 1,
          variantId: firstVariantKey,
          variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
          selectedVariant: firstVariant,
          price: (firstVariant.price !== undefined ? firstVariant.price : product.price),
          warehouse: product.warehouse
        };
        
        console.log('Adding variant product to cart:', productWithVariant);
        await addToCart(productWithVariant);
        toast.success(`${product.name} (${firstVariant.name || firstVariantKey.replace(/::/g, ' ')}) added to cart`);
      } else {
        // No variants - treat as simple product
        console.log('Product has no variant information - treating as simple product');
        const productToAdd = { 
          ...product, 
          id: product._id, 
          quantity: 1,
          warehouse: product.warehouse
        };
        
        console.log('Adding simple product to cart:', productToAdd);
        await addToCart(productToAdd);
        toast.success(`${product.name} added to cart`);
      }
    } catch (error: any) {
      console.error('Error adding product to cart:', error);
      
      // Handle warehouse conflict error
      if (error.isWarehouseConflict) {
        console.log('Warehouse conflict detected:', error);
        toast.error(
          <div>
            <div className="font-semibold">Warehouse Conflict</div>
            <div className="text-sm">{error.message}</div>
            <div className="text-xs mt-1">Clear your cart or choose products from the same warehouse.</div>
            <button 
              onClick={handleClearCart}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        );
        return;
      }
      
      // Handle variant required error
      if (error.isVariantRequired) {
        toast.error(error.message || 'Please select a variant before adding to cart');
        return;
      }
      
      // Handle other errors
      toast.error('Failed to add product to cart. Please try again.');
    }
  };

  // Handle wishlist click for related/recently viewed products
  const handleWishlistClick = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('handleWishlistClick called with product:', product);
    console.log('Product variants:', product.variants);
    console.log('Product variantId:', product.variantId);
    console.log('Product variantName:', product.variantName);
    
    try {
      // Check if product already has variant information set
      if (product.variantId && product.variantName) {
        // Product already has variant info, use it directly
        const productToAdd = {
          ...product,
          warehouse: product.warehouse
        };
        
        console.log('Adding product with existing variant info to wishlist:', productToAdd);
        await addToWishlist(productToAdd);
        toast.success(`${product.name} (${product.variantName}) added to wishlist`);
      } else if (product.variants && Object.keys(product.variants).length > 0) {
        // Product has variants object, extract first variant
        const firstVariantKey = Object.keys(product.variants)[0];
        const firstVariant = product.variants[firstVariantKey];
        
        const productWithVariant = {
          ...product,
          variantId: firstVariantKey,
          variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
          selectedVariant: firstVariant,
          price: (firstVariant.price !== undefined ? firstVariant.price : product.price),
          warehouse: product.warehouse
        };
        
        console.log('Adding variant product to wishlist:', productWithVariant);
        await addToWishlist(productWithVariant);
        toast.success(`${product.name} (${firstVariant.name || firstVariantKey.replace(/::/g, ' ')}) added to wishlist`);
      } else {
        // No variants - treat as simple product  
        console.log('Product has no variant information - treating as simple product');
        const productToAdd = {
          ...product,
          warehouse: product.warehouse
        };
        
        console.log('Adding simple product to wishlist:', productToAdd);
        await addToWishlist(productToAdd);
        toast.success(`${product.name} added to wishlist`);
      }
    } catch (error: any) {
      console.error('Error adding product to wishlist:', error);
      toast.error('Failed to add product to wishlist. Please try again.');
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:scale-105 transition-transform flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500" fill="#ef4444" strokeWidth={0} />
              <span className="whitespace-nowrap">My Wishlist</span>
            </h1>
          </div>

          {/* Empty Wishlist */}
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl border border-gray-100 max-w-sm sm:max-w-md mx-auto">
              <Heart className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Your wishlist is empty</h2>
              <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 px-2">Save items you love for later by clicking the heart icon.</p>
              <Link href="/products">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base">
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:scale-105 transition-transform flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Heart className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500" fill="#ef4444" strokeWidth={0} />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Wishlist</h1>
            <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Items Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            Wishlist Items
          </h2>
          
          <div className={`${viewMode === 'grid'
            ? 'grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
            : 'space-y-2 sm:space-y-3'
          }`}>
            {wishlistItems.map((item) => {
              const hasDiscount = item.mrp != null && item.mrp > item.price;
              const discountPercent = hasDiscount ? Math.round((((item.mrp ?? 0) - item.price) / (item.mrp ?? 1)) * 100) : 0;
              
              // Force canAddProduct to true for wishlist items to ensure ADD button shows
              const canAddProduct = true; // Wishlist items should always be addable to cart
              const conflictInfo = getWarehouseConflictInfo(item, cartItems);
              
              console.log('Wishlist item:', {
                name: item.name,
                id: item.id || item._id,
                variantId: item.variantId,
                warehouse: item.warehouse,
                canAddProduct,
                cartItemsCount: cartItems.length
              });
              
              return (
                <ProductCard
                  key={item.wishlistItemId || `${item.id || item._id}_${item.variantId || 'no-variant'}`}
                  product={{
                    ...item,
                    // Ensure variant information is properly displayed
                    variantId: item.variantId,
                    variantName: item.variantName,
                    selectedVariant: item.selectedVariant
                  }}
                  isInWishlist={isInWishlist}
                  handleWishlistClick={(product: any, e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeFromWishlist(item.id || item._id, item.variantId);
                  }}
                  handleAddToCart={moveToCart}
                  quantity={0} // Always 0 for wishlist items - they should show ADD button
                  locationState={locationState}
                  isGlobalMode={isGlobalMode}
                  viewMode={viewMode}
                  forceCanAdd={true} // Force ADD button to show for wishlist items
                  onClick={() => router.push(`/products/${item._id || item.id}`)}
                />
              );
            })}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-brand-primary" />
                Related Products
              </h2>
            </div>
            
            {isLoadingRelated ? (
              <ProductGridSkeleton count={8} viewMode={viewMode} />
            ) : (
              <div className={`${viewMode === 'grid'
                ? 'grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
                : 'space-y-2 sm:space-y-3'
              }`}>
                {relatedProducts.map((product) => {
                  // Enhance product with variant information if it has variants
                  const enhancedProduct = (() => {
                    if (product.variants && Object.keys(product.variants).length > 0) {
                      const firstVariantKey = Object.keys(product.variants)[0];
                      const firstVariant = product.variants[firstVariantKey];
                      return {
                        ...product,
                        variantId: firstVariantKey,
                        variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
                        selectedVariant: firstVariant,
                        price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
                      };
                    }
                    return product;
                  })();

                  return (
                    <ProductCard
                      key={product._id}
                      product={enhancedProduct}
                      isInWishlist={isInWishlist}
                      handleWishlistClick={handleWishlistClick}
                      handleAddToCart={handleAddToCart}
                      quantity={0} // Show 0 for related products - they're not in cart yet
                      locationState={locationState}
                      isGlobalMode={isGlobalMode}
                      viewMode={viewMode}
                      onClick={() => router.push(`/products/${product._id}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recently Viewed Products Section */}
        {recentlyViewed.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Recently Viewed
              </h2>
            </div>
            
            <div className={`${viewMode === 'grid'
              ? 'grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
              : 'space-y-2 sm:space-y-3'
            }`}>
              {recentlyViewed.slice(0, 8).map((product) => {
                // Enhance product with variant information if it has variants
                const enhancedProduct = (() => {
                  // First check if product already has variant info (from recently viewed)
                  if (product.variantId && product.variantName) {
                    return product;
                  }
                  
                  // If not, check if it has variants object and extract first variant
                  if (product.variants && Object.keys(product.variants).length > 0) {
                    const firstVariantKey = Object.keys(product.variants)[0];
                    const firstVariant = product.variants[firstVariantKey];
                    return {
                      ...product,
                      variantId: firstVariantKey,
                      variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
                      selectedVariant: firstVariant,
                      price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
                    };
                  }
                  
                  return product;
                })();

                return (
                  <ProductCard
                    key={product._id}
                    product={enhancedProduct}
                    isInWishlist={isInWishlist}
                    handleWishlistClick={handleWishlistClick}
                    handleAddToCart={handleAddToCart}
                    quantity={0}
                    locationState={locationState}
                    isGlobalMode={isGlobalMode}
                    viewMode={viewMode}
                    onClick={() => router.push(`/products/${product._id}`)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Continue Shopping */}
        <div className="flex justify-center">
          <Link href="/search" className="flex">
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}