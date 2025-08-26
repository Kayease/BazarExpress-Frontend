"use client";
import { useEffect, useState, useCallback, useMemo, Suspense, lazy } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartContext, useWishlistContext, useAppContext } from "@/components/app-provider";
import { useLocation } from "@/components/location-provider";
import {
  Check,
  Heart,
  Share2,
  Truck,
  AlertCircle,
  Minus,
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Zap,
  Shield,
  Award,
  Clock,
  AlertTriangle,
  MessageSquare,
  Package,
  Info,
  Star as StarIcon,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  ArrowLeft,
  Share,
} from "lucide-react";
import { canAddToCart, getWarehouseConflictInfo } from "@/lib/warehouse-validation";
import { ReviewModal } from "@/components/ReviewModal";
import { ProductBreadcrumb } from "@/components/product-breadcrumb";
import ProductCard from "@/components/product-card";
import toast from "react-hot-toast";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductPageSkeleton from "@/components/ProductPageSkeleton";
import { useProductOptimized } from "@/hooks/use-product-optimized";
import PerformanceMonitor from "@/components/PerformanceMonitor";

// Lazy load heavy components
const LazyRelatedProducts = lazy(() => import('@/components/RelatedProducts'));
const LazyProductReviews = lazy(() => import('@/components/ProductReviews'));

interface ProductDimensions {
  l: string;
  w: string;
  h: string;
}

interface ProductTax {
  _id?: string;
  rate: number;
  name?: string;
}

interface ProductBrand {
  _id?: string;
  name: string;
}

interface ProductCategory {
  _id?: string;
  name: string;
}

interface ProductAttribute {
  name: string;
  values: string[];
}

interface ExtendedProduct {
  _id: string;
  name: string;
  price: number;
  mrp: number;
  unit: string;
  image: string;
  description?: string;
  stock: number;
  sku?: string;
  hsn?: string;
  brand?: ProductBrand | string;
  category?: ProductCategory | string;
  tax?: ProductTax;
  priceIncludesTax?: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  deliveryTime?: string;
  shippingClass?: string;
  returnable?: boolean;
  returnWindow?: number;
  codAvailable?: boolean;
  galleryImages?: string[];
  locationName?: string;
  attributes?: ProductAttribute[];
  rating?: number;
  warehouse?: any;
  manufacturer?: string;
  warranty?: string;
  variants?: {
    [key: string]: {
      name: string;
      price: number;
      mrp: number;
      stock: number;
      images: string[];
      unit?: string;
    };
  };
}

interface ProductReview {
  _id: string;
  user: { name: string };
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  verified?: boolean;
  helpful?: number;
}

