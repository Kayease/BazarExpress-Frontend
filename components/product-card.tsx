"use client";
import React from "react";
import { Heart, Globe, Store, AlertTriangle, Star } from "lucide-react";
import { canAddToCart, getWarehouseConflictInfo } from "@/lib/warehouse-validation";
import { useCartContext } from "@/components/app-provider";
import { useWarehouseConflict } from "@/hooks/use-warehouse-conflict";
import WarehouseConflictModal from "@/components/warehouse-conflict-modal";

interface ProductCardProps {
  product: any;
  isInWishlist?: (id: string) => boolean;
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
  viewMode = 'grid'
}) => {
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
  const canAddProduct = canAddToCart(product, cartItems);
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


  if (viewMode === 'list') {
    return (
      <div
        className={`w-full bg-white border border-gray-100 rounded-lg flex items-center p-3 gap-3 relative group cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 ${
          !canAddProduct && !isInCart ? 'border-orange-200 bg-orange-50/30' : 'hover:bg-gray-50/50'
        }`}
        style={{ fontFamily: 'Sinkin Sans, sans-serif' }}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={product.name}
      >
        {/* Discount Badge */}
        {showDiscountBadge && (
          <div className="absolute left-5 top-0 z-10 flex items-center justify-center" style={{ width: '29px', height: '28px', pointerEvents: 'none' }}>
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
          <div className="absolute top-2 left-2 z-10" style={{ pointerEvents: 'none' }}>
            <div className="bg-orange-100 border border-orange-200 rounded-md px-2 py-1">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-600" />
                <span className="text-xs text-orange-700 font-medium">Different Store</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200"
          onClick={e => {
            e.stopPropagation();
            handleWishlistClick && handleWishlistClick(productWithVariant, e);
          }}
          aria-label={isInWishlist && isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 transition-colors duration-200 ${isInWishlist && isInWishlist(product._id) ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-400'}`} />
        </button>

        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
            <img 
              src={product.image || "/placeholder.svg"} 
              alt={product.name} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          {/* Delivery Mode Indicator */}
          {locationState?.isLocationDetected && (
            <div className="flex items-center gap-2 mb-2">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isGlobalMode 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}>
                {isGlobalMode ? (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>Global</span>
                  </>
                ) : (
                  <>
                    <Store className="w-3 h-3" />
                    <span>Local</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight line-clamp-2">
            {product.name}
          </h3>

          {/* Rating Stars */}
          <div className="flex items-center gap-1 mb-2">
            {renderStars(product.rating || 0)}
            <span className="text-xs text-gray-500 ml-1">({product.rating || 0})</span>
          </div>

          {/* Variant/Weight/Unit */}
          <div className={`text-xs mb-2 font-medium flex items-center gap-1 ${product.variants && Object.keys(product.variants).length > 0 ? 'text-green-600' : 'text-gray-600'}`}>
            <span>{product.unit}</span>
            {product.variants && Object.keys(product.variants).length > 0 && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Price Section */}
          <div className="flex items-center gap-2">
            <div className="text-base font-bold text-gray-900">
              ₹{product.price}
            </div>
            {hasDiscount && (
              <div className="text-sm text-gray-400 line-through font-medium">
                ₹{product.mrp}
              </div>
            )}
          </div>
        </div>

        {/* Action Section - All buttons are absolutely positioned */}
        {currentQuantity > 0 ? (
          <div className="absolute bottom-4 right-3 flex items-center bg-green-600 rounded-lg shadow-sm" style={{ width: '80px', height: '32px' }}>
            <button
              className="text-white text-sm font-semibold focus:outline-none rounded-l-lg px-2 py-1 hover:bg-green-700 transition-colors duration-150 border-none flex-1 h-full flex items-center justify-center"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="text-white font-bold text-sm select-none px-2 py-1 bg-green-600 flex-1 h-full flex items-center justify-center">
              {currentQuantity}
            </span>
            <button
              className="text-white text-sm font-semibold focus:outline-none rounded-r-lg px-2 py-1 hover:bg-green-700 transition-colors duration-150 border-none flex-1 h-full flex items-center justify-center"
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : canAddProduct ? (
          <button
            className="absolute bottom-4 right-3 bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
            style={{ width: '80px', height: '32px' }}
            onClick={(e) => {
              e.stopPropagation();
              if (handleAddToCart) {
                handleAddToCart(productWithVariant);
              } else if (handleAdd) {
                handleAdd(productWithVariant);
              }
            }}
          >
            ADD
          </button>
        ) : (
          <button
            className="absolute bottom-4 right-3 bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium text-sm px-3 py-2 rounded-lg border border-orange-200 hover:border-orange-300 transition-all duration-200 flex items-center justify-center"
            style={{ width: '80px', height: '32px' }}
            onClick={(e) => {
              e.stopPropagation();
              showConflictModal(productWithVariant);
            }}
            title="Click to see options"
          >
            <div className="flex items-center justify-center">
              <AlertTriangle className="w-3 h-3" />
              <span>Blocked</span>
            </div>
          </button>
        )}

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
      className={`w-full max-w-[180px] bg-white border rounded-lg flex flex-col relative group cursor-pointer hover:shadow-lg transition ${
        !canAddProduct && !isInCart ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
      }`}
      style={{ fontFamily: 'Sinkin Sans, sans-serif', boxShadow: 'none', minHeight: '220px' }}
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
        aria-label={isInWishlist && isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-5 h-5 transition-colors duration-200 ${isInWishlist && isInWishlist(product._id) ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-none'}`} />
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
          {/* Rating Stars */}
          <div className="flex items-center gap-1 mb-1">
            {renderStars(product.rating || 0)}
            <span className="text-[9px] text-gray-500 ml-1">({product.rating || 0})</span>
          </div>
          {/* Variant/Weight/Unit */}
          <div className={`text-[10px] mb-1 font-normal flex items-center gap-1 ${product.variants && Object.keys(product.variants).length > 0 ? 'text-green-600' : 'text-gray-500'}`} style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
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
            {currentQuantity > 0 ? (
              <div className="flex items-center bg-green-600 rounded-md justify-between" style={{ width: '70px', height: '28px' }}>
                <button
                  className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-green-700 transition-colors rounded-l-md"
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                >-</button>
                <span className="text-white font-bold text-sm select-none text-center flex-1 h-full flex items-center justify-center bg-green-600">{currentQuantity}</span>
                <button
                  className="text-white text-sm font-semibold focus:outline-none flex-1 text-center h-full flex items-center justify-center hover:bg-green-700 transition-colors rounded-r-md"
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                >+</button>
              </div>
            ) : canAddProduct ? (
              <button
                className="border border-green-600 text-green-700 font-semibold text-[11px] bg-white hover:bg-green-50 transition-colors flex items-center justify-center rounded-md"
                style={{ width: '70px', height: '28px', fontFamily: 'Sinkin Sans, sans-serif' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (handleAddToCart) {
                    handleAddToCart(productWithVariant);
                  } else if (handleAdd) {
                    handleAdd(productWithVariant);
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
