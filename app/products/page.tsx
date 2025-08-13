"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocationBasedProducts } from "@/components/LocationBasedProducts";

import { useLocation } from "@/components/location-provider";

// Types for categories
interface Category {
  _id: string;
  name: string;
  parentId: string;
  hide: boolean;
  popular: boolean;
  icon: string;
  description?: string;
  slug?: string;
  thumbnail?: string;
  showOnHome: boolean;
  productCount?: number;
}

export default function ProductsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") || "";
  const subcategory = params.get("subcategory") || "";
  const search = params.get("search") || "";
  const status = params.get("status") || "";
  
  // Always use context pincode
  const { locationState, isLoading } = useLocation();
  const contextPincode = locationState?.pincode;
  const isLocationDetected = locationState?.isLocationDetected;

  // State for categories
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // State for filters
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Fetch parent categories on mount
  useEffect(() => {
    fetchParentCategories();
  }, []);

  // Fetch subcategories when parent category changes
  useEffect(() => {
    if (category) {
      fetchSubcategories(category);
    } else {
      setSubcategories([]);
    }
  }, [category]);

  // Function to fetch parent categories
  const fetchParentCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const categories = await response.json();
        // Filter only parent categories (no parentId or empty parentId)
        const parents = categories.filter((cat: Category) => !cat.parentId || cat.parentId === '');
        setParentCategories(parents);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Function to fetch subcategories
  const fetchSubcategories = async (parentId: string) => {
    try {
      const response = await fetch(`/api/categories/subcategories/${parentId}`);
      if (response.ok) {
        const subs = await response.json();
        setSubcategories(subs);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  // Function to update URL parameters
  const updateUrlParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(window.location.search);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    router.push(`/products?${newParams.toString()}`);
  };

  // On mount: If context has pincode but URL does not (or is out of sync), update URL for shareability
  useEffect(() => {
    if (contextPincode && params.get("pin") !== contextPincode) {
      const newParams = new URLSearchParams(window.location.search);
      newParams.set("pin", contextPincode);
      router.replace(`/products?${newParams.toString()}`);
    }
  }, [contextPincode, router, params]);

  // Only show select pincode message if location detection is complete and no pincode found
  if (isLocationDetected && !contextPincode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shop Products</h1>
        <div className="mb-6">
          <p>Please select your delivery PIN code to view available products.</p>
        </div>
      </div>
    );
  }

  // If contextPincode exists, always show products (even if URL does not have pin)
  if (contextPincode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shop Products</h1>
        
        {/* First Row: Search, Parent Categories, Subcategories */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="Search products..."
                className="border rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                value={search}
                onChange={e => {
                  updateUrlParams({ search: e.target.value });
                }}
              />
            </div>

            {/* Parent Categories Dropdown */}
            <div>
              <select
                value={category}
                onChange={e => {
                  updateUrlParams({ 
                    category: e.target.value,
                    subcategory: '' // Reset subcategory when parent changes
                  });
                }}
                className="border rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loadingCategories}
              >
                <option value="">All Categories</option>
                {parentCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} {cat.productCount ? `(${cat.productCount})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategories Dropdown */}
            <div>
              <select
                value={subcategory}
                onChange={e => {
                  updateUrlParams({ subcategory: e.target.value });
                }}
                className="border rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!category || subcategories.length === 0}
              >
                <option value="">All Subcategories</option>
                {subcategories.map((subcat) => (
                  <option key={subcat._id} value={subcat._id}>
                    {subcat.name} {subcat.productCount ? `(${subcat.productCount})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Second Row: Warehouse, Status, and other filters */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Warehouse Filter - Removed as not available in current location provider */}
            <div>
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="border rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled
              >
                <option value="all">All Warehouses</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={status}
                onChange={e => {
                  updateUrlParams({ status: e.target.value });
                }}
                className="border rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <select
                className="border rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled
              >
                <option value="">Price Range</option>
              </select>
            </div>

            {/* Sort By Filter */}
            <div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="distance">Distance</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <LocationBasedProducts 
            categoryId={subcategory || category} 
            searchQuery={search} 
            pincode={contextPincode}
            status={status}
            selectedWarehouse={selectedWarehouse}
            sortBy={sortBy}
          />
        </div>
      </div>
    );
  }

  // Optionally, show a loading spinner or nothing if still initializing
  return null;
}