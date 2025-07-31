"use client"

import { useAppContext } from "@/components/app-provider";
import HeroSection from "@/components/hero-section"
import CategorySection from "@/components/category-section"
import ProductSection from "@/components/product-section"
import CartDrawer from "@/components/cart-drawer"
import LocationStatusIndicator from "@/components/location-status-indicator"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const {
    isCartOpen,
    setIsCartOpen,
    isLoginOpen,
    setIsLoginOpen,
    searchQuery,
    addToCart,
  } = useAppContext();
  const { toast } = useToast();

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setIsCartOpen(true);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      <main>
        <HeroSection />
        <div className="max-w-7xl mx-auto px-4">
          <LocationStatusIndicator />
        </div>
        <CategorySection />
        <ProductSection onAddToCart={handleAddToCart} searchQuery={searchQuery} />
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  )
}
