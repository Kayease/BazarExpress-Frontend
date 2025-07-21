"use client"

import { useAppContext } from "@/components/app-provider";
import HeroSection from "@/components/hero-section"
import CategorySection from "@/components/category-section"
import ProductSection from "@/components/product-section"
import CartDrawer from "@/components/cart-drawer"
import LoginModal from "@/components/login-modal"
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
        <CategorySection />
        <ProductSection onAddToCart={handleAddToCart} searchQuery={searchQuery} />
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  )
}
