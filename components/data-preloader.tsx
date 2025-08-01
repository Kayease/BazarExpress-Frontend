"use client";

import { useEffect } from 'react';
import { useLocation } from '@/components/location-provider';
import { useCacheInvalidation } from '@/lib/cache-invalidation';

interface DataPreloaderProps {
  children: React.ReactNode;
}

export default function DataPreloader({ children }: DataPreloaderProps) {
  const { locationState } = useLocation();
  const { preloadData } = useCacheInvalidation();

  useEffect(() => {
    // Preload data when location is detected
    if (locationState.isLocationDetected && locationState.pincode) {
      const timer = setTimeout(() => {
        preloadData(locationState.pincode, locationState.isGlobalMode);
      }, 100); // Small delay to avoid blocking initial render

      return () => clearTimeout(timer);
    }
  }, [locationState.isLocationDetected, locationState.pincode, locationState.isGlobalMode, preloadData]);

  // Preload on mouse enter for better UX
  useEffect(() => {
    const handleMouseEnter = () => {
      if (locationState.pincode) {
        preloadData(locationState.pincode, locationState.isGlobalMode);
      }
    };

    // Add event listener to home link or logo
    const homeLinks = document.querySelectorAll('a[href="/"], a[href=""]');
    homeLinks.forEach(link => {
      link.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      homeLinks.forEach(link => {
        link.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, [locationState.pincode, locationState.isGlobalMode, preloadData]);

  return <>{children}</>;
}