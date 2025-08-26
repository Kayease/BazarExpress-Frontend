import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ProductCategory {
  _id?: string;
  name: string;
}

interface RelatedProductsProps {
  relatedProducts: any[];
  product: any;
  router: any;
  isInWishlist: (id: string, variantId?: string) => boolean;
  addToWishlist: (product: any) => void;
  addToCart: (product: any) => void;
}

const RelatedProducts = memo(({ 
  relatedProducts, 
  product, 
  router, 
  isInWishlist, 
  addToWishlist, 
  addToCart 
}: RelatedProductsProps) => {
  if (relatedProducts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-200/60 p-6 sm:p-8 mb-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 rounded-full">
            <TrendingUp className="h-8 w-8 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Explore More Products
            </h3>
            <p className="text-gray-600 mb-4">
              Discover more products in this category
            </p>
            <Button
              variant="outline"
              size="sm"
              className="group hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg border-2 font-medium px-6 py-2"
              onClick={() => {
                const categoryId = typeof product.category === "object" && product.category !== null && "_id" in product.category ? (product.category as ProductCategory)._id : product.category;
                router.push(`/products?category=${categoryId}`);
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Browse Category
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-200/60 p-6 sm:p-8 mb-8 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-brand-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-brand-primary/3 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 rounded-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              You might also like
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Discover more products in this category
            </p>
          </div>
        </div>
        {product?.category && (
          <Button
            variant="outline"
            size="sm"
            className="group hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg border-2 font-medium px-4 py-2"
            onClick={() => {
              const categoryId = typeof product.category === "object" && product.category !== null && "_id" in product.category ? (product.category as ProductCategory)._id : product.category;
              router.push(`/products?category=${categoryId}`);
            }}
          >
            <span className="flex items-center justify-center gap-2">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
            </span>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 relative z-10">
        {relatedProducts.slice(0, 6).map((relProd) => {
          // Enhance product with variant information if it has variants
          const enhancedProduct = (() => {
            if (relProd.variants && Object.keys(relProd.variants).length > 0) {
              const firstVariantKey = Object.keys(relProd.variants)[0];
              const firstVariant = relProd.variants[firstVariantKey];
              return {
                ...relProd,
                variantId: firstVariantKey,
                variantName: firstVariant.name || firstVariantKey.replace(/::/g, ' '),
                selectedVariant: firstVariant,
                price: (firstVariant.price !== undefined ? firstVariant.price : relProd.price),
                unit: (firstVariant as any).unit || relProd.unit || '1 Unit'
              };
            }
            return {
              ...relProd,
              unit: relProd.unit || '1 Unit'
            };
          })();

          return (
            <ProductCard
              key={relProd._id}
              product={enhancedProduct}
              isInWishlist={isInWishlist}
              handleWishlistClick={(product, e) => {
                e.stopPropagation();
                addToWishlist({
                  id: product._id,
                  name: product.name,
                  price: product.price,
                  mrp: product.mrp,
                  image: product.image,
                  category: typeof product.category === "object" ? product.category?.name : product.category,
                  brand: typeof product.brand === "object" ? product.brand?.name : product.brand,
                  sku: product.sku,
                  stock: product.stock,
                  warehouse: product.warehouse,
                  variantId: product.variantId,
                  variantName: product.variantName,
                  selectedVariant: product.selectedVariant,
                });
              }}
              handleAddToCart={async (product) => {
                try {
                  await addToCart({
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    mrp: product.mrp,
                    image: product.image,
                    category: typeof product.category === "object" ? product.category?.name : product.category,
                    brand: typeof product.brand === "object" ? product.brand?.name : product.brand,
                    sku: product.sku,
                    quantity: 1,
                    stock: product.stock,
                    warehouse: product.warehouse,
                    variantId: product.variantId,
                    variantName: product.variantName,
                    selectedVariant: product.selectedVariant,
                  });
                } catch (error: any) {
                  if (error.isVariantRequired) {
                    toast.error(`Please select a variant for ${product.name} before adding to cart`);
                  } else if (error.isWarehouseConflict) {
                    toast.error(error.message);
                  } else {
                    toast.error('Failed to add item to cart');
                  }
                }
              }}
              quantity={0}
              locationState={null}
              isGlobalMode={true}
              viewMode="grid"
              onClick={() => router.push(`/products/${relProd._id}`)}
            />
          );
        })}
      </div>
    </div>
  );
});

RelatedProducts.displayName = 'RelatedProducts';

export default RelatedProducts;
