"use client";
import { useEffect } from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { usePathname } from "next/navigation";
import NoticeRibbon from "@/components/NoticeRibbon";
import LoginModal from "@/components/login-modal";
import { useAppContext } from "@/components/app-provider";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHomePage = pathname === "/";
  const { isLoginOpen, setIsLoginOpen } = useAppContext();

  // Automatically open login modal on home page if not logged in
  useEffect(() => {
    const hasSeenLoginPrompt = localStorage.getItem('hasSeenLoginPrompt');
    if (isHomePage && !hasSeenLoginPrompt) {
      setIsLoginOpen(true);
      localStorage.setItem('hasSeenLoginPrompt', 'true');
    }
  }, [isHomePage, setIsLoginOpen]);

  return (
    <>
      {!isAdmin && <NoticeRibbon />}
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer />}
      {!isAdmin && <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />}
    </>
  );
} 