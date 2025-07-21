"use client";

import { Plus, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: { user: string; rating: number; comment: string; date: string }[];
  discount?: number;
  category: { name: string; slug: string };
  description: string;
  unit: string;
  brand: { name: string };
  warehouse: { name: string };
  tax: { name: string; rate: number };
  stock: number;
  status: string;
  sku: string;
  hsn: string;
  costPrice: number;
  priceIncludesTax: boolean;
  allowBackorders: boolean;
  lowStockThreshold: number;
  weight: number;
  dimensions: { l: string; w: string; h: string };
  shippingClass: string;
  returnable: boolean;
  returnWindow: number;
  codAvailable: boolean;
  mainImage: string;
  galleryImages: string[];
  video: string;
  model3d: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  legal_hsn: string;
  batchNumber: string;
  manufacturer: string;
  warranty: string;
  certifications: string;
  safetyInfo: string;
  mrp: number;
  variants: any;
  attributes: any[];
}

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  category?: string;
}

export default function ProductGrid({
  onAddToCart,
  searchQuery,
  category,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = !category || category === "all";
    if (!matchesCategory && category) {
      if (product.category.slug === category) matchesCategory = true;
      // Only check _id if it exists
      if (
        typeof (product.category as any)._id === "string" &&
        (product.category as any)._id === category
      )
        matchesCategory = true;
    }
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <div
          key={product._id}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-200 relative"
        >
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer">
                <div className="relative">
                  <img
                    src={product.mainImage || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {product.discount && (
                    <>
                      <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        {product.discount}% OFF
                      </span>
                      <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Plus size={18} className="text-gray-700" />
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-gray-900 font-semibold text-lg mb-1 line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {product.rating} ({product.reviews.length})
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-green-600">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-full bg-brand-accent text-inverse py-2 rounded-lg hover:bg-brand-primary transition duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus size={18} />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 bg-white p-5 rounded-xl shadow-lg border border-gray-200">
              <div className="flex flex-col space-y-3">
                <h4 className="text-lg font-bold text-gray-900">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {product.description || "No description available."}
                </p>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">Category:</span>{" "}
                    {product.category?.name || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Unit:</span>{" "}
                    {product.unit || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Stock:</span>{" "}
                    {product.stock}
                  </div>
                  {product.brand && (
                    <div>
                      <span className="font-semibold">Brand:</span>{" "}
                      {product.brand.name}
                    </div>
                  )}
                  {product.warehouse && (
                    <div>
                      <span className="font-semibold">Warehouse:</span>{" "}
                      {product.warehouse.name}
                    </div>
                  )}
                  {product.tax && (
                    <div>
                      <span className="font-semibold">Tax:</span>{" "}
                      {product.tax.name} ({product.tax.rate}%)
                    </div>
                  )}
                  {product.sku && (
                    <div>
                      <span className="font-semibold">SKU:</span> {product.sku}
                    </div>
                  )}
                  {product.hsn && (
                    <div className="flex items-center pt-2">
                      <span className="text-sm text-text-tertiary">
                        HSN: {product.hsn}
                      </span>
                    </div>
                  )}
                  {product.manufacturer && (
                    <div className="flex items-center pt-2">
                      <span className="text-sm text-text-tertiary">
                        Manufacturer: {product.manufacturer}
                      </span>
                    </div>
                  )}
                  {product.warranty && (
                    <div className="flex items-center pt-2">
                      <span className="text-sm text-text-tertiary">
                        Warranty: {product.warranty}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      ))}
    </div>
  );
}
