"use client";

import { Clock, Loader2, Star, StarHalf, Info, Package, Tag, Truck, Shield, Heart, ShoppingCart, ChevronLeft, ChevronRight, Globe, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAppContext, useCartContext, useWishlistContext } from "@/components/app-provider";
import { useLocation } from "@/components/location-provider";
import { useHomeProducts, useSearchProducts } from "@/hooks/use-products";
import toast from "react-hot-toast";
import { ProductWithWarehouse } from "@/lib/warehouse-validation";
// import { useWarehouseValidation } from "@/hooks/use-warehouse-validation";

// Define interfaces for our data types

// Inside ProductSection component
// (hook call moved into component body below)

interface Product {
  _id: string;
  name: string;
  price: number; // Keep as required for type safety
  unit: string;
  image: string;
  rating: number;
  deliveryTime: string;
  description?: string;
  stock?: number;
  category?: Category;
  status?: string;
  brand?: any;
  sku?: string;
  mrp?: number;
  costPrice?: number;
  priceIncludesTax?: boolean;
  allowBackorders?: boolean;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: {
    l?: string;
    w?: string;
    h?: string;
  };
  returnable?: boolean;
  returnWindow?: number;
  codAvailable?: boolean;
  galleryImages?: string[];
  manufacturer?: string;
  warranty?: string;
  warehouse?: {
    _id: string;
    name: string;
    deliverySettings?: {
      is24x7Delivery?: boolean;
      deliveryHours?: {
        start: string;
        end: string;
      };
    };
  };
  // Add variants property to match product detail page
  variants?: {
    [key: string]: {
      name: string;
      price: number;
      mrp?: number;
      stock?: number;
      images?: string[];
    };
  };
  // Additional properties that might be added during cart operations
  id?: string;
  quantity?: number;
  variantId?: string;
  variantName?: string;
  selectedVariant?: any;
}

// Using ProductWithWarehouse from warehouse-validation.ts

