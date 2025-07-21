"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Apple, Milk, Cookie, Coffee, Drumstick, Carrot, Fish, Pill, Home, Baby, Smartphone, FilterIcon, XIcon } from 'lucide-react';
import Link from "next/link";

const DIETARY_OPTIONS = [
  "Organic",
  "Gluten Free",
  "Vegan",
  "Vegetarian",
];

// Map category names to icons
const CATEGORY_ICONS: Record<string, any> = {
  'Vegetables & Fruits': Apple,
  'Dairy & Breakfast': Milk,
  'Munchies': Cookie,
  'Cold Drinks & Juices': Coffee,
  'Instant & Frozen Food': Drumstick,
  'Tea, Coffee & Health Drink': Coffee,
  'Bakery & Biscuits': Cookie,
  'Sweet Tooth': Cookie,
  'Atta, Rice & Dal': Carrot,
  'Masala, Oil & More': Carrot,
  'Chicken, Meat & Fish': Fish,
  'Paan Corner': Apple,
  'Pharma & Wellness': Pill,
  'Cleaning Essentials': Home,
  'Baby Care': Baby,
  'Electronics': Smartphone,
};

const CATEGORY_COLORS = [
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
  'bg-cyan-100 text-cyan-700',
];

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<{ products: any[]; categories: any[] }>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [sort, setSort] = useState("relevance");
  const [categories, setCategories] = useState<any[]>([]);
  const categoryParam = params.get("category") || "";
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL 

  // Fetch main/parent categories from backend (always, for both sidebar and main content)
  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data.filter((cat: any) => !cat.hide));
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Fetch brands from backend
  useEffect(() => {
    fetch(`${API_URL}/brands`)
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error('Error fetching brands:', err));
  }, []);

  // Determine min/max price from products
  useEffect(() => {
    if (Array.isArray(results.products) && results.products.length > 0) {
      const prices = results.products.map((p) => Number(p.price)).filter(Boolean);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setMinPrice(min);
      setMaxPrice(max);
      setPriceRange([min, max]);
    }
  }, [results.products]);

  // Filter products client-side
  const filteredProducts = Array.isArray(results.products) ? results.products : [];

  // Sorting logic
  const sortedProducts = useMemo(() => {
    if (!filteredProducts) return [];
    let sorted = [...filteredProducts];
    if (sort === "price-low-high") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high-low") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // Default: relevance (no sort)
    return sorted;
  }, [filteredProducts, sort]);

  // Search and category effect
  useEffect(() => {
    // If no search and no category, fetch all products
    if (!q && !categoryParam) {
      setLoading(true);
      axios.get(`${API_URL}/products`).then((res) => {
        setResults({ products: res.data, categories: [] });
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
      return;
    }

    setLoading(true);
    // If only category is selected, use the products endpoint with category filter
    if (!q && categoryParam) {
      axios.get(`${API_URL}/products?category=${categoryParam}`).then((res) => {
        setResults({ products: res.data, categories: [] });
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching products by category:', err);
        setLoading(false);
      });
      return;
    }

    // If search query exists, use search endpoint
    if (q.length > 0) {
      let url = `/search?q=${encodeURIComponent(q)}`;
      if (categoryParam) url += `&category=${encodeURIComponent(categoryParam)}`;
      axios.get(url).then((res) => {
        setResults(res.data);
        setLoading(false);
      });
    }
  }, [q, categoryParam]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Filter Button */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
          >
            <FilterIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-low-high">Price: Low to High</SelectItem>
              <SelectItem value="price-high-low">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[300px] bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2">
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
              {/* Mobile Categories */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      className={`w-full text-left px-3 py-2 rounded-lg ${
                        categoryParam === cat._id
                          ? "bg-green-50 text-green-700 font-medium"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        router.push(`/search?category=${cat._id}`);
                        setIsMobileFilterOpen(false);
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price Range */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Price Range</h3>
                <div className="px-3">
                  <Slider
                    min={minPrice}
                    max={maxPrice}
                    step={1}
                    value={priceRange}
                    onValueChange={(val) => setPriceRange(val as [number, number])}
                  />
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Brands */}
              {brands.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Brands</h3>
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <label key={brand._id} className="flex items-center px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-green-600"
                          checked={selectedBrands.includes(brand._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands([...selectedBrands, brand._id]);
                            } else {
                              setSelectedBrands(selectedBrands.filter((id) => id !== brand._id));
                            }
                          }}
                        />
                        <span className="ml-3 text-gray-700">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
          <span>/</span>
          {categoryParam ? (
            <>
              <Link href="/search" className="hover:text-green-600 transition-colors">All Categories</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {categories.find(cat => cat._id === categoryParam)?.name || 'Category'}
              </span>
            </>
          ) : (
            <span className="text-gray-900 font-medium">
              {q ? `Search: "${q}"` : 'All Products'}
            </span>
          )}
        </nav>

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 space-y-6 sticky top-4 h-fit">
            {/* Categories Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
              </div>
              <div className="p-2">
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${!categoryParam 
                    ? "bg-green-50 text-green-700 font-medium"
                    : "hover:bg-gray-50 text-gray-700"}`}
                  onClick={() => {
                    setLoading(true);
                    router.push(`/search`);
                  }}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${categoryParam === cat._id
                      ? "bg-green-50 text-green-700 font-medium"
                      : "hover:bg-gray-50 text-gray-700"}`}
                    onClick={() => {
                      setLoading(true);
                      router.push(`/search?category=${cat._id}`);
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
              </div>
              <div className="p-4">
                <Slider
                  min={minPrice}
                  max={maxPrice}
                  step={1}
                  value={priceRange}
                  onValueChange={(val) => setPriceRange(val as [number, number])}
                  className="mt-2"
                />
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Brands Section */}
            {brands.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Brands</h3>
                </div>
                <div className="p-4 space-y-2">
                  {brands.map((brand) => (
                    <label key={brand._id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={selectedBrands.includes(brand._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrands([...selectedBrands, brand._id]);
                          } else {
                            setSelectedBrands(selectedBrands.filter((id) => id !== brand._id));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Category Header */}
            {(categoryParam || q) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    {categoryParam && (
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          {(() => {
                            const category = categories.find(cat => cat._id === categoryParam);
                            const IconComponent = category ? CATEGORY_ICONS[category.name] || Apple : Apple;
                            return <IconComponent className="w-6 h-6 text-green-700" />;
                          })()}
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">
                            {categories.find(cat => cat._id === categoryParam)?.name || 'Category'}
                          </h1>
                          <p className="text-gray-600">
                            {categories.find(cat => cat._id === categoryParam)?.description || 'Browse products in this category'}
                          </p>
                        </div>
                      </div>
                    )}
                    {q && !categoryParam && (
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
                        <p className="text-gray-600">Results for "{q}"</p>
                      </div>
                    )}
                    {q && categoryParam && (
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          Search in {categories.find(cat => cat._id === categoryParam)?.name}
                        </h1>
                        <p className="text-gray-600">Results for "{q}" in this category</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{filteredProducts.length}</div>
                    <div className="text-sm text-gray-500">Products found</div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Sort Bar */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Sort by:</span>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                      <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredProducts.length} products found
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
                    <div className="aspect-square w-full bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                {sortedProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group block"
                  >
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      <img
                        src={product.image || "/placeholder.jpg"}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                      {product.mrp && product.mrp > product.price && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                          {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-green-600">₹{product.price}</div>
                          {product.mrp && product.mrp > product.price && (
                            <div className="text-sm text-gray-500 line-through">₹{product.mrp}</div>
                          )}
                        </div>
                        <div className={`text-sm font-medium ${
                          product.stock > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {product.stock > 0 ? "In Stock" : "Out of Stock"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <img src="/no-results.svg" alt="No products found" className="w-48 h-48 mb-6" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}