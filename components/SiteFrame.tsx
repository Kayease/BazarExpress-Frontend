"use client";
import { useEffect, useState } from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { usePathname } from "next/navigation";
import NoticeRibbon from "@/components/NoticeRibbon";
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

  // Automatically open login modal on home page if not logged in
  useEffect(() => {
    const hasSeenLoginPrompt = localStorage.getItem('hasSeenLoginPrompt');
    if (isHomePage && !hasSeenLoginPrompt) {
      setIsLoginOpen(true);
      localStorage.setItem('hasSeenLoginPrompt', 'true');
    }
  }, [isHomePage, setIsLoginOpen]);

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
    </>
  );
} 