interface Category {
  _id: string;
  name: string;
  popular: boolean;
  showOnHome: boolean;
  hide?: boolean;
  icon?: string;
  description?: string;
  thumbnail?: string;
  productCount?: number;
  parentId?: string | null;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductSection {
  category: Category;
  products: Product[];
}

interface ProductSectionProps {
  onAddToCart: (product: Product) => void;
  searchQuery: string;
}

export default function ProductSection({
  onAddToCart,
  searchQuery,
}: ProductSectionProps) {
  // Rating component
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className="w-3 h-3 text-gray-300 fill-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300 fill-gray-300" />
        );
      }
    }
    return stars;
  };

  // Get wishlist functions from context
  const { addToCart, updateCartItem, cartItems } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();
  
  // Get location context
  const { locationState, deliveryMessage, isGlobalMode, isLoading } = useLocation();
  
  // Router for navigation
  const router = useRouter();

  // Use cached hooks for data fetching
  const { 
    data: homeProductSections, 
    isLoading: homeLoading, 
    error: homeError 
  } = useHomeProducts(
    locationState.pincode || undefined, 
    locationState.isGlobalMode
  );

  const { 
    data: searchProductSections, 
    isLoading: searchLoading, 
    error: searchError 
  } = useSearchProducts(
    searchQuery, 
    locationState.pincode || undefined, 
    locationState.isGlobalMode
  );

  // Determine which data to use based on search query
  const productSections = useMemo(() => {
    if (searchQuery && searchQuery.trim()) {
      return searchProductSections || [];
    }
    return homeProductSections || [];
  }, [searchQuery, searchProductSections, homeProductSections]);

  const loading = useMemo(() => {
    if (searchQuery && searchQuery.trim()) {
      return searchLoading;
    }
    return homeLoading;
  }, [searchQuery, searchLoading, homeLoading]);

  const error = useMemo(() => {
    if (searchQuery && searchQuery.trim()) {
      return searchError;
    }
    return homeError;
  }, [searchQuery, searchError, homeError]);

  // Local quantity state for product tiles - track by product ID and variant ID
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  
  // Updated warehouse validation logic - only same warehouse products allowed
  const canAddToCart = (product: Product | ProductWithWarehouse) => {
    if (cartItems.length === 0) return true; // Empty cart, can add anything
    
    // Check if product has warehouse info
    if (!product.warehouse) return true;
    
    // Find ANY existing warehouse in cart (custom or global)
    let existingWarehouse = null;
    for (const cartItem of cartItems) {
      if (cartItem.warehouse && cartItem.warehouse._id) {
        existingWarehouse = cartItem.warehouse;
        break;
      }
    }
    
    // If no warehouse in cart, allow adding
    if (!existingWarehouse) return true;
    
    // Only allow if product is from the SAME warehouse (custom or global)
    if (existingWarehouse._id === product.warehouse._id) return true;
    
    // Different warehouse (custom or global), block
    console.log('Warehouse conflict detected:', {
      productWarehouse: product.warehouse.name,
      existingWarehouse: existingWarehouse.name,
      productId: product._id,
      productIsGlobal: product.warehouse.deliverySettings?.is24x7Delivery,
      existingIsGlobal: existingWarehouse.deliverySettings?.is24x7Delivery
    });
    return false;
  };
  

  // Sync local quantity state with cartItems - handle variants
  useEffect(() => {
    const newQuantities: { [key: string]: number } = {};
    console.log('Syncing quantities with cart items:', cartItems);
    
    cartItems.forEach(item => {
      const itemId = item.id || item._id;
      // Create a unique key that includes both product ID and variant ID (if present)
      const cartKey = item.variantId ? `${itemId}:${item.variantId}` : itemId;
      newQuantities[cartKey] = item.quantity;
      console.log(`Setting quantity for ${cartKey} to ${item.quantity}`, item);
    });
    
    console.log('New quantities:', newQuantities);
    setQuantities(newQuantities);
  }, [cartItems]);


  const handleAdd = async (product: Product | ProductWithWarehouse) => {
    const productId = product._id;
    
    // Check warehouse validation before adding
    if (!canAddToCart(product)) {
      // Don't add to cart if there's a warehouse conflict
      // The backend validation and toast will handle the error display
      console.log('Blocked: Cannot add product due to warehouse conflict');
      return;
    }
    
    try {
      // If the product already has a variant ID (from the cart), use that
      if (product.variantId) {
        console.log('Product already has variant ID:', product.variantId);
        
        // Find the variant in the product's variants
        const variant = product.variants?.[product.variantId];
        
        // Create a unique key for quantity tracking that includes variant
        const cartKey = `${productId}:${product.variantId}`;
        setQuantities(q => ({ ...q, [cartKey]: 1 }));
        
        await addToCart({ 
          ...product, 
          id: productId, 
          quantity: 1,
          // Include variant information
          variantId: product.variantId,
          variantName: variant?.name || product.variantId.replace(/::/g, ' '),
          selectedVariant: variant,
          // Use variant price if available, with fallback to product price
          price: (variant?.price !== undefined ? variant.price : product.price)
        });
        
        // Show toast with variant name
        toast.success(`${product.name} (${variant?.name || product.variantId.replace(/::/g, ' ')}) added to cart`);
      }
      // Check if product has variants and include the first variant by default
      else if (product.variants && Object.keys(product.variants).length > 0) {
        const firstVariantKey = Object.keys(product.variants)[0];
        const firstVariant = product.variants[firstVariantKey];
        
        // Create a unique key for quantity tracking that includes variant
        const cartKey = `${productId}:${firstVariantKey}`;
        setQuantities(q => ({ ...q, [cartKey]: 1 }));
        
        await addToCart({ 
          ...product, 
          id: productId, 
          quantity: 1,
          // Include variant information
          variantId: firstVariantKey,
          variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
          selectedVariant: firstVariant,
          // Use variant price if available, with fallback to product price
          price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
        });
        
        // Show toast with variant name
        toast.success(`${product.name} (${firstVariant.name || firstVariantKey.replace(/::/g, ' ')}) added to cart`);
      } else {
        // No variants, use product ID as key
        setQuantities(q => ({ ...q, [productId]: 1 }));
        await addToCart({ ...product, id: productId, quantity: 1 });
        toast.success(`${product.name} added to cart`);
      }
    } catch (error: any) {
      if (error.isVariantRequired) {
        toast.error(`Please select a variant for ${product.name} before adding to cart`);
      } else if (error.isWarehouseConflict) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add item to cart');
      }
      // Reset quantity on error - use product ID as key since we don't know if variant was successful
      setQuantities(q => ({ ...q, [productId]: 0 }));
    }
  };
  const handleInc = (product: Product | ProductWithWarehouse) => {
    const id = product._id;
    
    // Find this product in the cart to get its variant information
    const cartItem = cartItems.find(item => (item.id || item._id) === id);
    
    // If the product is in the cart with a variant, use that variant ID
    // Otherwise, use the product's variant ID if it has one
    const variantId = cartItem?.variantId || product.variantId;
    
    // Create a unique key that includes variant ID if present
    const cartKey = variantId ? `${id}:${variantId}` : id;
    
    console.log('handleInc:', { id, variantId, cartKey, cartItem });
    
    const newQty = (quantities[cartKey] || 0) + 1;
    setQuantities(q => ({ ...q, [cartKey]: newQty }));
    
    // Pass both product ID and variant ID to updateCartItem
    updateCartItem(id, newQty, variantId);
  };
  const handleDec = (product: Product | ProductWithWarehouse) => {
    const id = product._id;
    
    // Find this product in the cart to get its variant information
    const cartItem = cartItems.find(item => (item.id || item._id) === id);
    
    // If the product is in the cart with a variant, use that variant ID
    // Otherwise, use the product's variant ID if it has one
    const variantId = cartItem?.variantId || product.variantId;
    
    // Create a unique key that includes variant ID if present
    const cartKey = variantId ? `${id}:${variantId}` : id;
    
    console.log('handleDec:', { id, variantId, cartKey, cartItem });
    
    const newQty = (quantities[cartKey] || 0) - 1;
    if (newQty <= 0) {
      setQuantities(q => ({ ...q, [cartKey]: 0 }));
      // Pass both product ID and variant ID to updateCartItem
      updateCartItem(id, 0, variantId);
    } else {
      setQuantities(q => ({ ...q, [cartKey]: newQty }));
      // Pass both product ID and variant ID to updateCartItem
      updateCartItem(id, newQty, variantId);
    }
  };

  // Carousel scroll state
  const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleScroll = (catId: string) => {
    const ref = scrollRefs.current[catId];
    if (ref) {
      setScrollPositions((prev) => ({ ...prev, [catId]: ref.scrollLeft }));
    }
  };

  const scrollByAmount = (catId: string, amount: number) => {
    const ref = scrollRefs.current[catId];
    if (ref) {
      ref.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };



  const handleWishlistClick = (product: Product | ProductWithWarehouse, e?: React.MouseEvent) => {
    // Stop event propagation to prevent navigation when clicking wishlist
    if (e) {
      e.stopPropagation();
    }
    
    // Check if product has variants and include the first variant by default
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
      
      // Call the actual wishlist function from context with variant info
      if (addToWishlist) {
        addToWishlist(productWithVariant);
        console.log('Add to wishlist with variant:', productWithVariant);
      }
    } else {
      // Implementation of add to wishlist for non-variant products
      console.log('Add to wishlist:', product);
      // Call the actual wishlist function from context
      if (addToWishlist) {
        addToWishlist(product);
      }
    }
  };

  const handleProductClick = (product: Product | ProductWithWarehouse) => {
    // Navigate to product detail page with correct URL format
    router.push(`/products/${product._id}`);
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    // Stop event propagation to prevent navigation when clicking buttons
    e.stopPropagation();
    action();
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        <p className="mt-4 text-text-secondary">Loading products...</p>
      </div>
    );
  }

  // Use location context to determine loading/error state
  const isLocationDetected = locationState?.isLocationDetected;
  const contextPincode = locationState?.pincode;

  // Show loading while location/pincode is being fetched
  if (isLoading || !isLocationDetected) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        <p className="mt-4 text-text-secondary">Loading products...</p>
      </div>
    );
  }

  // Only show error if location is detected but pincode is missing and there is an error
  if (isLocationDetected && !contextPincode && error) {
    return (
      <section className="py-12 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-500">{error instanceof Error ? error.message : 'Please select your delivery PIN code to view available products.'}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (productSections.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <p className="text-text-secondary">No product found to display on home page.</p>
      </div>
    );
  }

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {productSections.length > 0 ? (
          productSections.map(section => {
            // Debug: Log all product IDs in this section
            const idCounts: { [id: string]: number } = {};
            section.products.forEach(product => {
              idCounts[product._id] = (idCounts[product._id] || 0) + 1;
            });
            const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);
            if (duplicateIds.length > 0) {
              console.warn('Duplicate product IDs found in section', section.category.name, duplicateIds);
            }
            return (
              <div className="mb-8 sm:mb-12" key={section.category._id}>
                <div className="flex justify-between items-center mb-4 px-2 sm:px-0">
                  <div className="text-xl sm:text-2xl font-extrabold">{section.category.name}</div>
                  <Link href={`/products?category=${section.category._id}`} className="text-green-600 font-medium hover:underline text-sm sm:text-base">See all</Link>
                </div>
                <div className="relative">
                  {/* Left Button - Hidden on mobile, visible on larger screens */}
                  {scrollPositions[section.category._id] > 0 && (
                    <button
                      className="hidden lg:flex absolute left-[-28px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow p-1 items-center justify-center hover:bg-gray-100"
                      style={{ width: 32, height: 32 }}
                      onClick={() => scrollByAmount(section.category._id, -220)}
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* Right Button - Hidden on mobile, visible on larger screens */}
                  <button
                    className="hidden lg:flex absolute right-[-28px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow p-1 items-center justify-center hover:bg-gray-100"
                    style={{ width: 32, height: 32, display: section.products.length * 190 > (scrollRefs.current[section.category._id]?.clientWidth || 0) + (scrollRefs.current[section.category._id]?.scrollLeft || 0) ? 'flex' : 'none' }}
                    onClick={() => scrollByAmount(section.category._id, 220)}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Mobile Navigation Dots - Hidden on mobile, only visible on tablet */}
                  <div className="hidden md:flex lg:hidden justify-center mt-4 space-x-2">
                    {Array.from({ length: Math.ceil(section.products.length / 2) }).map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === Math.floor((scrollRefs.current[section.category._id]?.scrollLeft || 0) / 200) 
                            ? 'bg-green-600' 
                            : 'bg-gray-300'
                        }`}
                        onClick={() => {
                          const scrollAmount = index * 200;
                          scrollRefs.current[section.category._id]?.scrollTo({
                            left: scrollAmount,
                            behavior: 'smooth'
                          });
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  <div
                    className="overflow-x-auto scrollbar-hide"
                    ref={el => { scrollRefs.current[section.category._id] = el; }}
                    onScroll={() => handleScroll(section.category._id)}
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div className="flex gap-3 sm:gap-4 pb-2 px-4 sm:px-6 lg:px-0">
                      {/* Remove the left padding that was causing uneven spacing */}
                      {section.products.map(product => {
                        // Handle potentially undefined price safely
                        const productPrice = product.price || 0;
                        const hasDiscount = product.mrp != null && product.mrp > productPrice;
                        const discountPercent = hasDiscount ? Math.round((((product.mrp ?? 0) - productPrice) / (product.mrp ?? 1)) * 100) : 0;
                        const showDiscountBadge = hasDiscount && discountPercent > 30;
                        
                        // Warehouse validation for this product
                        const canAddProduct = canAddToCart(product);
                        // Find this product in the cart to get its variant information
                        const cartItem = cartItems.find(item => {
                          const idMatch = (item.id || item._id) === product._id;
                          // If we're looking at a product with variants, we need to check if it's in the cart
                          // with any variant
                          return idMatch;
                        });
                        
                        // If the product is in the cart with a variant, use that variant ID
                        // Otherwise, use the product's variant ID if it has one
                        const variantId = cartItem?.variantId || product.variantId;
                        
                        // Create a unique key that includes variant ID if present
                        const cartKey = variantId ? `${product._id}:${variantId}` : product._id;
                        const isInCart = quantities[cartKey] > 0;
                        
                        // Debug logging
                        console.log(`Product ${product.name} (${product._id}):`, {
                          hasVariantInProduct: !!product.variantId,
                          productVariantId: product.variantId,
                          hasVariantInCart: !!cartItem?.variantId,
                          cartItemVariantId: cartItem?.variantId,
                          variantId,
                          cartKey,
                          quantity: quantities[cartKey],
                          isInCart
                        });
                        
                        // Get conflict info for display
                        const getConflictMessage = () => {
                          if (canAddProduct || isInCart) return '';
                          
                          // Find ANY existing warehouse
                          let existingWarehouse = null;
                          for (const cartItem of cartItems) {
                            if (cartItem.warehouse && cartItem.warehouse._id) {
                              existingWarehouse = cartItem.warehouse;
                              break;
                            }
                          }
                          
                          return existingWarehouse ? 
                            `Your cart has items from "${existingWarehouse.name}". Clear cart or choose products from the same store.` :
                            'Cannot add to cart due to warehouse conflict';
                        };
                        
                        return (
                          <div 
                            key={product._id} 
                            className={`min-w-[160px] sm:min-w-[180px] max-w-[160px] sm:max-w-[180px] bg-white border rounded-xl flex-shrink-0 flex flex-col relative group cursor-pointer hover:shadow-lg transition-shadow ${
                              !canAddProduct && !isInCart ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
                            }`}
                            style={{ fontFamily: 'Sinkin Sans, sans-serif', boxShadow: 'none', minHeight: '260px' }}
                            onClick={() => handleProductClick(product)}
                          >
                            {/* Discount Badge */}
                            {showDiscountBadge && (
                              <div className="absolute left-3 top-0 z-10 flex items-center justify-center" style={{ width: '29px', height: '28px', pointerEvents: 'none' }}>
                                <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
                                </svg>
                                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[9px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
                                  {discountPercent}%<br/>OFF
                                </div>
                              </div>
                            )}
                            
                            {/* Warehouse Conflict Warning */}
                            {!canAddProduct && !isInCart && (
                              <div className="absolute top-2 left-2 z-10 bg-orange-100 border border-orange-200 rounded-md px-2 py-1">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs text-orange-700 font-medium">Different Store</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Wishlist Button */}
                            <button
                              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow hover:bg-gray-100"
                              onClick={(e) => handleWishlistClick(product, e)}
                              aria-label={isInWishlist && isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              <Heart className={`w-5 h-5 transition-colors duration-200 ${isInWishlist && isInWishlist(product._id) ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-none'}`} />
                            </button>
                            {/* Product Image */}
                            <div className="flex justify-center items-center h-32 pt-2">
                              <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-[120px] h-[120px] object-contain" />
                          </div>
                            <div className="px-3 py-2 flex-1 flex flex-col justify-between">
                              {/* Top Content */}
                              <div>
                                {/* Delivery Mode Indicator */}
                                {locationState.isLocationDetected && (
                                  <div className="text-[9px] text-gray-400 flex items-center gap-1 mb-1" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
                                    {isGlobalMode ? (
                                      <>
                                        <Globe className="w-2.5 h-2.5" />
                                        <span>Global Store</span>
                                      </>
                                    ) : (
                                      <>
                                        <Store className="w-2.5 h-2.5" />
                                        <span>Local Store</span>
                                      </>
                                    )}
                                  </div>
                                )}
                                {/* Product Name */}
                                <div className="text-[12px] font-bold text-gray-900 line-clamp-2 mb-1 leading-snug" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
                                  {product.name}
                                </div>
                                {/* Rating Stars */}
                                <div className="flex items-center gap-1 mb-1">
                                  {renderStars(product.rating || 0)}
                                  <span className="text-[9px] text-gray-500 ml-1">({product.rating || 0})</span>
                                </div>
                                {/* Variant/Weight/Unit */}
                                <div className="text-xs text-gray-500 mb-1 font-normal" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
                                  {product.unit}
                                </div>
                              </div>
                              {/* Bottom Section: Price, MRP, ADD button */}
                              <div className="flex items-end justify-between mt-auto pt-2">
                                <div className="flex flex-col justify-end">
                                  <div className="text-[15px] font-bold text-gray-900 leading-none mb-1" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{productPrice}</div>
                                  {hasDiscount && (
                                    <div className="text-xs text-gray-400 line-through leading-none font-normal" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{product.mrp}</div>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {isInCart ? (
                                    <div className="flex items-center bg-green-600 rounded-md justify-between" style={{ width: '70px', height: '28px' }}>
                                      <button
                                        className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-green-700 transition-colors rounded-l-md"
                                        onClick={(e) => handleButtonClick(e, () => handleDec({...product, variantId: variantId}))}
                                        aria-label="Decrease quantity"
                                      >-</button>
                                      <span className="text-white font-bold text-sm select-none text-center flex-1 h-full flex items-center justify-center bg-green-600">{quantities[cartKey] || 0}</span>
                                      <button
                                        className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-green-700 transition-colors rounded-r-md"
                                        onClick={(e) => handleButtonClick(e, () => handleInc({...product, variantId: variantId}))}
                                        aria-label="Increase quantity"
                                      >+</button>
                                    </div>
                                  ) : canAddProduct ? (
                                    <button
                                      className="border border-green-600 text-green-700 font-semibold text-[11px] bg-white hover:bg-green-50 transition-colors flex items-center justify-center rounded-md"
                                      style={{ width: '70px', height: '28px', fontFamily: 'Sinkin Sans, sans-serif' }}
                                      onClick={(e) => handleButtonClick(e, () => handleAdd({...product, variantId: variantId}))}
                                    >ADD</button>
                                  ) : (
                                    <button
                                      className="border border-orange-300 text-orange-600 font-medium text-[9px] bg-orange-50 cursor-not-allowed rounded-md"
                                      style={{ width: '70px', height: '28px', fontFamily: 'Sinkin Sans, sans-serif' }}
                                      onClick={(e) => handleButtonClick(e, () => {
                                        // Don't call handleAdd for blocked products
                                        console.log('Blocked: Cannot add product due to warehouse conflict');
                                      })}
                                      title={getConflictMessage()}
                                    >
                                      <div className="flex items-center justify-center gap-0.5">
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>BLOCK</span>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Remove the right padding to ensure balanced spacing */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground/70">No products found. Try a different search term.</p>
            <Link href="/search" className="mt-4 inline-block text-primary hover:underline">
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}