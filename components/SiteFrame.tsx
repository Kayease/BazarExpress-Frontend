"use client";
import { useEffect, useState } from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { usePathname } from "next/navigation";
import NoticeRibbon from "@/components/NoticeRibbon";
import LoginModal from "@/components/login-modal";
import { useAppContext } from "@/components/app-provider";
import { useWarehouseConflict } from "@/hooks/use-warehouse-conflict";
import WarehouseConflictModal from "@/components/warehouse-conflict-modal";

import { DeliveryOverlay } from "@/components/delivery-overlay";
import { useLocation } from "@/components/location-provider";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHomePage = pathname === "/";
  const { isLoginOpen, setIsLoginOpen } = useAppContext();
  const { showOverlay, setShowOverlay } = useLocation();
  const [showDeliveryOverlay, setShowDeliveryOverlay] = useState(false);
  
  // Global warehouse conflict handling
  const {
    isModalOpen,
    locationConflict,
    handleClearCart,
    handleSwitchToGlobal,
    handleContinueShopping,
    closeModal,
    getCurrentWarehouse,
    getConflictingProductName
  } = useWarehouseConflict();


  // Handle delivery overlay
  useEffect(() => {
    setShowDeliveryOverlay(showOverlay);
  }, [showOverlay]);

  return (
    <>
      {!isAdmin && <NoticeRibbon />}

      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer />}
      {!isAdmin && <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />}
      {!isAdmin && (
        <DeliveryOverlay
          isOpen={showDeliveryOverlay}
          onClose={() => setShowDeliveryOverlay(false)}
        />
      )}
      
      {/* Global Warehouse Conflict Modal */}
      {!isAdmin && (
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
      )}
    </>
  );
} 