"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductGrid from "@/components/product-grid";

export default function ProductsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `/api/products`;
    const query: string[] = [];
    if (category) query.push(`category=${encodeURIComponent(category)}`);
    if (search) query.push(`search=${encodeURIComponent(search)}`);
    if (query.length > 0) url += `?${query.join("&")}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shop Products</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="border rounded px-4 py-2 w-full max-w-md"
          value={search}
          onChange={e => {
            const val = e.target.value;
            const params = new URLSearchParams(window.location.search);
            if (val) {
              params.set('search', val);
            } else {
              params.delete('search');
            }
            router.push(`/products?${params.toString()}`);
          }}
        />
      </div>
      {loading ? (
        <div>Loading products...</div>
      ) : (
        <ProductGrid
          onAddToCart={() => {}}
          searchQuery={search}
          category={category}
        />
      )}
    </div>
  );
} 