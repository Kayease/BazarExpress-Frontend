"use client";

import { Clock, Loader2, Star, StarHalf, Info, Package, Tag, Truck, Shield, Heart, ShoppingCart, ChevronLeft, ChevronRight, Globe, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/components/app-provider";
import { useLocation } from "@/components/location-provider";
import { getDeliveryTimeEstimate } from "@/lib/delivery";

// Define interfaces for our data types
interface Product {
  _id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  rating: number;
  deliveryTime: string;
  description?: string;
  stock?: number;
  category?: Category;
  status?: string;
  brand?: any;
  sku?: string;
  mrp?: number;
  costPrice?: number;
  priceIncludesTax?: boolean;
  allowBackorders?: boolean;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: {
    l?: string;
    w?: string;
    h?: string;
  };
  returnable?: boolean;
  returnWindow?: number;
  codAvailable?: boolean;
  galleryImages?: string[];
  manufacturer?: string;
  warranty?: string;
}

interface Category {
  _id: string;
  name: string;
  popular: boolean;
  showOnHome: boolean;
  hide?: boolean;
  icon?: string;
  description?: string;
  thumbnail?: string;
  productCount?: number;
  parentId?: string | null;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductSection {
  category: Category;
  products: Product[];
}

interface ProductSectionProps {
  onAddToCart: (product: Product) => void;
  searchQuery: string;
}

export default function ProductSection({
  onAddToCart,
  searchQuery,
}: ProductSectionProps) {
  const [productSections, setProductSections] = useState<ProductSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Get wishlist functions from context
  const { addToWishlist, isInWishlist, addToCart, updateCartItem, cartItems } = useAppContext();
  
  // Get location context
  const { locationState, fetchProductsByLocation, deliveryMessage, isGlobalMode } = useLocation();

  // Local quantity state for product tiles
  const [quantities, setQuantities] = useState<{ [id: string]: number }>({});
  
  // User location for delivery time calculation
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [defaultDeliveryTime, setDefaultDeliveryTime] = useState<string>("8-12 minutes");

  // Sync local quantity state with cartItems
  useEffect(() => {
    const newQuantities: { [id: string]: number } = {};
    cartItems.forEach(item => {
      const itemId = item.id || item._id;
      newQuantities[itemId] = item.quantity;
    });
    setQuantities(newQuantities);
  }, [cartItems]);

  // Get user location and calculate delivery time
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          
          // Calculate distance from default warehouse (Delhi coordinates)
          const warehouseLat = 28.6139;
          const warehouseLng = 77.2090;
          
          // Simple distance calculation
          const R = 6371; // Earth's radius in kilometers
          const dLat = (userLat - warehouseLat) * Math.PI / 180;
          const dLon = (userLng - warehouseLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(warehouseLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          // Set delivery time based on distance
          setDefaultDeliveryTime(getDeliveryTimeEstimate(distance));
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default delivery time
        }
      );
    }
  }, []);

  const handleAdd = (product: Product) => {
    const productId = product._id;
    setQuantities(q => ({ ...q, [productId]: 1 }));
    addToCart({ ...product, id: productId, quantity: 1 });
  };
  const handleInc = (product: Product) => {
    const id = product._id;
    const newQty = (quantities[id] || 0) + 1;
    setQuantities(q => ({ ...q, [id]: newQty }));
    updateCartItem(id, newQty);
  };
  const handleDec = (product: Product) => {
    const id = product._id;
    const newQty = (quantities[id] || 0) - 1;
    if (newQty <= 0) {
      setQuantities(q => ({ ...q, [id]: 0 }));
      updateCartItem(id, 0);
    } else {
      setQuantities(q => ({ ...q, [id]: newQty }));
      updateCartItem(id, newQty);
    }
  };

  // Carousel scroll state
  const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleScroll = (catId: string) => {
    const ref = scrollRefs.current[catId];
    if (ref) {
      setScrollPositions((prev) => ({ ...prev, [catId]: ref.scrollLeft }));
    }
  };

  const scrollByAmount = (catId: string, amount: number) => {
    const ref = scrollRefs.current[catId];
    if (ref) {
      ref.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // If location is detected, use location-based product fetching
        if (locationState.isLocationDetected && locationState.pincode) {
          const locationProducts = await fetchProductsByLocation({ limit: 100 });
          
          if (locationProducts.success && locationProducts.products.length > 0) {
            // Fetch categories to organize products
            const categoriesResponse = await fetch(`${API_URL}/categories`);
            if (!categoriesResponse.ok) {
              throw new Error('Failed to fetch categories');
            }
            const categoriesData = await categoriesResponse.json();

            // Find all parent categories with showOnHome = true
            const homeCategories = categoriesData.filter((category: Category) =>
              category.showOnHome === true && (!category.parentId || category.parentId === "")
            );

            // Build a map of parentId -> subcategories
            const subcategoriesByParent: { [parentId: string]: string[] } = {};
            categoriesData.forEach((cat: Category) => {
              if (cat.parentId) {
                if (!subcategoriesByParent[cat.parentId]) subcategoriesByParent[cat.parentId] = [];
                subcategoriesByParent[cat.parentId].push(cat._id);
              }
            });

            // Organize location-based products by category
            const productSections: ProductSection[] = homeCategories.map((parentCat: Category) => {
              // Get all subcategory IDs for this parent
              const subcatIds = subcategoriesByParent[parentCat._id] || [];
              // Include parent category ID as well
              const allCatIds = [parentCat._id, ...subcatIds];
              
              // Filter products for this category and its subcategories
              const catProducts = locationProducts.products.filter((product: Product) => {
                if (!product.category) return false;
                const categoryId = typeof product.category === 'object' ? product.category._id : product.category;
                return allCatIds.includes(categoryId);
              });
              
              // Shuffle and pick up to 15 random products
              const shuffled = [...catProducts].sort(() => 0.5 - Math.random());
              const selectedProducts = shuffled.slice(0, 15);
              
              return {
                category: parentCat,
                products: selectedProducts
              };
            }).filter((section: { products: string | any[]; }) => section.products.length > 0);

            setProductSections(productSections);
          } else {
            // No products available for this location
            setProductSections([]);
          }
        } else {
          // Fallback to original logic if location not detected
          // Fetch all categories
          const categoriesResponse = await fetch(`${API_URL}/categories`);
          if (!categoriesResponse.ok) {
            throw new Error('Failed to fetch categories');
          }
          const categoriesData = await categoriesResponse.json();

          // Find all parent categories with showOnHome = true
          const homeCategories = categoriesData.filter((category: Category) =>
            category.showOnHome === true && (!category.parentId || category.parentId === "")
          );

          if (homeCategories.length === 0) {
            setProductSections([]);
            setLoading(false);
            return;
          }

          // Build a map of parentId -> subcategories
          const subcategoriesByParent: { [parentId: string]: string[] } = {};
          categoriesData.forEach((cat: Category) => {
            if (cat.parentId) {
              if (!subcategoriesByParent[cat.parentId]) subcategoriesByParent[cat.parentId] = [];
              subcategoriesByParent[cat.parentId].push(cat._id);
            }
          });

          // Fetch all active products
          const productsResponse = await fetch(`${API_URL}/products?status=active`);
          if (!productsResponse.ok) {
            throw new Error('Failed to fetch products');
          }
          let productsData = await productsResponse.json();

          // For each home category, collect its own and all subcategory IDs
          const productSections: ProductSection[] = homeCategories.map((parentCat: Category) => {
            // Get all subcategory IDs for this parent
            const subcatIds = subcategoriesByParent[parentCat._id] || [];
            // Include parent category ID as well
            const allCatIds = [parentCat._id, ...subcatIds];
            // Filter products for this category and its subcategories
            const catProducts = productsData.filter((product: Product) => {
            if (!product.category) return false;
            const categoryId = typeof product.category === 'object' ? product.category._id : product.category;
              return allCatIds.includes(categoryId);
          });
            // Shuffle and pick up to 15 random products
            const shuffled = [...catProducts].sort(() => 0.5 - Math.random());
          const selectedProducts = shuffled.slice(0, 15);
            return {
              category: parentCat,
            products: selectedProducts
          };
          }).filter((section: { products: string | any[]; }) => section.products.length > 0); // Only show if there are products

          setProductSections(productSections);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [API_URL, locationState.isLocationDetected, locationState.pincode, isGlobalMode, fetchProductsByLocation]);

  // Filter products based on search query if provided
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') return;

    const fetchSearchedProducts = async () => {
      try {
        setLoading(true);

        let searchResults = [];

        // If location is detected, use location-based search
        if (locationState.isLocationDetected && locationState.pincode) {
          const locationProducts = await fetchProductsByLocation({ 
            search: searchQuery,
            limit: 50 
          });
          
          if (locationProducts.success) {
            searchResults = locationProducts.products;
          }
        } else {
          // Fallback to regular search
          const searchResponse = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(searchQuery)}`);
          if (!searchResponse.ok) {
            throw new Error('Failed to search products');
          }
          searchResults = await searchResponse.json();
        }

        // Create a single section with search results
        const searchSection: ProductSection = {
          category: {
            _id: 'search',
            name: `Search Results for "${searchQuery}"`,
            popular: false,
            showOnHome: false,
            parentId: null,
            hide: false
          },
          products: searchResults
        };

        setProductSections([searchSection]);
      } catch (err) {
        console.error('Error searching products:', err);
        setError('Failed to search products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchedProducts();
  }, [searchQuery, API_URL, locationState.isLocationDetected, locationState.pincode, fetchProductsByLocation]);

  const handleWishlistClick = (product: Product) => {
    // Implementation of add to wishlist
    console.log('Add to wishlist:', product);
    // Call the actual wishlist function from context
    if (addToWishlist) {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        <p className="mt-4 text-text-secondary">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (productSections.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <p className="text-text-secondary">No product found to display on home page.</p>
      </div>
    );
  }

  return (
    <section className="py-12 ">
      <div className="max-w-7xl mx-auto px-4">
        {productSections.length > 0 ? (
          productSections.map(section => {
            // Debug: Log all product IDs in this section
            const idCounts: { [id: string]: number } = {};
            section.products.forEach(product => {
              idCounts[product._id] = (idCounts[product._id] || 0) + 1;
            });
            const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);
            if (duplicateIds.length > 0) {
              console.warn('Duplicate product IDs found in section', section.category.name, duplicateIds);
            }
            return (
              <div className="mb-12" key={section.category._id}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-2xl font-extrabold">{section.category.name}</div>
                  <Link href={`/search?category=${section.category._id}`} className="text-green-600 font-medium hover:underline">See all</Link>
                </div>
                <div className="relative">
                  {/* Left Button */}
                  {scrollPositions[section.category._id] > 0 && (
                    <button
                      className="absolute left-[-28px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow p-1 flex items-center justify-center hover:bg-gray-100"
                      style={{ width: 32, height: 32 }}
                      onClick={() => scrollByAmount(section.category._id, -220)}
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {/* Right Button */}
                  <button
                    className="absolute right-[-28px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow p-1 flex items-center justify-center hover:bg-gray-100"
                    style={{ width: 32, height: 32, display: section.products.length * 190 > (scrollRefs.current[section.category._id]?.clientWidth || 0) + (scrollRefs.current[section.category._id]?.scrollLeft || 0) ? 'flex' : 'none' }}
                    onClick={() => scrollByAmount(section.category._id, 220)}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div
                    className="overflow-x-auto scrollbar-hide"
                    ref={el => { scrollRefs.current[section.category._id] = el; }}
                    onScroll={() => handleScroll(section.category._id)}
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div className="flex gap-4 pb-2">
                      {section.products.map(product => {
                        const hasDiscount = product.mrp != null && product.mrp > product.price;
                        const discountPercent = hasDiscount ? Math.round((((product.mrp ?? 0) - product.price) / (product.mrp ?? 1)) * 100) : 0;
                        const showDiscountBadge = hasDiscount && discountPercent > 30;
                        return (
                          <div key={product._id} className="min-w-[180px] max-w-[180px] bg-white border border-gray-200 rounded-xl flex-shrink-0 flex flex-col relative group" style={{ fontFamily: 'Sinkin Sans, sans-serif', boxShadow: 'none' }}>
                            {/* Discount Badge */}
                            {showDiscountBadge && (
                              <div className="absolute left-3 top-0 z-10 flex items-center justify-center" style={{ width: '29px', height: '28px' }}>
                                <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
                                </svg>
                                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[9px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
                                  {discountPercent}%<br/>OFF
                      </div>
                              </div>
                            )}
                            {/* Wishlist Button */}
                            <button
                              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow hover:bg-gray-100"
                              onClick={() => handleWishlistClick(product)}
                              aria-label={isInWishlist && isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              <Heart className={`w-5 h-5 transition-colors duration-200 ${isInWishlist && isInWishlist(product._id) ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-none'}`} />
                            </button>
                            {/* Product Image */}
                            <div className="flex justify-center items-center h-32 pt-2">
                              <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-[120px] h-[120px] object-contain" />
                          </div>
                            <div className="px-3 py-2 flex-1 flex flex-col">
                              {/* Delivery Time Badge */}
                              <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-2" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
                                <img src="/timer-logo.avif" alt="eta" className="w-3 h-3" />
                                <span className="uppercase font-medium">
                                  {locationState.isLocationDetected ? deliveryMessage : defaultDeliveryTime}
                                </span>
                              </div>
                              {/* Delivery Mode Indicator */}
                              {locationState.isLocationDetected && (
                                <div className="text-[9px] text-gray-400 flex items-center gap-1 mb-1" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
                                  {isGlobalMode ? (
                                    <>
                                      <Globe className="w-2.5 h-2.5" />
                                      <span>Global Store</span>
                                    </>
                                  ) : (
                                    <>
                                      <Store className="w-2.5 h-2.5" />
                                      <span>Local Store</span>
                                    </>
                                  )}
                                </div>
                              )}
                              {/* Product Name */}
                              <div className="text-[12px] font-bold text-gray-900 line-clamp-2 mb-4 leading-snug" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
                                {product.name}
                    </div>
                              {/* Variant/Weight/Unit */}
                              <div className="text-xs text-gray-500 mb-2 font-normal" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>
                                {product.unit}
          </div>
                              {/* Bottom Section: Price, MRP, ADD button */}
                              <div className="flex items-end justify-between mt-2">
                                <div>
                                  <div className="text-[15px] font-bold text-gray-900 leading-none mb-1" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{product.price}</div>
                                  {hasDiscount && (
                                    <div className="text-xs text-gray-400 line-through leading-none font-normal" style={{ fontFamily: 'Sinkin Sans, sans-serif' }}>₹{product.mrp}</div>
                                  )}
                                </div>
                                {quantities[product._id] > 0 ? (
                                  <div className="flex items-center bg-green-700 rounded justify-between" style={{ minWidth: '80px', width: '80px', height: '32px' }}>
                                    <button
                                      className="text-white text-lg focus:outline-none flex-1 text-center h-full flex items-center justify-center"
                                      onClick={() => handleDec(product)}
                                      aria-label="Decrease quantity"
                                    >-</button>
                                    <span className="text-white font-bold text-base select-none text-center flex-1 h-full flex items-center justify-center">{quantities[product._id]}</span>
                                    <button
                                      className="text-white text-lg focus:outline-none flex-1 text-center h-full flex items-center justify-center"
                                      onClick={() => handleInc(product)}
                                      aria-label="Increase quantity"
                                    >+</button>
                                  </div>
                                ) : (
                                  <button
                                    className="border border-green-600 text-green-700 font-medium text-[15px] bg-white hover:bg-green-50 transition"
                                    style={{ minWidth: '80px', width: '80px', height: '32px', fontFamily: 'Sinkin Sans, sans-serif', borderRadius: '4px', boxShadow: 'none' }}
                                    onClick={() => handleAdd(product)}
                                  >ADD</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground/70">No products found. Try a different search term.</p>
            <Link href="/search" className="mt-4 inline-block text-primary hover:underline">
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
