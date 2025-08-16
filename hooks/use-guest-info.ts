"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/lib/store';

export interface GuestInfo {
  phone: string;
  submittedAt: string;
}

export function useGuestInfo() {
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  // Load guest info from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('guest_info');
        if (stored) {
          const parsed = JSON.parse(stored);
          setGuestInfo(parsed);
        }

        // Check if modal has been shown before
        const modalShown = localStorage.getItem('guest_modal_shown');
        setHasShownModal(!!modalShown);
        
        setIsReady(true);
      } catch (error) {
        console.error('Error loading guest info:', error);
        localStorage.removeItem('guest_info');
        localStorage.removeItem('guest_modal_shown');
        setIsReady(true);
      }
    }
  }, []);

  // Save guest info
  const saveGuestInfo = useCallback((info: Omit<GuestInfo, 'submittedAt'>) => {
    const guestInfoWithTimestamp: GuestInfo = {
      ...info,
      submittedAt: new Date().toISOString()
    };

    localStorage.setItem('guest_info', JSON.stringify(guestInfoWithTimestamp));
    setGuestInfo(guestInfoWithTimestamp);
  }, []);

  // Mark modal as shown
  const markModalAsShown = useCallback(() => {
    localStorage.setItem('guest_modal_shown', 'true');
    setHasShownModal(true);
  }, []);

  // Clear guest info
  const clearGuestInfo = useCallback(() => {
    localStorage.removeItem('guest_info');
    setGuestInfo(null);
  }, []);

  // Check if should show modal
  const shouldShowModal = useCallback(() => {
    // Show modal when ready, user is not logged in, modal hasn't been shown, and no guest info is present
    const allow = isReady && !user && !hasShownModal && !guestInfo;
    console.log('shouldShowModal calculation:', {
      isReady,
      user: !!user,
      hasShownModal,
      guestInfo: !!guestInfo,
      allow
    });
    return allow;
  }, [isReady, user, hasShownModal, guestInfo]);

  // Manually trigger modal (useful for testing or specific scenarios)
  const triggerModal = useCallback(() => {
    if (isReady && !user && !guestInfo) {
      setHasShownModal(false);
      return true;
    }
    return false;
  }, [isReady, user, guestInfo]);

  // Check if guest info exists
  const hasGuestInfo = useCallback(() => {
    return !!guestInfo;
  }, [guestInfo]);

  return {
    guestInfo,
    hasShownModal,
    shouldShowModal,
    saveGuestInfo,
    markModalAsShown,
    clearGuestInfo,
    triggerModal,
    hasGuestInfo,
    isReady,
    user
  };
}
