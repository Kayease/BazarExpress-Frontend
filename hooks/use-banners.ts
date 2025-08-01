"use client";

import { useQuery } from '@tanstack/react-query';
import { monitoredCacheService as cacheService } from '@/components/performance-monitor';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Banner {
  _id: string;
  image: string;
  name: string;
  active: boolean;
  categoryId?: {
    _id: string;
    name: string;
  };
  bannerType?: string;
}

interface SpecialBanners {
  banner1: Banner | null;
  banner2: Banner | null;
  banner3: Banner | null;
}

interface BannersData {
  regularBanners: Banner[];
  specialBanners: SpecialBanners;
}

// Fetch function for regular banners
async function fetchBanners(pincode?: string, isGlobalMode?: boolean): Promise<Banner[]> {
  let bannerUrl = `${API_URL}/banners`;
  
  if (pincode) {
    const params = new URLSearchParams();
    params.append('pincode', pincode);
    if (isGlobalMode) {
      params.append('mode', 'global');
    }
    bannerUrl += `?${params.toString()}`;
  }

  const response = await fetch(bannerUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch banners');
  }

  const data = await response.json();
  return data.filter((banner: Banner) => 
    banner.active && (!banner.bannerType || banner.bannerType === 'regular')
  );
}

// Fetch function for special banners
async function fetchSpecialBanners(pincode?: string, isGlobalMode?: boolean): Promise<SpecialBanners> {
  let specialBannerUrl = `${API_URL}/banners/special`;
  
  if (pincode) {
    const params = new URLSearchParams();
    params.append('pincode', pincode);
    if (isGlobalMode) {
      params.append('mode', 'global');
    }
    specialBannerUrl += `?${params.toString()}`;
  }

  const response = await fetch(specialBannerUrl);
  if (!response.ok) {
    return { banner1: null, banner2: null, banner3: null };
  }

  return await response.json();
}

// Combined fetch function
async function fetchAllBanners(pincode?: string, isGlobalMode?: boolean): Promise<BannersData> {
  const cacheKey = cacheService.generateLocationKey('banners', pincode, isGlobalMode);
  
  // Try cache first
  const cached = cacheService.get<BannersData>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch both regular and special banners in parallel
  const [regularBanners, specialBanners] = await Promise.all([
    fetchBanners(pincode, isGlobalMode),
    fetchSpecialBanners(pincode, isGlobalMode)
  ]);

  const result: BannersData = {
    regularBanners,
    specialBanners
  };

  // Cache the result for 10 minutes
  cacheService.set(cacheKey, result, 10 * 60 * 1000);
  
  return result;
}

export function useBanners(pincode?: string, isGlobalMode?: boolean) {
  const cacheKey = cacheService.generateLocationKey('banners', pincode, isGlobalMode);
  
  return useQuery({
    queryKey: ['banners', pincode, isGlobalMode],
    queryFn: () => fetchAllBanners(pincode, isGlobalMode),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    // Use cached data as initial data if available
    initialData: () => {
      const cached = cacheService.get<BannersData>(cacheKey);
      return cached || undefined;
    },
    // Only refetch if we don't have cached data
    enabled: true,
  });
}