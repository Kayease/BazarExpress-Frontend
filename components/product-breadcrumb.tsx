"use client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface Category {
  _id?: string;
  name: string;
  parentId?: string;
}

interface ProductCategory {
  _id?: string;
  name: string;
  parentId?: string;
}

interface ProductBreadcrumbProps {
  product: {
    name: string;
    category?: ProductCategory | string;
  };
  categories?: ProductCategory[];
}

export function ProductBreadcrumb({ product, categories = [] }: ProductBreadcrumbProps) {
  const router = useRouter();

  // Get category information
  const categoryInfo = typeof product.category === "object" && product.category 
    ? product.category 
    : null;
  
  const categoryName = categoryInfo?.name || 
    (typeof product.category === "string" ? product.category : "Uncategorized");

  // Find parent category if exists
  const parentCategory = categoryInfo?.parentId 
    ? categories.find(cat => cat._id === categoryInfo.parentId)
    : null;

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center text-sm text-gray-600 gap-2">
          <button
            onClick={() => router.push("/")}
            className="hover:text-purple-600 transition-colors"
          >
            Home
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          
          <button
            onClick={() => router.push("/products")}
            className="hover:text-purple-600 transition-colors"
          >
            All Categories
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          
          {/* Parent Category (if exists) */}
          {parentCategory && parentCategory._id && (
            <>
              <button
                onClick={() => router.push(`/products?category=${parentCategory._id}`)}
                className="hover:text-green-600 transition-colors"
              >
                {parentCategory.name}
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </>
          )}
          
          {/* Current Category */}
          {categoryInfo && categoryInfo._id && (
            <>
              <button
                onClick={() => router.push(`/products?category=${categoryInfo._id}`)}
                className="hover:text-purple-600 transition-colors"
              >
                {categoryName}
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </>
          )}
          
          {/* Product Name */}
          <span className="text-gray-900 font-medium truncate">
            {product.name}
          </span>
        </nav>
      </div>
    </div>
  );
}