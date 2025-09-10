"use client";
import { useEffect, useState } from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { usePathname } from "next/navigation";
import NoticeRibbon from "@/components/NoticeRibbon";
import LoginModal from "@/components/login-modal";
import GuestInfoModal from "@/components/GuestInfoModal";
import { useAppContext } from "@/components/app-provider";
import { useWarehouseConflict } from "@/hooks/use-warehouse-conflict";
import WarehouseConflictModal from "@/components/warehouse-conflict-modal";
import { useGuestInfo } from "@/hooks/use-guest-info";
import { DeliveryOverlay } from "@/components/delivery-overlay";
import { useLocation } from "@/components/location-provider";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHomePage = pathname === "/";
  const { isLoginOpen, setIsLoginOpen } = useAppContext();
  const { showOverlay, setShowOverlay, locationState } = useLocation();
  const [showDeliveryOverlay, setShowDeliveryOverlay] = useState(false);
  
  // Guest info modal
  const {
    guestInfo,
    shouldShowModal,
    saveGuestInfo,
    markModalAsShown,
    hasGuestInfo,
    isReady,
    hasShownModal,
    user
  } = useGuestInfo();
  
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [timerSet, setTimerSet] = useState(false);
  
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

  // Show guest modal only after pincode/location has been detected
  useEffect(() => {
    // Guard until location/pincode is detected
    if (!locationState?.isLocationDetected) return;

    // Only show modal if all conditions are met and it hasn't been shown yet
    if (shouldShowModal() && !isAdmin && !timerSet) {
      setTimerSet(true);
      setShowGuestModal(true);
      markModalAsShown();
    }
  }, [locationState?.isLocationDetected, shouldShowModal, isAdmin, timerSet, markModalAsShown]);

  const handleGuestInfoSubmit = (info: any) => {
    saveGuestInfo(info);
    setShowGuestModal(false);
    
    // You can also trigger other actions here like:
    // - Update location if pincode provided
    // - Send welcome message
    // - Initialize abandoned cart tracking
  };

  return (
    <>
      {!isAdmin && <NoticeRibbon />}

      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer />}
      
      {/* Modals */}
      {!isAdmin && <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />}
      
      {!isAdmin && (
        <GuestInfoModal
          isOpen={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          onInfoSubmit={handleGuestInfoSubmit}
        />
      )}
      

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