"use client";
import React from "react";
import { Heart, Globe, Store, AlertTriangle, Star} from "lucide-react";
import { canAddToCart, getWarehouseConflictInfo } from "@/lib/warehouse-validation";
import { useCartContext } from "@/components/app-provider";
import { useWarehouseConflict } from "@/hooks/use-warehouse-conflict";
import WarehouseConflictModal from "@/components/warehouse-conflict-modal";

interface ProductCardProps {
  product: any;
  isInWishlist?: (id: string, variantId?: string) => boolean;
  handleWishlistClick?: (product: any, e: React.MouseEvent) => void;
  handleAdd?: (product: any) => void;
  handleAddToCart?: (product: any) => void;
  handleInc?: (product: any) => void;
  handleDec?: (product: any) => void;
  quantity?: number;
  locationState?: any;
  isGlobalMode?: boolean;
  onClick?: () => void;
  viewMode?: 'grid' | 'list';
  forceCanAdd?: boolean; // Allow parent to force canAddProduct to true
  alwaysShowAddButton?: boolean; // When true, hide quantity controls and show ADD button even if in cart
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isInWishlist,
  handleWishlistClick,
  handleAdd,
  handleAddToCart,
  handleInc,
  handleDec,
  quantity = 0,
  locationState,
  isGlobalMode,
  onClick,
  viewMode = 'grid',
  forceCanAdd,
  alwaysShowAddButton
}) => {
  // Rating component
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-[10px] h-[10px] text-yellow-400 fill-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-[10px] h-[10px]">
            <Star className="w-[10px] h-[10px] text-gray-300 fill-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-[10px] h-[10px] text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-[10px] h-[10px] text-gray-300 fill-gray-300" />
        );
      }
    }
    return stars;
  };
  const { cartItems, updateCartItem } = useCartContext();
  const {
    isModalOpen,
    conflictProduct,
    locationConflict,
    showConflictModal,
    handleClearCart,
    handleSwitchToGlobal,
    handleContinueShopping,
    closeModal,
    getCurrentWarehouse,
    getConflictingProductName
  } = useWarehouseConflict();
  
  const hasDiscount = product.mrp != null && product.mrp > product.price;
  const discountPercent = hasDiscount ? Math.round((((product.mrp ?? 0) - product.price) / (product.mrp ?? 1)) * 100) : 0;
  const showDiscountBadge = hasDiscount && discountPercent > 30;
  
  // Find this product in the cart to get its variant information
  const cartItem = cartItems.find(item => {
    const idMatch = (item.id || item._id) === product._id;
    // If product has variant, match both product ID and variant ID
    if (product.variantId) {
      return idMatch && item.variantId === product.variantId;
    }
    // If no variant, just match product ID
    return idMatch;
  });
  
  // If the product is in the cart with a variant, use that variant ID
  // Otherwise, use the product's variant ID if it has one
  const variantId = cartItem?.variantId || product.variantId;
  
  // Create a unique key for quantity tracking that includes variant
  const cartKey = variantId ? `${product._id}:${variantId}` : product._id;
  
  // Get current quantity from cart
  const currentQuantity = cartItem?.quantity || 0;
  
  // Create a product with variant information for the handlers
  const productWithVariant = variantId ? {...product, variantId} : product;
  
  // Warehouse validation
  const canAddProduct = forceCanAdd ? true : canAddToCart(product, cartItems);
  
  console.log('ProductCard debug:', {
    productName: product.name,
    productId: product._id,
    variantId: product.variantId,
    warehouse: product.warehouse,
    canAddProduct,
    cartItemsCount: cartItems.length,
    hasHandleAddToCart: !!handleAddToCart,
    hasHandleAdd: !!handleAdd
  });
  const conflictInfo = getWarehouseConflictInfo(product, cartItems);
  const isInCart = currentQuantity > 0;

  // Handle increment quantity
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handleInc) {
      handleInc(productWithVariant);
    } else if (updateCartItem) {
      const newQty = currentQuantity + 1;
      updateCartItem(product._id, newQty, variantId);
    }
  };

  // Handle decrement quantity
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handleDec) {
      handleDec(productWithVariant);
    } else if (updateCartItem) {
      const newQty = currentQuantity - 1;
      if (newQty <= 0) {
        updateCartItem(product._id, 0, variantId);
      } else {
        updateCartItem(product._id, newQty, variantId);
      }
    }
  };


  // List view layout
  if (viewMode === 'list') {
    return (
      <div
        className={`w-full bg-white border rounded-xl flex items-start sm:items-center gap-3 p-3 sm:gap-4 sm:p-4 relative group cursor-pointer hover:shadow-lg transition-all duration-300 ${
          !canAddProduct && !isInCart ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
        }`}
        style={{ fontFamily: 'Sinkin Sans, sans-serif' }}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={product.name}
      >
        {/* Discount Badge */}
        {showDiscountBadge && (
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 z-10 flex items-center justify-center scale-90 sm:scale-100" style={{ width: '29px', height: '28px', pointerEvents: 'none' }}>
            <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[9px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
              {discountPercent}%
              <br />
              OFF
            </div>
          </div>
        )}
        
        {/* Warehouse Conflict Warning */}
        {!canAddProduct && !isInCart && (
          <div className="absolute top-10 left-2 sm:top-3 sm:left-3 z-10 bg-orange-100 border border-orange-200 rounded-md px-2 py-1" style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-600" />
              <span className="text-[11px] sm:text-xs text-orange-700 font-medium">Different Store</span>
            </div>
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors"
          onClick={e => {
            e.stopPropagation();
            handleWishlistClick && handleWishlistClick(productWithVariant, e);
          }}
          aria-label={isInWishlist && isInWishlist(product._id, product.variantId || (product.variants && Object.keys(product.variants).length > 0 ? Object.keys(product.variants)[0] : undefined)) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-5 h-5 transition-colors duration-200 ${isInWishlist && isInWishlist(product._id, product.variantId || (product.variants && Object.keys(product.variants).length > 0 ? Object.keys(product.variants)[0] : undefined)) ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-none'}`} />
        </button>

        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            <img 
              src={product.image || "/placeholder.svg"} 
              alt={product.name} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Product Name and Variant */}
          <div className="sm:mb-2">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1 leading-snug sm:leading-tight line-clamp-2">
              {product.name}
            </h3>
            
            {/* Variant Name */}
            {product.variantName && (
              <p className="text-[11px] sm:text-sm text-gray-600 font-medium mb-0.5 sm:mb-1 line-clamp-1">
                Variant: {product.variantName}
              </p>
            )}

            {/* Category and Brand */}
            <p className="text-[11px] sm:text-sm text-gray-500 line-clamp-1">
              {product.category && typeof product.category === "object" && product.category !== null 
                ? product.category.name || product.categoryId || 'Unknown Category'
                : product.category || product.categoryId || 'Unknown Category'}
              {" • "}
              {product.brand && typeof product.brand === "object" && product.brand !== null 
                ? product.brand.name || product.brandId || 'Unknown Brand'
                : product.brand || product.brandId || 'Unknown Brand'}
            </p>
          </div>

          {/* Rating Stars */}
          <div className="flex items-center gap-[1px] sm:gap-[0.5px] mb-1 sm:mb-2">
            {renderStars(product.rating || 0)}
            <span className="text-[10px] sm:text-[9px] text-gray-500 ml-1">({product.rating || 0})</span>
          </div>

          {/* Price and Actions Section */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 w-full">
            {/* Left side - Price Information */}
            <div className="flex flex-col">
              <div className="text-base sm:text-xl font-bold text-purple-600 leading-none">
                ₹{product.price.toLocaleString()}
              </div>
              {hasDiscount && (
                <div className="text-[11px] sm:text-sm text-gray-400 line-through leading-none mt-0.5">
                  ₹{product.mrp?.toLocaleString()}
                </div>
              )}
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {(!alwaysShowAddButton && currentQuantity > 0) ? (
                <div className="flex items-center bg-brand-primary rounded-md justify-between" style={{ width: '70px', height: '28px' }}>
                  <button
                    className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-brand-primary-dark transition-colors rounded-l-md"
                    onClick={handleDecrement}
                    aria-label="Decrease quantity"
                  >-</button>
                  <span className="text-white font-bold text-sm select-none text-center flex-1 h-full flex items-center justify-center bg-brand-primary">{currentQuantity}</span>
                  <button
                    className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-brand-primary-dark transition-colors rounded-r-md"
                    onClick={handleIncrement}
                    aria-label="Increase quantity"
                  >+</button>
                </div>
              ) : canAddProduct ? (
                <button
                  className="border border-brand-primary text-brand-primary font-semibold text-[11px] bg-white hover:bg-brand-primary/10 transition-colors flex items-center justify-center rounded-md"
                  style={{ width: '70px', height: '28px', fontFamily: 'Sinkin Sans, sans-serif' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (handleAddToCart) {
                      handleAddToCart(productWithVariant);
                    } else if (handleAdd) {
                      handleAdd(productWithVariant);
                    }
                  }}
                  aria-label="ADD"
                  title="ADD"
                >
                  ADD
                </button>
              ) : (
                <button
                  className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    showConflictModal(productWithVariant);
                  }}
                  title="Click to see options"
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>BLOCKED</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Warehouse Conflict Modal */}
        <WarehouseConflictModal
          isOpen={isModalOpen}
          onClose={closeModal}
          currentWarehouse={getCurrentWarehouse()}
          conflictingProduct={getConflictingProductName()}
          onClearCart={handleClearCart}
          onSwitchToGlobal={handleSwitchToGlobal}
          onContinueShopping={handleContinueShopping}
          isLocationConflict={!!locationConflict}
          newWarehouse={locationConflict?.newWarehouse}
        />
      </div>
    );
  }

  return (
    <div
      key={product._id}
      className={`w-full h-full bg-white border rounded-lg flex flex-col relative group cursor-pointer hover:shadow-lg transition ${
        !canAddProduct && !isInCart ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
      }`}
      style={{ fontFamily: 'Sinkin Sans, sans-serif', boxShadow: 'none' }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={product.name}
    >
      {/* Discount Badge */}
      {showDiscountBadge && (
        <div className="absolute left-3 top-0 z-10 flex items-center justify-center" style={{ width: '29px', height: '28px', pointerEvents: 'none' }}>
          <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
          </svg>
          <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[9px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
            {discountPercent}%<br />OFF
          </div>
        </div>
      )}
      
      {/* Warehouse Conflict Warning */}
      {!canAddProduct && !isInCart && (
        <div className="absolute top-2 left-2 z-10 bg-orange-100 border border-orange-200 rounded-md px-2 py-1" style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span className="text-xs text-orange-700 font-medium">Different Store</span>
          </div>
        </div>
      )}
      
      {/* Wishlist Button */}
      <button
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow hover:bg-gray-100"
        onClick={e => {
          e.stopPropagation();
          handleWishlistClick && handleWishlistClick(productWithVariant, e);
        }}
        aria-label={isInWishlist && isInWishlist(product._id, product.variantId || (product.variants && Object.keys(product.variants).length > 0 ? Object.keys(product.variants)[0] : undefined)) ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-5 h-5 transition-colors duration-200 ${isInWishlist && isInWishlist(product._id, product.variantId || (product.variants && Object.keys(product.variants).length > 0 ? Object.keys(product.variants)[0] : undefined)) ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-none'}`} />
      </button>
      {/* Product Image */}
      <div className="flex justify-center items-center h-24 pt-2">
        <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-[80px] h-[80px] object-contain" />
      </div>
      <div className="px-2 py-2 flex-1 flex flex-col justify-between">
        {/* Top Content */}
        <div>
          {/* Delivery Mode Indicator */}
          {locationState?.isLocationDetected && (
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
          <div className="text-[11px] font-bold text-gray-900 line-clamp-2 mb-1 leading-tight" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
            {product.name}
          </div>
          
          {/* Variant Name */}
          {product.variantName && (
            <div className="text-[9px] text-purple-600 font-medium mb-1 leading-tight">
              {product.variantName}
            </div>
          )}
          {/* Rating Stars */}
          <div className="flex items-center gap-[0.1px] mb-1">
            {renderStars(product.rating || 0)}
            <span className="text-[9px] text-gray-500 ml-1">({product.rating || 0})</span>
          </div>
          {/* Variant/Weight/Unit */}
          <div className={`text-[10px] mb-1 font-normal flex items-center gap-1 ${product.variants && Object.keys(product.variants).length > 0 ? 'text-purple-600' : 'text-gray-500'}`} style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
            <span>{product.unit}</span>
            {product.variants && Object.keys(product.variants).length > 0 && (
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        {/* Bottom Section: Price, MRP, ADD button */}
        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="flex flex-col justify-end">
            <div className="text-[12px] font-bold text-gray-900 leading-none mb-1" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{product.price}</div>
            {hasDiscount && (
              <div className="text-[10px] text-gray-400 line-through leading-none font-normal" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{product.mrp}</div>
            )}
          </div>
          <div className="flex-shrink-0">
            {(!alwaysShowAddButton && currentQuantity > 0) ? (
              <div className="flex items-center bg-brand-primary rounded-md justify-between" style={{ width: '70px', height: '28px' }}>
                <button
                  className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-brand-primary-dark transition-colors rounded-l-md"
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                >-</button>
                <span className="text-white font-bold text-sm select-none text-center flex-1 h-full flex items-center justify-center bg-brand-primary">{currentQuantity}</span>
                <button
                  className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-brand-primary-dark transition-colors rounded-r-md"
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                >+</button>
              </div>
            ) : canAddProduct ? (
              <button
                className="border border-brand-primary text-brand-primary font-semibold text-[11px] bg-white hover:bg-brand-primary/10 transition-colors flex items-center justify-center rounded-md"
                style={{ width: '70px', height: '28px', fontFamily: 'Sinkin Sans, sans-serif' }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('ADD button clicked for product:', product.name);
                  console.log('handleAddToCart available:', !!handleAddToCart);
                  console.log('handleAdd available:', !!handleAdd);
                  console.log('productWithVariant:', productWithVariant);
                  
                  if (handleAddToCart) {
                    console.log('Calling handleAddToCart with:', productWithVariant);
                    handleAddToCart(productWithVariant);
                  } else if (handleAdd) {
                    console.log('Calling handleAdd with:', productWithVariant);
                    handleAdd(productWithVariant);
                  } else {
                    console.log('No handler available for adding to cart');
                  }
                }}
              >
                ADD
              </button>
            ) : (
              <button
                className="border border-orange-300 text-orange-600 font-medium text-[9px] bg-orange-50 hover:bg-orange-100 transition-colors rounded-md"
                style={{ width: '70px', height: '28px', fontFamily: 'Sinkin Sans, sans-serif' }}
                onClick={(e) => {
                  e.stopPropagation();
                  showConflictModal(productWithVariant);
                }}
                title="Click to see options"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>BLOCK</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Warehouse Conflict Modal */}
      <WarehouseConflictModal
        isOpen={isModalOpen}
        onClose={closeModal}
        currentWarehouse={getCurrentWarehouse()}
        conflictingProduct={getConflictingProductName()}
        onClearCart={handleClearCart}
        onSwitchToGlobal={handleSwitchToGlobal}
        onContinueShopping={handleContinueShopping}
        isLocationConflict={!!locationConflict}
        newWarehouse={locationConflict?.newWarehouse}
      />
    </div>
  );
};

export default ProductCard;
