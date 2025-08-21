"use client"

import { useAppContext } from "@/components/app-provider";
import { useLocation } from "@/components/location-provider";
import { useToast } from "@/hooks/use-toast"
import { MapPin, Loader2 } from "lucide-react"
import { 
  HeroSectionWithSuspense, 
  CategorySectionWithSuspense, 
  ProductSectionWithSuspense, 
  CartDrawerWithSuspense 
} from "@/components/lazy-components";
import DataPreloader from "@/components/data-preloader";
import PerformanceMonitorComponent from "@/components/performance-monitor";
import OrderSuccessModal from "@/components/OrderSuccessModal";
import HomePageSkeleton from "@/components/HomePageSkeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const {
    isCartOpen,
    setIsCartOpen,
    isLoginOpen,
    setIsLoginOpen,
    searchQuery,
    addToCart,
  } = useAppContext();
  const { locationState, isLoading } = useLocation();
  const { toast } = useToast();
  const router = useRouter();
  
  // Order success modal states
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any>(null);

  // Handle order success modal from payment page redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const showOrderSuccess = urlParams.get('showOrderSuccess');
      
      if (showOrderSuccess === 'true') {
        const storedOrderData = localStorage.getItem('orderSuccessData');
        if (storedOrderData) {
          try {
            const orderData = JSON.parse(storedOrderData);
            setOrderSuccessData(orderData);
            setShowOrderSuccessModal(true);
            
            // Clean up
            localStorage.removeItem('orderSuccessData');
            
            // Remove URL parameter
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } catch (error) {
            console.error('Error parsing order success data:', error);
          }
        }
      }
    }
  }, []);

  const handleAddToCart = (product: any) => {
    // Check if product has variants and include the first variant by default
    if (product.variants && Object.keys(product.variants).length > 0) {
      const firstVariantKey = Object.keys(product.variants)[0];
      const firstVariant = product.variants[firstVariantKey];
      
      const productWithVariant = {
        ...product,
        variantId: firstVariantKey,
        variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
        selectedVariant: firstVariant,
        price: (firstVariant.price !== undefined ? firstVariant.price : product.price)
      };
      
      addToCart(productWithVariant);
      setIsCartOpen(true);
      toast({
        title: "Added to Cart",
        description: `${product.name} (${firstVariant.name || firstVariantKey.replace(/::/g, ' ')}) has been added to your cart.`,
      });
    } else {
      addToCart(product);
      setIsCartOpen(true);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  // Show skeleton loading while location is being fetched
  if (isLoading || !locationState.isLocationDetected) {
    return <HomePageSkeleton />;
  }

  return (
    <DataPreloader>
      <PerformanceMonitorComponent />
      <div className="min-h-screen bg-surface-primary">
        <main>
          <HeroSectionWithSuspense />
          <CategorySectionWithSuspense />
          <ProductSectionWithSuspense onAddToCart={handleAddToCart} searchQuery={searchQuery} />
        </main>

        <CartDrawerWithSuspense
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />

        {/* Order Success Modal */}
        {showOrderSuccessModal && orderSuccessData && (
          <OrderSuccessModal
            isOpen={showOrderSuccessModal}
            onClose={() => {
              setShowOrderSuccessModal(false);
              setOrderSuccessData(null);
            }}
            orderData={orderSuccessData}
            onViewOrder={() => {
              setShowOrderSuccessModal(false);
              setOrderSuccessData(null);
              router.push('/account?tab=orders');
            }}
          />
        )}
      </div>
    </DataPreloader>
  )
}
