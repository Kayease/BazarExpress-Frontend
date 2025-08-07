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
    addToCart(product);
    setIsCartOpen(true);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <DataPreloader>
      <PerformanceMonitorComponent />
      <div className="min-h-screen bg-surface-primary">
        <main>
          <HeroSectionWithSuspense />
          <div className="max-w-7xl mx-auto px-4">
            {/* Show location detection loading state */}
            {isLoading && !locationState.isLocationDetected && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Detecting your location...</p>
                    <p className="text-xs text-blue-700">Finding products available in your area for faster delivery</p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
