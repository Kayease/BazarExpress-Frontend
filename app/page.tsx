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
    // If product has variants and none is selected, redirect to product page to select variant
    if (product.variants && Object.keys(product.variants).length > 0 && !product.variantId) {
      router.push(`/products/${product._id}`);
      return;
    }

    // No variants or variant already selected
    addToCart(product.variantId ? { ...product, id: product._id ?? product.id, quantity: product.quantity ?? 1 } : product);
    setIsCartOpen(true);
    toast({
      title: "Added to Cart",
      description: product.variantName ? `${product.name} (${product.variantName}) has been added to your cart.` : `${product.name} has been added to your cart.`,
    });
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
