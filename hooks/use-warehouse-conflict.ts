"use client";
import { useState, useCallback, useEffect } from "react";
import { useCartContext } from "@/components/app-provider";
import { useLocation } from "@/components/location-provider";
import { getWarehouseConflictInfo, findCustomWarehouseInCart, isGlobalWarehouse } from "@/lib/warehouse-validation";
import toast from "react-hot-toast";

export function useWarehouseConflict() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictProduct, setConflictProduct] = useState<any>(null);
  const [locationConflict, setLocationConflict] = useState<{
    newWarehouse: any;
    existingWarehouse: any;
  } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { cartItems, clearCart, isLoadingCart } = useCartContext();
  const { locationState, switchToGlobalMode, revertToPreviousLocation } = useLocation();

  // Set initialization flag after a delay to prevent early conflicts
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitialized(true);
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, []);

  // Check for location-based conflicts when location changes
  useEffect(() => {
    // Don't check for conflicts until initialization is complete
      if (!hasInitialized) {
        return;
      }    // Don't check for conflicts if cart is still loading or empty
    if (isLoadingCart || cartItems.length === 0) {
      console.log('Skipping warehouse conflict check - cart loading or empty');
      return;
    }

    // Don't check for conflicts if cart items don't have proper warehouse information
    const hasValidWarehouseInfo = cartItems.some(item => 
      item.warehouse && 
      item.warehouse._id && 
      item.warehouse.name
    );
    
    if (!hasValidWarehouseInfo) {
      console.log('Skipping warehouse conflict check - cart items lack valid warehouse info');
      return;
    }

    // Additional check: Ensure we have at least one cart item with valid warehouse info
    const cartItemsWithWarehouse = cartItems.filter(item => 
      item.warehouse && 
      item.warehouse._id && 
      item.warehouse.name
    );
    
    if (cartItemsWithWarehouse.length === 0) {
      console.log('Skipping warehouse conflict check - no cart items with valid warehouse info');
      return;
    }

    if (locationState.matchedWarehouse && !locationState.isGlobalMode) {
      const existingCustomWarehouse = findCustomWarehouseInCart(cartItems);
      
      // Debug: Log cart items structure
      console.log('Warehouse conflict check:', {
        cartItemsCount: cartItems.length,
        cartItemsWithWarehouseCount: cartItemsWithWarehouse.length,
        isLoadingCart,
        hasInitialized,
        locationState: {
          matchedWarehouse: locationState.matchedWarehouse?.name,
          isGlobalMode: locationState.isGlobalMode
        },
        cartItems: cartItems.map(item => ({
          id: item.id || item._id,
          name: item.name,
          warehouse: item.warehouse ? {
            _id: item.warehouse._id,
            name: item.warehouse.name,
            isGlobal: isGlobalWarehouse(item.warehouse)
          } : null
        })),
        existingCustomWarehouse: existingCustomWarehouse ? {
          _id: existingCustomWarehouse._id,
          name: existingCustomWarehouse.name
        } : null
      });
      
      // Always show conflict modal when changing locations with items in cart
      if (cartItems.length > 0) {
        const currentWarehouse = existingCustomWarehouse || (cartItems[0].warehouse?.name ? cartItems[0].warehouse : null);
        
        // Only show conflict if changing to a different warehouse
        if (currentWarehouse && currentWarehouse._id !== locationState.matchedWarehouse._id) {
          setLocationConflict({
            newWarehouse: locationState.matchedWarehouse,
            existingWarehouse: currentWarehouse
          });
          setIsModalOpen(true);
        }
      }
    }
  }, [locationState.matchedWarehouse, locationState.isGlobalMode, cartItems, isLoadingCart, hasInitialized]);

  const showConflictModal = useCallback((product: any) => {
    const conflictInfo = getWarehouseConflictInfo(product, cartItems);
    if (conflictInfo.hasConflict) {
      setConflictProduct(product);
      setLocationConflict(null);
      setIsModalOpen(true);
      return true;
    }
    return false;
  }, [cartItems]);

  const handleClearCart = useCallback(() => {
    clearCart();
    setIsModalOpen(false);
    setLocationConflict(null);
    toast.success("Cart cleared! You can now add products from any warehouse.");
  }, [clearCart]);

  const handleSwitchToGlobal = useCallback(() => {
    switchToGlobalMode();
    setIsModalOpen(false);
    setLocationConflict(null);
    toast.success("Switched to Global Store! You can now access all products.");
  }, [switchToGlobalMode]);

  const handleContinueShopping = useCallback(() => {
    if (locationConflict) {
      // Revert to previous location if this is a location conflict
      revertToPreviousLocation();
    }
    setIsModalOpen(false);
    setLocationConflict(null);
  }, [locationConflict, revertToPreviousLocation]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setConflictProduct(null);
    setLocationConflict(null);
  }, []);

  const getCurrentWarehouse = useCallback(() => {
    if (locationConflict) {
      return locationConflict.existingWarehouse.name;
    }
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      return firstItem.warehouse?.name || "Local Store";
    }
    return "Local Store";
  }, [cartItems, locationConflict]);

  const getConflictingProductName = useCallback(() => {
    if (locationConflict) {
      return `Location changed to ${locationConflict.newWarehouse.name}`;
    }
    return conflictProduct?.name || "";
  }, [conflictProduct, locationConflict]);

  return {
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
  };
}