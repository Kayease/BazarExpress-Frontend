"use client";
import { useState, useCallback } from "react";
import { useCartContext } from "@/components/app-provider";
import { useLocation } from "@/components/location-provider";
import { getWarehouseConflictInfo } from "@/lib/warehouse-validation";
import toast from "react-hot-toast";

export function useWarehouseConflict() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictProduct, setConflictProduct] = useState<any>(null);
  const { cartItems, clearCart } = useCartContext();
  const { switchToGlobalMode } = useLocation();

  const showConflictModal = useCallback((product: any) => {
    const conflictInfo = getWarehouseConflictInfo(product, cartItems);
    if (conflictInfo.hasConflict) {
      setConflictProduct(product);
      setIsModalOpen(true);
      return true;
    }
    return false;
  }, [cartItems]);

  const handleClearCart = useCallback(() => {
    clearCart();
    setIsModalOpen(false);
    toast.success("Cart cleared! You can now add products from any warehouse.");
  }, [clearCart]);

  const handleSwitchToGlobal = useCallback(() => {
    switchToGlobalMode();
    setIsModalOpen(false);
    toast.success("Switched to Global Store! You can now access all products.");
  }, [switchToGlobalMode]);

  const handleContinueShopping = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setConflictProduct(null);
  }, []);

  const getCurrentWarehouse = useCallback(() => {
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      return firstItem.warehouse?.name || "Local Store";
    }
    return "Local Store";
  }, [cartItems]);

  return {
    isModalOpen,
    conflictProduct,
    showConflictModal,
    handleClearCart,
    handleSwitchToGlobal,
    handleContinueShopping,
    closeModal,
    getCurrentWarehouse
  };
}