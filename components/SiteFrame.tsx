"use client";
import { useEffect, useState } from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { usePathname } from "next/navigation";
import NoticeRibbon from "@/components/NoticeRibbon";
import WarehouseNoticeBanner from "@/components/warehouse-notice-banner";
import LoginModal from "@/components/login-modal";
import { useAppContext } from "@/components/app-provider";

import { DeliveryOverlay } from "@/components/delivery-overlay";
import { useLocation } from "@/components/location-provider";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHomePage = pathname === "/";
  const { isLoginOpen, setIsLoginOpen } = useAppContext();
  const { showOverlay, setShowOverlay } = useLocation();
  const [showDeliveryOverlay, setShowDeliveryOverlay] = useState(false);


  // Handle delivery overlay
  useEffect(() => {
    setShowDeliveryOverlay(showOverlay);
  }, [showOverlay]);

  return (
    <>
      {!isAdmin && <NoticeRibbon />}
      {!isAdmin && <WarehouseNoticeBanner />}

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
    </>
  );
} 