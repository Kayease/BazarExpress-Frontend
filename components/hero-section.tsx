"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function HeroSection() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [specialBanners, setSpecialBanners] = useState<SpecialBanners>({
    banner1: null,
    banner2: null,
    banner3: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch regular banners
        const res = await fetch(`${API_URL}/banners`);
        if (!res.ok) throw new Error("Failed to fetch banners");
        const data = await res.json();
        
        // Filter active regular banners
        const regularBanners = data.filter((banner: Banner) => 
          banner.active && (!banner.bannerType || banner.bannerType === 'regular')
        );
        setBanners(regularBanners);
        
        // Fetch special banners
        const specialRes = await fetch(`${API_URL}/banners/special`);
        if (specialRes.ok) {
          const specialData = await specialRes.json();
          setSpecialBanners({
            banner1: specialData.banner1 || null,
            banner2: specialData.banner2 || null,
            banner3: specialData.banner3 || null
          });
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
        setError("Failed to load banners");
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [API_URL]);

  const nextBanner = useCallback(() => {
    if (banners.length > 1) {
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    if (banners.length > 1) {
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === 0 ? banners.length - 1 : prevIndex - 1
      );
    }
  }, [banners.length]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      nextBanner();
    }, 5000); // Change banner every 5 seconds
    
    return () => clearInterval(interval);
  }, [banners.length, nextBanner]);

  const handleBannerClick = (banner: Banner) => {
    if (banner.categoryId) {
      // Check if categoryId is an object with _id or a string
      const categoryId = typeof banner.categoryId === 'object' && banner.categoryId._id 
        ? banner.categoryId._id 
        : banner.categoryId;
      
      console.log('Navigating to category:', categoryId);
      router.push(`/search?category=${categoryId}`);
    } else {
      console.log('No category ID found for banner:', banner);
    }
  };

  return (
    <section className="py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Banner Carousel */}
        {loading ? (
          <div className="w-full h-64 bg-gray-200 animate-pulse rounded-xl mb-6"></div>
        ) : error ? (
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-xl mb-6">
            <p className="text-gray-500">{error}</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-xl mb-6">
            <p className="text-gray-500">No banners available</p>
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-100 rounded-xl mb-6 overflow-hidden relative group">
            <div className="w-full h-full relative">
              {banners.map((banner, index) => (
                <div 
                  key={banner._id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <img 
                    src={banner.image} 
                    alt={banner.name} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleBannerClick(banner)}
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation arrows */}
            {banners.length > 1 && (
              <>
                <button 
                  onClick={prevBanner}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button 
                  onClick={nextBanner}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next banner"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </>
            )}
            
            {/* Dots indicator */}
            {banners.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentBannerIndex 
                        ? 'bg-white w-4' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Special Banner Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Banner 1 */}
          {specialBanners.banner1 ? (
            <div 
              className="aspect-[16/9] rounded-xl overflow-hidden cursor-pointer"
              onClick={() => handleBannerClick(specialBanners.banner1!)}
            >
              <img 
                src={specialBanners.banner1.image} 
                alt={specialBanners.banner1.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500 font-medium">No banner available</p>
            </div>
          )}

          {/* Banner 2 */}
          {specialBanners.banner2 ? (
            <div 
              className="aspect-[16/9] rounded-xl overflow-hidden cursor-pointer"
              onClick={() => handleBannerClick(specialBanners.banner2!)}
            >
              <img 
                src={specialBanners.banner2.image} 
                alt={specialBanners.banner2.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500 font-medium">No banner available</p>
            </div>
          )}

          {/* Banner 3 */}
          {specialBanners.banner3 ? (
            <div 
              className="aspect-[16/9] rounded-xl overflow-hidden cursor-pointer"
              onClick={() => handleBannerClick(specialBanners.banner3!)}
            >
              <img 
                src={specialBanners.banner3.image} 
                alt={specialBanners.banner3.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500 font-medium">No banner available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
