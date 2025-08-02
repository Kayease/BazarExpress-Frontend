/**
 * Enhanced Product Card with Warehouse Validation
 * 
 * This component extends the basic ProductCard with warehouse validation,
 * showing appropriate UI states for warehouse conflicts and providing
 * better user feedback.
 */

"use client";
import React from "react";
import { Heart, Globe, Store, AlertTriangle, Info } from "lucide-react";
import { useProductCardState } from "@/hooks/use-warehouse-validation";
import toast from "react-hot-toast";

interface EnhancedProductCardProps {
  product: any;
  isInWishlist?: (id: string) => boolean;
  handleWishlistClick?: (product: any, e: React.MouseEvent) => void;
  handleAdd?: (product: any) => void;
  handleInc?: (product: any) => void;
  handleDec?: (product: any) => void;
  locationState?: any;
  onClick?: () => void;
  showWarehouseInfo?: boolean;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  isInWishlist,
  handleWishlistClick,
  handleAdd,
  handleInc,
  handleDec,
  locationState,
  onClick,
  showWarehouseInfo = true
}) => {
  const {
    quantity,
    isInCart,
    canAdd,
    buttonState,
    disabledReason,
    conflictInfo,
    warehouseName,
    isGlobalWarehouse: isGlobal
  } = useProductCardState(product);

  const hasDiscount = product.mrp != null && product.mrp > product.price;
  const discountPercent = hasDiscount ? Math.round((((product.mrp ?? 0) - product.price) / (product.mrp ?? 1)) * 100) : 0;
  const showDiscountBadge = hasDiscount && discountPercent > 30;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!canAdd) {
      // Show warehouse conflict information
      toast.error(disabledReason, {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }
    
    handleAdd && handleAdd(product);
  };

  const renderAddButton = () => {
    if (buttonState === 'quantity') {
      return (
        <div className="flex items-center bg-green-700 rounded justify-between" style={{ minWidth: '80px', width: '80px', height: '32px' }}>
          <button
            className="text-white text-lg focus:outline-none flex-1 text-center h-full flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleDec && handleDec(product);
            }}
            aria-label="Decrease quantity"
          >-</button>
          <span className="text-white font-bold text-base select-none text-center flex-1 h-full flex items-center justify-center">{quantity}</span>
          <button
            className="text-white text-lg focus:outline-none flex-1 text-center h-full flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleInc && handleInc(product);
            }}
            aria-label="Increase quantity"
          >+</button>
        </div>
      );
    }

    if (buttonState === 'disabled') {
      return (
        <div className="relative">
          <button
            className="border border-gray-300 text-gray-400 font-medium text-[15px] bg-gray-50 cursor-not-allowed"
            style={{ minWidth: '80px', width: '80px', height: '32px', fontFamily: 'Sinkin Sans, sans-serif', borderRadius: '4px', boxShadow: 'none' }}
            onClick={handleAddClick}
            disabled
            title={disabledReason}
          >
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs">BLOCKED</span>
            </div>
          </button>
        </div>
      );
    }

    return (
      <button
        className="border border-green-600 text-green-700 font-medium text-[15px] bg-white hover:bg-green-50 transition"
        style={{ minWidth: '80px', width: '80px', height: '32px', fontFamily: 'Sinkin Sans, sans-serif', borderRadius: '4px', boxShadow: 'none' }}
        onClick={handleAddClick}
      >ADD</button>
    );
  };

  return (
    <div
      key={product._id}
      className={`min-w-[180px] max-w-[180px] bg-white border rounded-xl flex-shrink-0 flex flex-col relative group cursor-pointer hover:shadow-lg transition ${
        !canAdd && !isInCart ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
      }`}
      style={{ fontFamily: 'Sinkin Sans, sans-serif', boxShadow: 'none' }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={product.name}
    >
      {/* Warehouse Conflict Warning */}
      {!canAdd && !isInCart && (
        <div className="absolute top-2 left-2 z-10 bg-orange-100 border border-orange-200 rounded-md px-2 py-1">
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span className="text-xs text-orange-700 font-medium">Different Store</span>
          </div>
        </div>
      )}

      {/* Discount Badge */}
      {showDiscountBadge && (
        <div className="absolute left-3 top-0 z-10 flex items-center justify-center" style={{ width: '29px', height: '28px' }}>
          <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
          </svg>
          <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[9px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
            {discountPercent}%<br />OFF
          </div>
        </div>
      )}

      {/* Wishlist Button */}
      <button
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow hover:bg-gray-100"
        onClick={e => {
          e.stopPropagation();
          handleWishlistClick && handleWishlistClick(product, e);
        }}
        aria-label={isInWishlist && isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-5 h-5 transition-colors duration-200 ${isInWishlist && isInWishlist(product._id) ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-none'}`} />
      </button>

      {/* Product Image */}
      <div className="flex justify-center items-center h-32 pt-2">
        <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-[120px] h-[120px] object-contain" />
      </div>

      <div className="px-3 py-2 flex-1 flex flex-col">
        {/* Warehouse Information */}
        {showWarehouseInfo && warehouseName && (
          <div className="text-[9px] text-gray-400 flex items-center gap-1 mb-1" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
            {isGlobal ? (
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
            {!canAdd && !isInCart && (
              <div className="ml-1 flex items-center gap-1">
                <span>•</span>
                <AlertTriangle className="w-2.5 h-2.5 text-orange-500" />
                <span className="text-orange-600">Conflict</span>
              </div>
            )}
          </div>
        )}

        {/* Product Name */}
        <div className="text-[12px] font-bold text-gray-900 line-clamp-2 mb-4 leading-snug" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
          {product.name}
        </div>

        {/* Variant/Weight/Unit */}
        <div className="text-xs text-gray-500 mb-2 font-normal" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
          {product.unit}
        </div>

        {/* Bottom Section: Price, MRP, ADD button */}
        <div className="flex items-end justify-between mt-2">
          <div>
            <div className="text-[15px] font-bold text-gray-900 leading-none mb-1" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{product.price}</div>
            {hasDiscount && (
              <div className="text-xs text-gray-400 line-through leading-none font-normal" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{product.mrp}</div>
            )}
          </div>
          {renderAddButton()}
        </div>

        {/* Warehouse Conflict Info */}
        {!canAdd && !isInCart && conflictInfo.hasConflict && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
            <div className="flex items-start gap-1">
              <Info className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-orange-700">
                <p className="font-medium">Cannot add to cart</p>
                <p className="text-orange-600 mt-1">
                  Your cart has items from "{conflictInfo.existingWarehouse}". Clear cart or choose products from the same store.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedProductCard;