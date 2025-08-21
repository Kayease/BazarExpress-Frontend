import { memo } from 'react';
import ProductCard from '@/components/product-card';
import { Product, ViewMode } from '../types';

interface ProductGridProps {
  products: Product[];
  viewMode: ViewMode;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onUpdateCart: (id: string, quantity: number, variantId?: string) => void;
  onAddToWishlist: (product: Product) => void;
  isInWishlist: (product: Product) => boolean;
  cartItems: any[]; // TODO: Type this properly
}

function ProductGrid({
  products,
  viewMode,
  onProductClick,
  onAddToCart,
  onUpdateCart,
  onAddToWishlist,
  isInWishlist,
  cartItems
}: ProductGridProps) {
  // Get quantities from cart items
  const quantities = cartItems.reduce((acc, item) => {
    const key = item.variantId ? `${item.id}:${item.variantId}` : item.id;
    acc[key] = item.quantity;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={viewMode === 'grid'
      ? 'grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8'
      : 'space-y-3'
    }>
      {products.map((product) => {
        const variantId = product.variantId;
        const cartKey = variantId ? `${product._id}:${variantId}` : product._id;
        const quantity = quantities[cartKey] || 0;

        return (
          <ProductCard
            key={`${product._id}-${variantId || 'default'}`}
            product={product}
            isInWishlist={isInWishlist(product)}
            handleWishlistClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product);
            }}
            handleAddToCart={() => onAddToCart(product)}
            handleInc={() => onUpdateCart(product._id, quantity + 1, variantId)}
            handleDec={() => onUpdateCart(product._id, Math.max(0, quantity - 1), variantId)}
            quantity={quantity}
            viewMode={viewMode}
            onClick={() => onProductClick(product)}
          />
        );
      })}
    </div>
  );
}

export default memo(ProductGrid);