// Mobile Product Page Component
function MobileProductPage({ 
  product, 
  loading, 
  mainImageIdx, 
  setMainImageIdx, 
  quantity, 
  setQuantity, 
  selectedVariant, 
  variants, 
  selectedAttributes, 
  handleAttributeSelection, 
  currentPrice, 
  currentMrp, 
  discountPercent, 
  brandName, 
  currentStock, 
  canAddProduct, 
  conflictInfo, 
  categoryName, 
  displayRating, 
  displayReviewCount, 
  reviews, 
  reviewsLoading, 
  averageRating, 
  totalReviews, 
  relatedProducts, 
  isReviewModalOpen, 
  setIsReviewModalOpen, 
  handleReviewSubmitted, 
  handleMarkHelpful, 
  addToCart, 
  addToWishlist, 
  isInWishlist, 
  isItemBeingAdded, 
  router, 
  addToRecentlyViewed,
  categories,
  isVideo,
  isMobile,
  locationState,
  isGlobalMode
}: any) {
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('details');
  const [showGallery, setShowGallery] = useState(false);
  const [galleryStartIdx, setGalleryStartIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const images = [product.image, ...(product.galleryImages || [])];
  const variantImages = selectedVariant && variants && variants[selectedVariant]?.images ? variants[selectedVariant].images : [];
  const allImages = variantImages.length > 0 ? variantImages : images;

  const handleMainImageChange = (newIdx: number) => {
    setMainImageIdx(newIdx);
    if (newIdx < galleryStartIdx || newIdx >= galleryStartIdx + 6) {
      const newStartIdx = Math.floor(newIdx / 6) * 6;
      setGalleryStartIdx(Math.max(0, Math.min(allImages.length - 6, newStartIdx)));
    }
  };

  // Touch handlers for image swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && mainImageIdx < allImages.length - 1) {
      handleMainImageChange(mainImageIdx + 1);
    } else if (isRightSwipe && mainImageIdx > 0) {
      handleMainImageChange(mainImageIdx - 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return <ProductPageSkeleton isMobile={isMobile} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Breadcrumb */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between py-3">
          {/* Mobile Breadcrumb */}
          <div className="flex-1 mx-3 min-w-0">
            <div className="flex items-center text-sm text-gray-600 gap-2 overflow-hidden">
              <button
                onClick={() => router.push("/")}
                className="hover:text-purple-600 transition-colors flex-shrink-0"
              >
                Home
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              
              <button
                onClick={() => router.push("/products")}
                className="hover:text-purple-600 transition-colors flex-shrink-0"
              >
                All Categories
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              
              {/* Parent Category (if exists) */}
              {(() => {
                const categoryInfo = typeof product.category === "object" && product.category 
                  ? product.category 
                  : null;
                const parentCategory = categoryInfo?.parentId 
                  ? categories.find((cat: any) => cat._id === categoryInfo.parentId)
                  : null;
                return parentCategory && parentCategory._id ? (
                  <>
                    <button
                      onClick={() => router.push(`/products?category=${parentCategory._id}`)}
                      className="hover:text-green-600 transition-colors truncate max-w-20 sm:max-w-24"
                      title={parentCategory.name}
                    >
                      {parentCategory.name}
                    </button>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </>
                ) : null;
              })()}
              
              {/* Current Category */}
              {(() => {
                const categoryInfo = typeof product.category === "object" && product.category 
                  ? product.category 
                  : null;
                return categoryInfo && categoryInfo._id ? (
                  <>
                    <button
                      onClick={() => router.push(`/products?category=${categoryInfo._id}`)}
                      className="hover:text-purple-600 transition-colors truncate max-w-20 sm:max-w-24"
                      title={categoryInfo.name}
                    >
                      {categoryInfo.name}
                    </button>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </>
                ) : null;
              })()}
              
              {/* Product Name */}
              <span className="text-gray-900 font-medium truncate max-w-24 sm:max-w-32 md:max-w-40" title={product.name}>
                {product.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Image with Swipe Support */}
      <div className="relative bg-white">
        <div 
          className="aspect-[4/3] relative max-h-80"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo(allImages[mainImageIdx]) ? (
            <video
              src={allImages[mainImageIdx]}
              className="w-full h-full object-contain p-4"
              controls
              muted
              autoPlay
              loop
            />
          ) : (
            <Image
              src={allImages[mainImageIdx] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
            />
          )}
          {discountPercent > 0 && (
            <div className="absolute left-4 top-4 z-10 flex items-center justify-center scale-100" style={{ width: '40px', height: '40px', pointerEvents: 'none' }}>
              <svg width="40" height="40" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[8px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
                {discountPercent}%
                <br />
                OFF
              </div>
            </div>
          )}
        </div>
        
        {/* Image Gallery Dots */}
        <div className="flex justify-center gap-2 pb-4">
          {allImages.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => handleMainImageChange(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === mainImageIdx ? 'bg-brand-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        {/* Product Name & Rating */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(displayRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {displayRating.toFixed(1)} ({displayReviewCount} reviews)
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-brand-primary">₹{currentPrice.toLocaleString()}</span>
            {currentMrp > currentPrice && (
              <span className="text-lg text-gray-400 line-through">₹{currentMrp.toLocaleString()}</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {product.priceIncludesTax ? "Inclusive" : "Exclusive"} of all taxes
          </p>
        </div>

        {/* Brand Info */}
        <div 
          onClick={() => {
            const brandId = typeof product.brand === "object" && product.brand?._id 
              ? product.brand._id 
              : typeof product.brand === "string" 
                ? product.brand 
                : null;
            
            if (brandId) {
              router.push(`/products?brand=${brandId}`);
            } else {
              router.push('/products');
            }
          }}
          className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 transition-all duration-300 ease-in-out cursor-pointer group border border-gray-200"
        >
          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <Award className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">{brandName}</p>
            <p className="text-xs text-gray-600">Explore all products</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>

        {/* Variant Selection */}
        {variants && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-base">Select Options</h3>
            
            {product.attributes && product.attributes.length > 0 && (
              <div className="space-y-4">
                {product.attributes.map((attribute: any) => (
                  <div key={attribute.name} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {attribute.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value: string) => {
                        const isSelected = selectedAttributes[attribute.name] === value;
                        const hasStock = Object.keys(variants).some((variantKey: string) => {
                          const variantAttributes = variantKey.split('::');
                          const attrIndex = product.attributes?.findIndex((attr: any) => attr.name === attribute.name) ?? -1;
                          if (attrIndex >= 0 && variantAttributes[attrIndex] === value) {
                            const variant = variants[variantKey];
                            return variant && variant.stock > 0;
                          }
                          return false;
                        });
                        
                        const isAvailable = hasStock || isSelected;
                        
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => handleAttributeSelection(attribute.name, value)}
                            className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : isAvailable
                                ? 'border-gray-200 hover:border-brand-primary/50 hover:bg-brand-primary/5'
                                : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quantity & Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Quantity</span>
            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity((q: number) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10 p-0 hover:bg-gray-50 rounded-l-lg"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 font-semibold min-w-[50px] text-center text-gray-900 bg-white">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity((q: number) => Math.min(q + 1, currentStock))}
                disabled={currentStock <= quantity}
                className="h-10 w-10 p-0 hover:bg-gray-50 rounded-r-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            {canAddProduct ? (
              <Button
                className={`flex-1 h-12 font-semibold shadow-lg transition-all duration-300 border-0 ${
                  variants && !selectedVariant
                    ? 'bg-gradient-to-r from-brand-primary/60 to-brand-primary-dark/60 text-white opacity-75 cursor-not-allowed'
                    : currentStock <= 0 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white opacity-75 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white'
                }`}
                disabled={Boolean(currentStock <= 0 || isItemBeingAdded(product._id, selectedVariant || undefined) || (variants && selectedVariant === null))}
                onClick={async () => {
                  try {
                    await addToCart({
                      id: product._id,
                      name: product.name,
                      price: currentPrice,
                      mrp: currentMrp,
                      image: product.image,
                      category: categoryName,
                      brand: brandName,
                      sku: product.sku,
                      quantity,
                      stock: currentStock,
                      warehouse: product.warehouse,
                      variants: variants ? Object.keys(variants) : undefined,
                      variantId: selectedVariant,
                      variantName: selectedVariant && variants && variants[selectedVariant] ? (variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')) : undefined,
                      selectedVariant: selectedVariant && variants ? variants[selectedVariant] : undefined,
                    });
                  } catch (error: any) {
                    if (error.isVariantRequired) {
                      toast.error(`Please select a variant for ${product.name} before adding to cart`);
                    } else if (error.isWarehouseConflict) {
                      toast.error(error.message);
                    } else {
                      toast.error('Failed to add item to cart');
                    }
                  }
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {variants && !selectedVariant
                  ? 'Select Variant'
                  : currentStock <= 0 
                  ? 'Out of Stock' 
                  : isItemBeingAdded(product._id, selectedVariant || undefined) 
                    ? 'Adding...' 
                    : 'Add to Cart'
                }
              </Button>
            ) : (
              <Button 
                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold opacity-90 cursor-not-allowed" 
                disabled={true} 
                variant="destructive" 
                title={conflictInfo.message}
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Cannot Add
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 border-2 transition-all duration-300 ${
                isInWishlist(product._id, selectedVariant || undefined) 
                  ? "border-red-400 bg-red-50 text-red-500" 
                  : "border-gray-200 hover:border-red-300 hover:bg-red-50"
              }`}
              onClick={() => {
                if (variants && Object.keys(variants).length > 0 && !selectedVariant) {
                  toast.error('Please select a variant before adding to wishlist');
                  return;
                }

                addToWishlist({
                  id: product._id,
                  name: product.name,
                  price: currentPrice,
                  mrp: currentMrp,
                  image: product.image,
                  category: categoryName,
                  brand: brandName,
                  sku: product.sku,
                  stock: currentStock,
                  warehouse: product.warehouse,
                  variantId: selectedVariant,
                  variantName: selectedVariant && variants && variants[selectedVariant] ? (variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')) : undefined,
                  selectedVariant: selectedVariant && variants ? variants[selectedVariant] : undefined,
                });
              }}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product._id, selectedVariant || undefined) ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
            </Button>
          </div>
        </div>

        {/* Product Features */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Truck className="h-4 w-4 text-green-600" />
            </div>
            <p className="font-medium text-xs text-gray-900">Fast Delivery</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <p className="font-medium text-xs text-gray-900">
              {product.returnable ? `Returnable` : 'Non-returnable'}
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-medium text-xs text-gray-900">{product.codAvailable ? "COD" : "Prepaid"}</p>
          </div>
        </div>
      </div>

      {/* Product Details Section - Collapsible */}
      <div className="mt-4 bg-white border-t border-gray-200">
        <div className="border-b border-gray-200">
          <button 
            onClick={() => setActiveTab(activeTab === 'details' ? 'description' : 'details')}
            className={`w-full py-2.5 px-3 text-sm font-medium border-b-2 transition-all duration-300 flex items-center justify-between ${
              activeTab === 'details' 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-gray-500'
            }`}
          >
            <span>Product Details</span>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-300 ${
                activeTab === 'details' ? 'rotate-180' : 'rotate-0'
              }`} 
            />
          </button>
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          activeTab === 'details' ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-3 space-y-3">
            {/* Basic Information */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-2">Basic Information</h4>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Brand</span>
                <span className="font-medium text-gray-900 text-sm">{brandName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Category</span>
                <span className="font-medium text-gray-900 text-sm">{categoryName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Unit</span>
                <span className="font-medium text-gray-900 text-sm">{product.unit}</span>
              </div>
              
              {product.sku && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">SKU</span>
                  <span className="font-medium text-gray-900 text-sm font-mono">{product.sku}</span>
                </div>
              )}
              
              {product.hsn && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">HSN Code</span>
                  <span className="font-medium text-gray-900 text-sm font-mono">{product.hsn}</span>
                </div>
              )}
            </div>

            {/* Technical Specifications */}
            {(() => {
              const hasTechnicalSpecs = product.weight || 
                (product.dimensions && (product.dimensions.l || product.dimensions.w || product.dimensions.h)) ||
                product.manufacturer || 
                product.warranty || 
                product.shippingClass;
              
              if (!hasTechnicalSpecs) return null;
              
              return (
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-2">Technical Specs</h4>
                  
                  {product.weight && product.weight > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Weight</span>
                      <span className="font-medium text-gray-900 text-sm">{product.weight} kg</span>
                    </div>
                  )}
                  
                  {product.dimensions && (product.dimensions.l || product.dimensions.w || product.dimensions.h) && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Dimensions</span>
                      <span className="font-medium text-gray-900 text-sm">
                        {product.dimensions.l || "—"} × {product.dimensions.w || "—"} × {product.dimensions.h || "—"} cm
                      </span>
                    </div>
                  )}
                  
                  {product.manufacturer && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Manufacturer</span>
                      <span className="font-medium text-gray-900 text-sm">{product.manufacturer}</span>
                    </div>
                  )}
                  
                  {product.warranty && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Warranty</span>
                      <span className="font-medium text-gray-900 text-sm">{product.warranty}</span>
                    </div>
                  )}
                  
                  {product.shippingClass && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Shipping Class</span>
                      <span className="font-medium text-gray-900 text-sm">{product.shippingClass}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Additional Information */}
            <div className="pt-2 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-2">Additional Information</h4>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Pricing & Tax */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">Price Type</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {product.priceIncludesTax ? "Tax Inclusive" : "Tax Exclusive"}
                    </span>
                  </div>
                  
                  {product.tax && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Tax Rate</span>
                      <span className="font-medium text-gray-900 text-sm">
                        {(() => {
                          const t = product.tax as any;
                          const val = typeof t === 'object' ? (t.rate ?? t.percentage) : (typeof t === 'number' ? t : undefined);
                          return val != null && val !== '' ? `${val}%` : '—';
                        })()}
                      </span>
                    </div>
                  )}
                  
                  {product.tax && (typeof product.tax === 'object' ? product.tax.name : null) && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Tax Name</span>
                      <span className="font-medium text-gray-900 text-sm">{typeof product.tax === 'object' ? product.tax.name : ''}</span>
                    </div>
                  )}
                </div>

                {/* Shipping & Returns */}
                <div className="space-y-2">
                  {product.deliveryTime && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Delivery Time</span>
                      <span className="font-medium text-gray-900 text-sm">{product.deliveryTime}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">Returnable</span>
                    <span className={`font-medium text-sm ${product.returnable ? 'text-green-600' : 'text-red-600'}`}>
                      {product.returnable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {product.returnable && typeof product.returnWindow === 'number' && product.returnWindow > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Return Window</span>
                      <span className="font-medium text-gray-900 text-sm">{product.returnWindow} days</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">COD Available</span>
                    <span className={`font-medium text-sm ${product.codAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {product.codAvailable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 bg-white border-t border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button 
              onClick={() => setActiveTab('description')}
              className={`flex-1 py-2.5 px-3 text-sm font-medium border-b-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'description' 
                  ? 'border-brand-primary text-brand-primary' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              <span>Description</span>
              {activeTab === 'description' && (
                <ChevronDown className="h-3 w-3 animate-bounce" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2.5 px-3 text-sm font-medium border-b-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'reviews' 
                  ? 'border-brand-primary text-brand-primary' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              <span>Reviews ({displayReviewCount})</span>
              {activeTab === 'reviews' && (
                <ChevronDown className="h-3 w-3 animate-bounce" />
              )}
            </button>
          </nav>
        </div>
        
        <div className="p-4">
          {activeTab === 'description' ? (
            <div className="prose max-w-none text-gray-700 text-sm leading-relaxed">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-gray-500 italic">No description available.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Rating Section */}
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.floor(displayRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <div>
                      <span className="text-lg font-bold text-gray-900">{displayRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500 ml-1">out of 5</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{displayReviewCount}</div>
                    <div className="text-sm text-gray-500">reviews</div>
                  </div>
                </div>
                
                {/* Write Review Button */}
                <Button 
                  onClick={() => setIsReviewModalOpen(true)} 
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white font-semibold shadow-lg transition-all duration-300"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Write a Review
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-6 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">You might also like</h3>
            {product?.category && (
              <Button
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => {
                  const categoryId = typeof product.category === "object" && product.category !== null && "_id" in product.category ? (product.category as any)._id : product.category;
                  router.push(`/products?category=${categoryId}`);
                }}
              >
                View All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {relatedProducts.slice(0, 4).map((relProd: any) => {
              const enhancedProduct = (() => {
                if (relProd.variants && Object.keys(relProd.variants).length > 0) {
                  const firstVariantKey = Object.keys(relProd.variants)[0];
                  const firstVariant = relProd.variants[firstVariantKey];
                  return {
                    ...relProd,
                    variantId: firstVariantKey,
                    variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
                    selectedVariant: firstVariant,
                    price: (firstVariant.price !== undefined ? firstVariant.price : relProd.price),
                    unit: (firstVariant as any).unit || relProd.unit || '1 Unit'
                  };
                }
                return {
                  ...relProd,
                  unit: relProd.unit || '1 Unit'
                };
              })();

              return (
                <ProductCard
                  key={relProd._id}
                  product={enhancedProduct}
                  isInWishlist={isInWishlist}
                  handleWishlistClick={(product: any, e: any) => {
                    e.stopPropagation();
                    addToWishlist({
                      id: product._id,
                      name: product.name,
                      price: product.price,
                      mrp: product.mrp,
                      image: product.image,
                      category: typeof product.category === "object" ? product.category?.name : product.category,
                      brand: typeof product.brand === "object" ? product.brand?.name : product.brand,
                      sku: product.sku,
                      stock: product.stock,
                      warehouse: product.warehouse,
                      variantId: product.variantId,
                      variantName: product.variantName,
                      selectedVariant: product.selectedVariant,
                    });
                  }}
                  handleAddToCart={async (product: any) => {
                    try {
                      await addToCart({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        mrp: product.mrp,
                        image: product.image,
                        category: typeof product.category === "object" ? product.category?.name : product.category,
                        brand: typeof product.brand === "object" ? product.brand?.name : product.brand,
                        sku: product.sku,
                        quantity: 1,
                        stock: product.stock,
                        warehouse: product.warehouse,
                        variantId: product.variantId,
                        variantName: product.variantName,
                        selectedVariant: product.selectedVariant,
                      });
                    } catch (error: any) {
                      if (error.isVariantRequired) {
                        toast.error(`Please select a variant for ${product.name} before adding to cart`);
                      } else if (error.isWarehouseConflict) {
                        toast.error(error.message);
                      } else {
                        toast.error('Failed to add item to cart');
                      }
                    }
                  }}
                  quantity={0}
                  locationState={null}
                  isGlobalMode={true}
                  viewMode="grid"
                  onClick={() => router.push(`/products/${relProd._id}`)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Full Screen Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <button
              onClick={() => setShowGallery(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <span className="text-sm">
              {mainImageIdx + 1} of {allImages.length}
            </span>
          </div>
          
          <div className="flex-1 relative">
            <Image
              src={allImages[mainImageIdx] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>
          
          <div className="p-4">
            <div className="flex justify-center gap-2">
              {allImages.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleMainImageChange(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === mainImageIdx ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productId={product._id}
        productName={product.name}
        productImage={product.image}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}

// Main Product Page Component (existing code)
export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isMobile = useIsMobile();
  
  // Use optimized hook for data fetching with caching
  const {
    product: optimizedProduct,
    loading: optimizedLoading,
    error: optimizedError,
    reviews: optimizedReviews,
    reviewsLoading: optimizedReviewsLoading,
    relatedProducts: optimizedRelatedProducts,
    relatedProductsLoading: optimizedRelatedProductsLoading,
    refreshProduct,
    refreshReviews,
    refreshRelatedProducts
  } = useProductOptimized();

  // Use optimized data when available, fallback to local state
  const product = optimizedProduct || null;
  const loading = optimizedLoading;
  const error = optimizedError;
  const reviews = Array.isArray(optimizedReviews) ? optimizedReviews : [];
  const reviewsLoading = optimizedReviewsLoading;
  const relatedProducts = Array.isArray(optimizedRelatedProducts) ? optimizedRelatedProducts : [];
  const relatedProductsLoading = optimizedRelatedProductsLoading;
  
  // Local state for UI interactions
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [galleryStartIdx, setGalleryStartIdx] = useState(0);
  const { addToCart, cartItems, isItemBeingAdded } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();
  const { user } = useAppContext();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'reviews'>('details');
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({});
  const [availableVariants, setAvailableVariants] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { addToRecentlyViewed } = useRecentlyViewed();
  const { locationState, isGlobalMode } = useLocation();

  // Clear related products cache when location changes
  useEffect(() => {
    if (product?._id && product?.category) {
      refreshRelatedProducts();
    }
  }, [locationState?.pincode, locationState?.isLocationDetected, isGlobalMode, product?._id, product?.category, refreshRelatedProducts]);
  


  // Function to get available variants based on selected attributes
  const getAvailableVariants = useCallback(() => {
    if (!product?.variants || !product?.attributes) return [];
    
    const variantKeys = Object.keys(product.variants);
    
    // If no attributes, return all variants
    if (product.attributes.length === 0) return variantKeys;
    
    // Filter variants based on selected attributes
    return variantKeys.filter(variantKey => {
      const variantAttributes = variantKey.split('::');
      return product.attributes?.every((attr, index) => {
        if (!selectedAttributes[attr.name]) return true; // Skip unselected attributes
        return variantAttributes[index] === selectedAttributes[attr.name];
      }) ?? true;
    });
  }, [product?.variants, product?.attributes, selectedAttributes]);

  // Function to handle attribute selection
  const handleAttributeSelection = (attributeName: string, value: string) => {
    // Don't do anything if clicking the same value
    if (selectedAttributes[attributeName] === value) return;
    
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }));
    
    // Don't reset main image and quantity - keep user's current view
    // Only reset variant if the current one is no longer valid
    setIsInitialLoad(false); // Mark as user interaction
  };

  // Function to check if a variant is available
  const isVariantAvailable = (variantKey: string) => {
    if (!product?.variants) return false;
    const variant = product.variants[variantKey];
    return variant && variant.stock > 0;
  };

  // Function to handle main image change
  const handleMainImageChange = (newIdx: number) => {
    setMainImageIdx(newIdx);
    if (newIdx < galleryStartIdx || newIdx >= galleryStartIdx + 7) {
      const newStartIdx = Math.floor(newIdx / 7) * 7;
      setGalleryStartIdx(Math.max(0, Math.min(allImages.length - 7, newStartIdx)));
    }
  };



  // Update available variants when attributes change
  useEffect(() => {
    if (!product?.variants || !product?.attributes) {
      setAvailableVariants([]);
      return;
    }
    
    const variantKeys = Object.keys(product.variants);
    
    // Calculate available variants based on selected attributes
    let available: string[] = [];
    if (product.attributes.length === 0) {
      available = variantKeys;
    } else {
      available = variantKeys.filter(variantKey => {
        const variantAttributes = variantKey.split('::');
        return product.attributes?.every((attr, index) => {
          if (!selectedAttributes[attr.name]) return true; // Skip unselected attributes
          return variantAttributes[index] === selectedAttributes[attr.name];
        }) ?? true;
      });
    }
    

    
    setAvailableVariants(available);
    
    // Auto-select variant when all attributes are selected and we have exactly one available variant
    if (available.length === 1 && !selectedVariant) {
      setSelectedVariant(available[0]);
    }
    
    // If we have available variants and the current selected variant is not available,
    // find a new matching variant instead of clearing it completely
    if (available.length > 0 && selectedVariant && !available.includes(selectedVariant)) {
      // Find a variant that matches the new attribute combination
      const newMatchingVariant = available.find(variantKey => {
        const variantAttributes = variantKey.split('::');
        return product.attributes?.every((attr, index) => {
          if (!selectedAttributes[attr.name]) return true;
          return variantAttributes[index] === selectedAttributes[attr.name];
        }) ?? true;
      });
      
      if (newMatchingVariant) {
        setSelectedVariant(newMatchingVariant);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [selectedAttributes, product?.variants, product?.attributes, selectedVariant]);





  // Use optimized hook data - no need for manual fetching
  // The hook handles all data fetching with caching automatically

  // Handle recently viewed and reset state when product changes
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
      
      // Reset variant selection when loading new product
      setSelectedVariant(null);
      setMainImageIdx(0);
      setSelectedAttributes({});
      setIsInitialLoad(true);
    }
  }, [product, addToRecentlyViewed]);

  // Update average rating and total reviews from reviews data
  useEffect(() => {
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / reviews.length;
      setAverageRating(avgRating);
      setTotalReviews(reviews.length);
    } else {
      setAverageRating(0);
      setTotalReviews(0);
    }
  }, [reviews]);

  const handleReviewSubmitted = () => {
    if (product) {
      refreshReviews();
    }
  };

  const handleMarkHelpful = async (reviewId: string, isHelpful: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to mark reviews as helpful');
        return;
      }

      const APIURL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${APIURL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ helpful: isHelpful })
      });

      if (response.ok) {
        if (product) {
          refreshReviews();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to mark review as helpful');
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      alert('Failed to mark review as helpful');
    }
  };

  if (loading) {
    return <ProductPageSkeleton isMobile={isMobile} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <CardContent className="space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Error Loading Product</h1>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">Product ID: {id}</p>
            <Button onClick={() => window.location.reload()} className="bg-brand-primary hover:bg-brand-primary-dark">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <CardContent className="space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
            <p className="text-sm text-gray-500">Product ID: {id}</p>
            <Button onClick={() => router.push("/products")} className="bg-brand-primary hover:bg-brand-primary-dark">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = [product.image, ...(product.galleryImages || [])];
  const variants = product.variants && Object.keys(product.variants).length > 0 ? product.variants : null;
  const variantImages = selectedVariant && variants && variants[selectedVariant]?.images ? variants[selectedVariant].images : [];
  const allImages = variantImages.length > 0 ? variantImages : images;
  
  // Helper function to check if a media item is a video
  const isVideo = (url: string) => {
    if (!url) return false;
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('video');
  };

  const currentPrice = selectedVariant && variants ? variants[selectedVariant].price : product.price;
  const currentMrp = selectedVariant && variants ? variants[selectedVariant].mrp : product.mrp;

  const discountPercent = currentMrp > 0 && currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  const brandName = typeof product.brand === "object" && product.brand ? product.brand.name : typeof product.brand === "string" ? product.brand : "Generic Brand";

  const currentStock = selectedVariant && variants ? variants[selectedVariant].stock : product.stock;

  const canAddProduct = canAddToCart(product, cartItems);
  const conflictInfo = getWarehouseConflictInfo(product, cartItems);
  const categoryName = typeof product.category === "object" && product.category ? product.category.name : typeof product.category === "string" ? product.category : "Uncategorized";

  const displayRating = averageRating || 0;
  const displayReviewCount = totalReviews;

  // If mobile, render mobile view
  if (isMobile) {
    return (
      <MobileProductPage
        product={product}
        loading={loading}
        mainImageIdx={mainImageIdx}
        setMainImageIdx={setMainImageIdx}
        quantity={quantity}
        setQuantity={setQuantity}
        selectedVariant={selectedVariant}
        variants={variants}
        selectedAttributes={selectedAttributes}
        handleAttributeSelection={handleAttributeSelection}
        currentPrice={currentPrice}
        currentMrp={currentMrp}
        discountPercent={discountPercent}
        brandName={brandName}
        currentStock={currentStock}
        canAddProduct={canAddProduct}
        conflictInfo={conflictInfo}
        categoryName={categoryName}
        displayRating={displayRating}
        displayReviewCount={displayReviewCount}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        averageRating={averageRating}
        totalReviews={totalReviews}
        relatedProducts={relatedProducts}
        isReviewModalOpen={isReviewModalOpen}
        setIsReviewModalOpen={setIsReviewModalOpen}
        handleReviewSubmitted={handleReviewSubmitted}
        handleMarkHelpful={handleMarkHelpful}
        addToCart={addToCart}
        addToWishlist={addToWishlist}
        isInWishlist={isInWishlist}
        isItemBeingAdded={isItemBeingAdded}
        router={router}
        addToRecentlyViewed={addToRecentlyViewed}
        categories={categories}
        isVideo={isVideo}
        isMobile={isMobile}
        locationState={locationState}
        isGlobalMode={isGlobalMode}
      />
    );
  }

  return (
    <>
      <PerformanceMonitor 
        onMetrics={(metrics) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Product Page Performance:', metrics);
          }
        }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <ProductBreadcrumb product={product} categories={categories} />
        </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Left Sidebar - Gallery Images (Fixed/Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
            <div className="flex flex-col gap-3 relative">
              {/* Up Arrow */}
              {allImages.length > 7 && galleryStartIdx > 0 && (
                <div className="flex justify-center">
                  <Button
                    size="icon"
                    onClick={() => setGalleryStartIdx(prev => Math.max(0, prev - 7))}
                    className="h-8 w-8 hover:scale-150 flex items-center justify-center"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Gallery Images Container */}
              <div className="flex flex-col gap-2 max-h-96 items-center">
                {allImages.slice(galleryStartIdx, galleryStartIdx + 7).map((img: string, idx: number) => {
                  const actualIdx = galleryStartIdx + idx;
                  return (
                    <div
                      key={actualIdx}
                      className={`w-16 h-16 border-2 rounded-lg cursor-pointer transition-all bg-white overflow-hidden ${mainImageIdx === actualIdx ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-gray-200 hover:border-gray-300"
                        }`}
                      onClick={() => handleMainImageChange(actualIdx)}
                    >
                      {isVideo(img) ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-brand-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`Gallery ${actualIdx + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Down Arrow */}
              {allImages.length > 7 && galleryStartIdx + 7 < allImages.length && (
                <div className="flex justify-center">
                  <Button
                    size="icon"
                    onClick={() => setGalleryStartIdx(prev => Math.min(allImages.length - 7, prev + 7))}
                    className="h-8 w-8 hover:scale-150 flex items-center justify-center"
                  >
                    <ChevronDown className="h-4 w-4" />
                </Button>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Main Image Area (Fixed/Sticky) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-white group">
                {isVideo(allImages[mainImageIdx]) ? (
                  <video
                    src={allImages[mainImageIdx]}
                    className="w-full h-full object-contain p-6"
                    controls
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <Image
                    src={allImages[mainImageIdx] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                )}
                {discountPercent > 0 && (
                  <div className="absolute left-4 -top-1 z-10 flex items-center justify-center scale-100" style={{ width: '50px', height: '50px', pointerEvents: 'none' }}>
                    <svg width="50" height="50" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[10px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
                      {discountPercent}%
                      <br />
                      OFF
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Product Features Section - Start from the beginning (no left dots area) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-medium text-sm text-gray-900">Fast Delivery Available</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-sm text-gray-900">
                    {product.returnable ? `Returnable${typeof product.returnWindow === 'number' ? ` within ${product.returnWindow} days` : ''}` : 'Non-returnable'}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="font-medium text-sm text-gray-900">{product.codAvailable ? "COD Available" : "Prepaid Only"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Product Details (Scrollable) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Product Name - Moved here above brand info */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="w-16 h-1 bg-brand-primary rounded-full"></div>
              </div>
              <Button 
                onClick={() => setIsReviewModalOpen(true)} 
                className="bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white font-semibold shadow-lg hover:shadow-xl transform  transition-all duration-300 border-0 px-6 py-2"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Write Review
              </Button>
            </div>

            {/* Brand Information */}
            <div 
              onClick={() => {
                const brandId = typeof product.brand === "object" && product.brand?._id 
                  ? product.brand._id 
                  : typeof product.brand === "string" 
                    ? product.brand 
                    : null;
                
                if (brandId) {
                  router.push(`/products?brand=${brandId}`);
                } else {
                  // If no brand ID, just go to products page
                  router.push('/products');
                }
              }}
              className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-all duration-300 ease-in-out cursor-pointer group border border-gray-200 hover:border-brand-primary/30 hover:shadow-md"
            >
              <div className="w-12 h-12 bg-brand-primary/10 group-hover:bg-brand-primary/20 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Award className="h-6 w-6 text-brand-primary group-hover:text-brand-primary-dark transition-colors duration-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-brand-primary transition-colors duration-300">{brandName}</p>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Explore all products</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all duration-300" />
            </div>

            {/* Dynamic Variant Selection */}
            {variants && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Select Options</h3>
                
                {/* Attribute Selection */}
                {product.attributes && product.attributes.length > 0 && (
                  <div className="space-y-4">
                    {product.attributes.map((attribute) => (
                      <div key={attribute.name} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {attribute.name}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {attribute.values.map((value: string) => {
                            const isSelected = selectedAttributes[attribute.name] === value;
                            
                            // Check if this attribute value has any variants with stock > 0
                            const hasStock = Object.keys(variants).some(variantKey => {
                              const variantAttributes = variantKey.split('::');
                              const attrIndex = product.attributes?.findIndex(attr => attr.name === attribute.name) ?? -1;
                              if (attrIndex >= 0 && variantAttributes[attrIndex] === value) {
                                const variant = variants[variantKey];
                                return variant && variant.stock > 0;
                              }
                              return false;
                            });
                            
                            // Always allow selection if there's stock, or if it's the currently selected value
                            const isAvailable = hasStock || isSelected;
                            
                            return (
                              <button
                                key={value}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => handleAttributeSelection(attribute.name, value)}
                                className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-brand-primary bg-brand-primary text-white'
                                    : isAvailable
                                    ? 'border-gray-200 hover:border-brand-primary/50 hover:bg-brand-primary/5'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {value}
                                {!isAvailable && <span className="ml-1 text-xs">(Out of Stock)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}





                {/* No Variants Available Message */}
                {availableVariants.length === 0 && product.attributes && product.attributes.length > 0 && (
                  <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="font-medium">No variants available for selected options</p>
                    <p className="text-sm text-amber-700">Try different combinations of color, size, etc.</p>
                  </div>
                )}


              </div>
            )}

            {/* Price and Actions */}
            <div className="space-y-0">
              <div className="space-y-2">
                {selectedVariant && variants && (
                  <p className="text-sm text-gray-600">{variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')}</p>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-brand-primary">₹{currentPrice.toLocaleString()}</span>
                  {currentMrp > currentPrice && (
                    <span className="text-lg text-gray-400 line-through">₹{currentMrp.toLocaleString()}</span>
                  )}
                </div>
                              {/* Star Rating Section */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(displayRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{displayRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({displayReviewCount} reviews)</span>
                </div>
              </div>
                <p className="text-sm text-gray-500">{product.priceIncludesTax ? "Inclusive" : "Exclusive"} of all taxes</p>
              </div>



              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Quantity</span>
                  <div className="flex items-center border-2 border-gray-200 hover:border-brand-primary/50 rounded-xl bg-white shadow-sm transition-all duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="h-11 w-11 p-0 hover:bg-gray-50 rounded-l-lg transition-colors duration-200"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 font-semibold min-w-[60px] text-center text-gray-900 bg-white">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity((q) => Math.min(q + 1, currentStock))}
                      disabled={currentStock <= quantity}
                      className="h-11 w-11 p-0 hover:bg-gray-50 rounded-r-lg transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  {canAddProduct ? (
                    <Button
                      className={`flex-1 h-12 font-semibold shadow-lg transition-all duration-300 border-0 ${
                        variants && !selectedVariant
                          ? 'bg-gradient-to-r from-brand-primary/60 to-brand-primary-dark/60 text-white opacity-75 cursor-not-allowed hover:from-brand-primary/60 hover:to-brand-primary-dark/60'
                          : currentStock <= 0 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white opacity-75 cursor-not-allowed hover:from-gray-400 hover:to-gray-500'
                          : 'bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white hover:shadow-xl'
                      }`}
                      disabled={Boolean(currentStock <= 0 || isItemBeingAdded(product._id, selectedVariant || undefined) || (variants && selectedVariant === null))}
                      onClick={async () => {
                        try {
                          await addToCart({
                            id: product._id,
                            name: product.name,
                            price: currentPrice,
                            mrp: currentMrp,
                            image: product.image,
                            category: categoryName,
                            brand: brandName,
                            sku: product.sku,
                            quantity,
                            stock: currentStock,
                            warehouse: product.warehouse,
                            variants: variants ? Object.keys(variants) : undefined,
                            variantId: selectedVariant,
                            variantName: selectedVariant && variants && variants[selectedVariant] ? (variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')) : undefined,
                            selectedVariant: selectedVariant && variants ? variants[selectedVariant] : undefined,
                          });
                        } catch (error: any) {
                          if (error.isVariantRequired) {
                            toast.error(`Please select a variant for ${product.name} before adding to cart`);
                          } else if (error.isWarehouseConflict) {
                            toast.error(error.message);
                          } else {
                            toast.error('Failed to add item to cart');
                          }
                        }
                      }}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {variants && !selectedVariant
                        ? 'Select Variant'
                        : currentStock <= 0 
                        ? 'Out of Stock' 
                        : isItemBeingAdded(product._id, selectedVariant || undefined) 
                          ? 'Adding...' 
                          : 'Add to Cart'
                      }
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold opacity-90 cursor-not-allowed" 
                      disabled={true} 
                      variant="destructive" 
                      title={conflictInfo.message}
                    >
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Cannot Add
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-12 w-12 border-2 transition-all duration-300 ${
                      isInWishlist(product._id, selectedVariant || undefined) 
                        ? "border-red-400 bg-red-50 text-red-500 shadow-md scale-105" 
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50 hover:scale-105 hover:shadow-md"
                    }`}
                    onClick={() => {
                      if (variants && Object.keys(variants).length > 0 && !selectedVariant) {
                        toast.error('Please select a variant before adding to wishlist');
                        return;
                      }

                      addToWishlist({
                        id: product._id,
                        name: product.name,
                        price: currentPrice,
                        mrp: currentMrp,
                        image: product.image,
                        category: categoryName,
                        brand: brandName,
                        sku: product.sku,
                        stock: currentStock,
                        warehouse: product.warehouse,
                        variantId: selectedVariant,
                        variantName: selectedVariant && variants && variants[selectedVariant] ? (variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')) : undefined,
                        selectedVariant: selectedVariant && variants ? variants[selectedVariant] : undefined,
                      });
                    }}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist(product._id, selectedVariant || undefined) ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Product Details Section */}
            <div className="space-y-4">
              {/* Product Details Tabs */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-4">
                    <button className="py-3 px-1 border-b-2 border-brand-primary text-brand-primary font-medium text-sm">
                      Product Details
                    </button>
                  </nav>
                    </div>
                
                <div className="p-4">
                  <div className={`grid grid-cols-1 gap-4 ${
                    (() => {
                      const hasTechnicalSpecs = product.weight || 
                        (product.dimensions && (product.dimensions.l || product.dimensions.w || product.dimensions.h)) ||
                        product.manufacturer || 
                        product.warranty || 
                        product.shippingClass;
                      return hasTechnicalSpecs ? 'md:grid-cols-2' : 'md:grid-cols-1';
                    })()
                  }`}>
                    {/* Basic Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">Basic Information</h4>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Brand</span>
                        <span className="font-medium text-gray-900 text-sm">{brandName}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Category</span>
                        <span className="font-medium text-gray-900 text-sm">{categoryName}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Unit</span>
                        <span className="font-medium text-gray-900 text-sm">{product.unit}</span>
                      </div>
                      
                    {product.sku && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">SKU</span>
                          <span className="font-medium text-gray-900 text-sm font-mono">{product.sku}</span>
                      </div>
                    )}
                      
                    {product.hsn && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">HSN Code</span>
                          <span className="font-medium text-gray-900 text-sm font-mono">{product.hsn}</span>
                      </div>
                    )}
                    </div>

                    {/* Technical Specifications */}
                    {(() => {
                      const hasTechnicalSpecs = product.weight || 
                        (product.dimensions && (product.dimensions.l || product.dimensions.w || product.dimensions.h)) ||
                        product.manufacturer || 
                        product.warranty || 
                        product.shippingClass;
                      
                      if (!hasTechnicalSpecs) return null;
                      
                      return (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">Technical Specs</h4>
                          
                          {product.weight && product.weight > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">Weight</span>
                              <span className="font-medium text-gray-900 text-sm">{product.weight} kg</span>
                            </div>
                          )}
                          
                          {product.dimensions && (product.dimensions.l || product.dimensions.w || product.dimensions.h) && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">Dimensions</span>
                              <span className="font-medium text-gray-900 text-sm">
                                {product.dimensions.l || "—"} × {product.dimensions.w || "—"} × {product.dimensions.h || "—"} cm
                              </span>
                            </div>
                          )}
                          
                          {product.manufacturer && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">Manufacturer</span>
                              <span className="font-medium text-gray-900 text-sm">{product.manufacturer}</span>
                            </div>
                          )}
                          
                          {product.warranty && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">Warranty</span>
                              <span className="font-medium text-gray-900 text-sm">{product.warranty}</span>
                            </div>
                          )}
                          
                          {product.shippingClass && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">Shipping Class</span>
                              <span className="font-medium text-gray-900 text-sm">{product.shippingClass}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Additional Information */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">Additional Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pricing & Tax */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">Price Type</span>
                          <span className="font-medium text-gray-900 text-sm">
                            {product.priceIncludesTax ? "Tax Inclusive" : "Tax Exclusive"}
                          </span>
                        </div>
                        
                        {product.tax && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">Tax Rate</span>
                            <span className="font-medium text-gray-900 text-sm">
                              {(() => {
                                const t = product.tax as any;
                                const val = typeof t === 'object' ? (t.rate ?? t.percentage) : (typeof t === 'number' ? t : undefined);
                                return val != null && val !== '' ? `${val}%` : '—';
                              })()}
                            </span>
                          </div>
                        )}
                        
                        {product.tax && (typeof product.tax === 'object' ? product.tax.name : null) && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">Tax Name</span>
                            <span className="font-medium text-gray-900 text-sm">{typeof product.tax === 'object' ? product.tax.name : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Shipping & Returns */}
                      <div className="space-y-3">
                        {product.deliveryTime && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">Delivery Time</span>
                            <span className="font-medium text-gray-900 text-sm">{product.deliveryTime}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">Returnable</span>
                          <span className={`font-medium text-sm ${product.returnable ? 'text-green-600' : 'text-red-600'}`}>
                            {product.returnable ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        {product.returnable && typeof product.returnWindow === 'number' && product.returnWindow > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">Return Window</span>
                            <span className="font-medium text-gray-900 text-sm">{product.returnWindow} days</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">COD Available</span>
                          <span className={`font-medium text-sm ${product.codAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {product.codAvailable ? 'Yes' : 'No'}
                          </span>
                  </div>
                      </div>
                    </div>
                  </div>




          </div>
        </div>
      </div>

          </div>
          
        </div>
                {/* Product Description and Reviews - Tabbed Layout */}
                <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button 
                onClick={() => setActiveTab('description')}
                className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'description' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Description
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'reviews' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reviews ({displayReviewCount})
              </button>
            </nav>
          </div>
          
          <div className="mt-6">
            {activeTab === 'description' ? (
              /* Description Tab Content */
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} className="text-gray-700 leading-relaxed" />
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </div>
            ) : (
              /* Reviews Tab Content - Lazy Loaded */
              <Suspense fallback={
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-3 bg-gray-50/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-2.5 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              }>
                <LazyProductReviews
                  reviews={reviews}
                  reviewsLoading={reviewsLoading}
                  displayRating={displayRating}
                  displayReviewCount={displayReviewCount}
                  setIsReviewModalOpen={setIsReviewModalOpen}
                  handleMarkHelpful={handleMarkHelpful}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* Related Products Section - Lazy Loaded */}
        <Suspense fallback={
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-200/60 p-6 sm:p-8 mb-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <LazyRelatedProducts
            relatedProducts={relatedProducts}
            product={product}
            router={router}
            isInWishlist={isInWishlist}
            addToWishlist={addToWishlist}
            addToCart={addToCart}
            locationState={locationState}
            isGlobalMode={isGlobalMode}
          />
        </Suspense>


      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productId={product._id}
        productName={product.name}
        productImage={product.image}
        onReviewSubmitted={handleReviewSubmitted}
      />
      </div>
    </div>
  </>
  );
}

