"use client";

import { Clock, Loader2, Star, StarHalf, Info, Package, Tag, Truck, Shield, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { useAppContext } from "@/components/app-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
}

interface ProductSection {
  category: Category;
  products: Product[];
}

interface ProductSectionProps {
  onAddToCart: (product: any) => void;
  searchQuery: string;
}

export default function ProductSection({
  onAddToCart,
  searchQuery,
}: ProductSectionProps) {
  const [productSections, setProductSections] = useState<ProductSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Get wishlist functions from context
  const { addToWishlist, isInWishlist } = useAppContext();

  useEffect(() => {
    const fetchHomeCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }

        const categoriesData = await categoriesResponse.json();

        // Filter categories that have showOnHome=true OR show all parent categories if none have showOnHome set
        const homeCategories = categoriesData.filter((category: Category) => {
          // Only parent categories (no parentId)
          const isParent = !category.parentId || category.parentId === "";
          // If any parent category has showOnHome set, only show those
          const hasShowOnHomeCategories = categoriesData.some((cat: Category) => (!cat.parentId || cat.parentId === "") && cat.showOnHome);
          if (hasShowOnHomeCategories) {
            return isParent && category.showOnHome;
          }
          // Otherwise, show all parent categories that are not hidden
          return isParent && !category.hide;
        });

        if (homeCategories.length === 0) {
          setProductSections([]);
          setLoading(false);
          return;
        }

        // Fetch all products
        const productsResponse = await fetch(`${API_URL}/products`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }

        const productsData = await productsResponse.json();

        // Group products by category
        const sections = homeCategories.map((category: Category) => {
          const categoryProducts = productsData.filter(
            (product: Product) => product.category && (typeof product.category === 'object' ? product.category._id === category._id : product.category === category._id)
          );

          return {
            category,
            products: categoryProducts,
          };
        });

        // Filter out sections with no products
        const nonEmptySections = sections.filter((section: { products: string | any[]; }) => section.products.length > 0);

        setProductSections(nonEmptySections);
      } catch (err) {
        console.error('Error fetching home categories:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeCategories();
  }, [API_URL]);

  // Filter products based on search query if provided
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') return;

    const fetchHomeCategories = async () => {
      try {
        setLoading(true);

        // Fetch all categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }

        const categoriesData = await categoriesResponse.json();

        // Filter categories that have showOnHome=true OR show all parent categories if none have showOnHome set
        const homeCategories = categoriesData.filter((category: Category) => {
          // Only parent categories (no parentId)
          const isParent = !category.parentId || category.parentId === "";
          // If any parent category has showOnHome set, only show those
          const hasShowOnHomeCategories = categoriesData.some((cat: Category) => (!cat.parentId || cat.parentId === "") && cat.showOnHome);
          if (hasShowOnHomeCategories) {
            return isParent && category.showOnHome;
          }
          // Otherwise, show all parent categories that are not hidden
          return isParent && !category.hide;
        });

        if (homeCategories.length === 0) {
          setProductSections([]);
          setLoading(false);
          return;
        }

        // Fetch all products
        const productsResponse = await fetch(`${API_URL}/products`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }

        const productsData = await productsResponse.json();

        // Filter products by search query
        const filteredProducts = productsData.filter((product: Product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Group filtered products by category
        const sections = homeCategories.map((category: Category) => {
          const categoryProducts = filteredProducts.filter(
            (product: Product) => product.category && (typeof product.category === 'object' ? product.category._id === category._id : product.category === category._id)
          );

          return {
            category,
            products: categoryProducts,
          };
        });

        // Filter out sections with no products
        const nonEmptySections = sections.filter((section: { products: string | any[]; }) => section.products.length > 0);

        setProductSections(nonEmptySections);
      } catch (err) {
        console.error('Error filtering products:', err);
        setError('Failed to filter products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeCategories();
  }, [searchQuery, API_URL]);

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
      <div className="py-20 flex flex-col items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
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
    <section className="py-4 sm:py-6 md:py-8 bg-surface-primary overflow-hidden">
      <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        {productSections.map((section) => (
          <div key={section.category._id} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">
                {section.category.name}
              </h2>
              <Link href={`/categories/${section.category._id}`} className="text-brand-primary font-medium hover:text-brand-primary-dark">
                see all
              </Link>
            </div>

            <div className="relative group">
              <Carousel
                className="w-full relative group"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselPrevious className="left-2 sm:left-4 md:left-6 lg:left-8 xl:left-12 2xl:left-16 -translate-y-1/2 top-1/2 z-10 hidden sm:flex" />
                <CarouselContent className="-ml-1">
                  {section.products.map((product) => (
                    <CarouselItem
                      key={product._id}
                      className="basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6 pl-2 sm:pl-4"
                    >
                      <Link href={`/products/${product._id}`} className="block group">
                        <div className="relative w-full h-full bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-sm min-h-[320px] group/card transition-all duration-300 cursor-pointer overflow-hidden \
                          before:absolute before:inset-0 before:bg-gradient-to-br before:from-green-50 before:to-white before:opacity-0 group-hover/card:before:opacity-100 before:transition-opacity before:duration-300">
                          {/* Product Image and Badges */}
                          <div className="w-full flex flex-col items-center relative mb-2 z-10">
                            {/* Wishlist Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const wishlistItem = {
                                  id: product._id,
                                  name: product.name,
                                  price: product.price,
                                  image: product.image,
                                  category: typeof product.category === 'object' && product.category ? product.category.name : product.category,
                                  brand: product.brand && typeof product.brand === 'object' ? product.brand.name : product.brand,
                                  unit: product.unit,
                                  weight: product.weight,
                                  mrp: product.mrp,
                                };
                                addToWishlist(wishlistItem);
                              }}
                              disabled={isInWishlist(product._id)}
                              className={`absolute top-2 right-2 z-30 p-2 rounded-full transition-all duration-200 ${
                                isInWishlist(product._id)
                                  ? 'bg-red-100 text-red-500 cursor-not-allowed'
                                  : 'bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 shadow-md hover:shadow-lg'
                              } opacity-70 sm:opacity-0 group-hover/card:opacity-100 transform scale-90 group-hover/card:scale-100`}
                              title={isInWishlist(product._id) ? "Already in wishlist" : "Add to wishlist"}
                            >
                              <Heart 
                                className={`w-4 h-4 transition-all duration-200 ${
                                  isInWishlist(product._id) ? 'fill-red-500' : 'hover:fill-red-500'
                                }`} 
                              />
                            </button>
                            
                            {product.stock && product.stock <= (product.lowStockThreshold || 5) && product.stock > 0 && (
                              <Badge variant="destructive" className="absolute top-0 left-0 z-20">
                                Low Stock
                              </Badge>
                            )}
                            {product.stock === 0 && (
                              <Badge variant="secondary" className="absolute top-0 left-0 z-20 bg-gray-700 text-white">
                                Out of Stock
                              </Badge>
                            )}
                            {product.mrp && product.price < product.mrp && (
                              <Badge variant="default" className="absolute bottom-0 left-0 z-20 bg-green-600">
                                {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                              </Badge>
                            )}
                            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-2 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-green-100 to-green-50 shadow group-hover/card:scale-105 transition-transform duration-300 relative">
                              <img
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
                                className="max-w-full max-h-full object-contain drop-shadow-lg group-hover/card:scale-110 transition-transform duration-300"
                              />
                              {product.stock !== undefined && product.stock > 0 && product.stock <= (product.lowStockThreshold || 5) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-amber-100 text-amber-800 text-[10px] text-center py-0.5 rounded-b-xl">
                                  Only {product.stock} left
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="w-full flex-1 flex flex-col items-center justify-between z-10">
                            {/* Product Name */}
                            <h3 className="text-lg font-bold text-gray-900 text-center mb-1 line-clamp-2 group-hover/card:text-green-700 transition-colors">
                              {product.name}
                            </h3>
                            {/* Description */}
                            {product.description && (
                              <p className="text-xs text-gray-500 text-center mb-1 line-clamp-2">{product.description}</p>
                            )}
                            {/* Unit and Brand */}
                            <div className="flex flex-col items-center mb-1 gap-0.5">
                              {product.unit && (
                                <span className="text-xs text-gray-400">{product.unit}</span>
                              )}
                              {product.brand && (
                                <span className="text-xs text-gray-400">{product.brand.name}</span>
                              )}
                            </div>
                            {/* Rating */}
                            {product.rating > 0 && (
                              <div className="flex items-center mb-2">
                                {[...Array(Math.floor(product.rating))].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" strokeWidth={0} />
                                ))}
                                {product.rating % 1 >= 0.5 && (
                                  <StarHalf className="w-3 h-3 text-yellow-400 fill-yellow-400" strokeWidth={0} />
                                )}
                                <span className="text-xs text-gray-500 ml-1">{product.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {/* Features */}
                            <div className="w-full flex justify-center gap-2 mb-2">
                              <TooltipProvider>
                                {product.returnable && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <Tag className="w-3 h-3 text-blue-500" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{product.returnWindow || 7} days return</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {product.codAvailable && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <Truck className="w-3 h-3 text-green-500" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cash on Delivery available</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {product.warranty && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <Shield className="w-3 h-3 text-purple-500" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{product.warranty} warranty</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </TooltipProvider>
                            </div>
                            {/* Price and Add Button */}
                            <div className="flex items-center justify-between w-full mt-auto relative">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="text-base font-bold text-green-700">
                                    ₹{product.price}
                                  </span>
                                  {product.mrp && product.price < product.mrp && (
                                    <span className="text-xs font-medium text-green-600">
                                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                                    </span>
                                  )}
                                </div>
                                {product.mrp && product.price < product.mrp && (
                                  <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  // Only pass primitive fields to cart, and use id instead of _id
                                  const cartItem = {
                                    id: product._id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.image,
                                    category: typeof product.category === 'object' && product.category ? product.category.name : product.category,
                                    brand: product.brand && typeof product.brand === 'object' ? product.brand.name : product.brand,
                                    unit: product.unit,
                                    weight: product.weight,
                                    mrp: product.mrp,
                                    // add more fields as needed, but avoid nested objects
                                  };
                                  onAddToCart(cartItem);
                                }}
                                disabled={product.stock === 0}
                                className={`absolute right-2 bottom-2 opacity-0 group-hover/card:opacity-100 translate-y-4 group-hover/card:translate-y-0 transition-all duration-300 ml-2 px-4 py-2 rounded-full shadow-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-xs sm:text-sm whitespace-nowrap z-20 ${product.stock === 0 ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : ''}`}
                              >
                                {product.stock === 0 ? 'SOLD OUT' : 'ADD TO CART'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselNext className="right-2 sm:right-4 md:right-6 lg:right-8 xl:right-12 2xl:right-16 -translate-y-1/2 top-1/2 z-10 hidden sm:flex" />
              </Carousel>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
