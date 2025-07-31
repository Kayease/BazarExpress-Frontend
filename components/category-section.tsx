"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/components/location-provider";

interface Category {
  _id: string;
  name: string;
  thumbnail?: string;
  showOnHome: boolean;
  hide: boolean;
  sortOrder: number;
  parentId?: string;
}

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Get location context for pincode-based filtering
  const { locationState } = useLocation();

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");

      const data = await res.json();
      const visible = data
        .filter((cat: Category) => {
          // Only show categories that are not hidden and are parent categories
          return !cat.hide && (!cat.parentId || cat.parentId === "");
        })
        .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);

      setCategories(visible);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pt-2 pb-6 sm:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-3 sm:hidden">Shop by Category</h2>
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-[150px] h-[150px] bg-gray-200 animate-pulse rounded" />
                <div className="w-20 h-4 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center mt-4">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No categories available to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => {
                  // Build URL with location context for pincode-based filtering
                  let url = `/search?category=${category._id}`;
                  
                  // Add pincode parameter if location is detected
                  if (locationState.isLocationDetected && locationState.pincode) {
                    url += `&pincode=${locationState.pincode}`;
                  }
                  
                  // Add delivery mode for proper warehouse filtering
                  if (locationState.isGlobalMode) {
                    url += `&mode=global`;
                  }
                  
                  router.push(url);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-[150px] h-[150px] overflow-hidden">
                  {category.thumbnail ? (
                    <img
                      src={category.thumbnail}
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                      No image
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
