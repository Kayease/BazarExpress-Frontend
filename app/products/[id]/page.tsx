"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartContext, useWishlistContext } from "@/components/app-provider";
import {
  Check,
  Heart,
  Share2,
  Truck,
  AlertCircle,
  Minus,
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Zap,
  Shield,
  Award,
  Clock,
} from "lucide-react";

// Define the extended Product type to match backend schema
interface ProductDimensions {
  l: string;
  w: string;
  h: string;
}

interface ProductTax {
  _id?: string;
  rate: number;
  name?: string;
}

interface ProductBrand {
  _id?: string;
  name: string;
}

interface ProductCategory {
  _id?: string;
  name: string;
}

interface ProductAttribute {
  name: string;
  values: string[];
}

interface ExtendedProduct {
  _id: string;
  name: string;
  price: number;
  mrp: number;
  unit: string;
  image: string;
  description?: string;
  stock: number;
  sku?: string;
  hsn?: string;
  brand?: ProductBrand | string;
  category?: ProductCategory | string;
  tax?: ProductTax;
  priceIncludesTax?: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  manufacturer?: string;
  warranty?: string;
  deliveryTime?: string;
  shippingClass?: string;
  returnable?: boolean;
  returnWindow?: number;
  codAvailable?: boolean;
  galleryImages?: string[];
  batchNumber?: string;
  certifications?: string;
  safetyInfo?: string;
  attributes?: ProductAttribute[];
  rating?: number; // Added for related products
  variants?: {
    [key: string]: {
      name: string;
      price: number;
      mrp: number;
      stock: number;
      images: string[];
    };
  };
}

interface ProductReview {
  _id: string;
  user: { name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ExtendedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();
  const [relatedProducts, setRelatedProducts] = useState<ExtendedProduct[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  // Move selectedVariant hook here
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const APIURL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${APIURL}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
        // Fetch related products after product is loaded
        if (data && data.category) {
          const categoryId =
            typeof data.category === "object" && data.category._id
              ? data.category._id
              : data.category;

          fetch(`${APIURL}/products?category=${categoryId}`)
            .then((res) => res.json())
            .then((products) => {
              if (Array.isArray(products)) {
                setRelatedProducts(
                  products.filter((p: ExtendedProduct) => p._id !== data._id)
                );
              }
            })
            .catch((error) => {
              console.error("Error fetching related products:", error);
              setRelatedProducts([]);
            });
        }
        // Fetch reviews for this product
        fetch(`${APIURL}/reviews?productId=${data._id}`)
          .then((res) => res.json())
          .then((data) => {
            setReviews(Array.isArray(data) ? data : []);
            setReviewsLoading(false);
          })
          .catch(() => setReviewsLoading(false));
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
        setLoading(false);
        setReviewsLoading(false);
      });
  }, [id, APIURL]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-400">
        Loading...
      </div>
    );
  }
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Product Not Found
        </h1>
        <Button onClick={() => router.push("/products")}>
          Browse Products
        </Button>
      </div>
    );
  }

  // Images array: main + gallery
  const images = [product.image, ...(product.galleryImages || [])];

  // Variants
  const variants =
    product.variants && Object.keys(product.variants).length > 0
      ? product.variants
      : null;
  const variantImages =
    selectedVariant && variants && variants[selectedVariant]?.images
      ? variants[selectedVariant].images
      : [];
  const allImages = variantImages.length > 0 ? variantImages : images;

  // Discount
  const discountPercent =
    product.mrp > 0 && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  // Brand/category names
  const brandName =
    typeof product.brand === "object" && product.brand
      ? product.brand.name
      : typeof product.brand === "string"
      ? product.brand
      : "Generic Brand";
  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : typeof product.category === "string"
      ? product.category
      : "Uncategorized";

  // Rating (mocked for now)
  const rating = 4.6;
  const reviewCount = 75;

  // Features (from attributes or description)
  const features = product.attributes?.slice(0, 5) || [];

  // Section: Product Main Info
  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center text-sm text-gray-500 gap-2 animate-fade-in">
          <span
            className="hover:text-green-600 cursor-pointer transition-colors duration-300 hover:scale-105 transform"
            onClick={() => router.push("/")}
          >
            Home
          </span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span
            className="hover:text-green-600 cursor-pointer transition-colors duration-300 hover:scale-105 transform"
            onClick={() => router.push("/search")}
          >
            Products
          </span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          {product?.category && (
            <span
              className="hover:text-green-600 cursor-pointer transition-colors duration-300 hover:scale-105 transform"
              onClick={() => {
                if (
                  typeof product.category === "object" &&
                  product.category !== null &&
                  "_id" in product.category
                ) {
                  router.push(
                    `/search?category=${
                      (product.category as ProductCategory)._id
                    }`
                  );
                } else {
                  router.push(`/search?category=${product.category}`);
                }
              }}
            >
              {typeof product.category === "object" &&
              product.category !== null &&
              "name" in product.category
                ? (product.category as ProductCategory).name
                : product.category}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="text-gray-800 font-medium truncate">
            {product?.name}
          </span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Image Gallery */}
          <div className="animate-slide-in-left">
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-gray-200 shadow-2xl bg-white group hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Image
                src={allImages[mainImageIdx] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                priority
              />
              {discountPercent > 0 && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                  <Zap className="h-4 w-4 inline mr-1" />
                  {discountPercent}% OFF
                </div>
              )}
              {/* Nav arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setMainImageIdx(
                        (mainImageIdx - 1 + allImages.length) % allImages.length
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 group/btn"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700 group-hover/btn:text-green-600" />
                  </button>
                  <button
                    onClick={() =>
                      setMainImageIdx((mainImageIdx + 1) % allImages.length)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 group/btn"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700 group-hover/btn:text-green-600" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 mt-6 justify-center overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImageIdx(idx)}
                    className={`border-3 rounded-xl p-2 bg-white transition-all duration-300 hover:scale-105 ${
                      mainImageIdx === idx
                        ? "border-green-500 shadow-lg ring-2 ring-green-200"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`thumb-${idx}`}
                      width={70}
                      height={70}
                      className="object-contain rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Variant Selector */}
            {variants && (
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {Object.keys(variants).map((variantKey) => (
                  <Button
                    key={variantKey}
                    variant={
                      selectedVariant === variantKey ? "default" : "outline"
                    }
                    className={`text-sm px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                      selectedVariant === variantKey
                        ? "bg-green-600 hover:bg-green-700 shadow-lg"
                        : "hover:border-green-400 hover:text-green-600"
                    }`}
                    onClick={() => {
                      setSelectedVariant(variantKey);
                      setMainImageIdx(0);
                    }}
                  >
                    {variantKey}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="animate-slide-in-right">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <Badge
                  variant="secondary"
                  className="text-sm px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Award className="h-4 w-4 mr-1" />
                  {brandName}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                >
                  {categoryName}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-green-600 animate-pulse">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.mrp > product.price && (
                  <div className="flex flex-col">
                    <span className="text-xl text-gray-400 line-through">
                      ₹{product.mrp.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">MRP</span>
                  </div>
                )}
                {discountPercent > 0 && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                  <span className="text-gray-500 block">Unit</span>
                  <span className="font-semibold text-gray-800">
                    {product.unit}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                  <span className="text-gray-500 block">Price per unit</span>
                  <span className="font-semibold text-gray-800">
                    ₹{(product.price / (product.weight || 1)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 transition-colors duration-200 ${
                        i < Math.round(rating)
                          ? "text-yellow-400"
                          : "text-gray-200"
                      }`}
                      fill={i < Math.round(rating) ? "#facc15" : "none"}
                    />
                  ))}
                </div>
                <span className="text-gray-700 font-semibold">{rating}</span>
                <span className="text-gray-500 text-sm">
                  ({reviewCount} reviews)
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">In Stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-200">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Out of Stock</span>
                  </div>
                )}
                {product.stock > 0 && (
                  <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                    {product.stock} available
                  </span>
                )}
              </div>
              {/* Key Features */}
              {features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                    Key Features
                  </h3>
                  <div className="space-y-2">
                    {features.map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-gray-700 text-sm bg-green-50 rounded-xl p-3 hover:bg-green-100 transition-colors"
                      >
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>
                          <strong className="text-green-700">
                            {attr.name}:
                          </strong>{" "}
                          {attr.values.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Origin & Storage */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 hover:bg-blue-100 transition-colors">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    Origin
                  </div>
                  <div className="font-semibold text-blue-800">
                    Washington, USA
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-colors">
                  <div className="text-xs text-purple-600 font-medium mb-1">
                    Storage
                  </div>
                  <div className="font-semibold text-purple-800">
                    Refrigerate
                  </div>
                </div>
              </div>

              {/* Best before */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 text-yellow-800 hover:shadow-md transition-shadow">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>
                  Best before: <strong>7 days from delivery</strong>
                </span>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-4 py-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    >
                      <Minus className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="px-8 py-3 font-bold text-xl text-center min-w-[80px] bg-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(q + 1, product.stock))
                      }
                      disabled={product.stock <= quantity}
                      className="px-4 py-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    >
                      <Plus className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">Quantity</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl flex items-center gap-3 transition-all duration-300 hover:scale-105 flex-1"
                    disabled={product.stock <= 0}
                    onClick={() =>
                      addToCart({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: categoryName,
                        brand: brandName,
                        sku: product.sku,
                        quantity,
                      })
                    }
                  >
                    <ShoppingCart className="h-6 w-6" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-2xl h-14 w-14 border-2 transition-all duration-300 hover:scale-105 group ${
                      isInWishlist(product._id)
                        ? "border-red-300 bg-red-50 text-red-500"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                    aria-label={
                      isInWishlist(product._id)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                    onClick={() =>
                      addToWishlist({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: categoryName,
                        brand: brandName,
                        sku: product.sku,
                      })
                    }
                  >
                    <Heart
                      className={`h-6 w-6 transition-colors ${
                        isInWishlist(product._id)
                          ? "text-red-500 fill-red-500"
                          : "text-gray-400 group-hover:text-red-500"
                      }`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-2xl h-14 w-14 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 hover:scale-105 group"
                    aria-label="Share"
                  >
                    <Share2 className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </Button>
                </div>
              </div>

              {/* Delivery & Returns */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-6 py-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 font-semibold text-green-800 mb-2">
                  <Truck className="h-5 w-5" />
                  Free delivery on orders over ₹500
                </div>
                <div className="grid grid-cols-2 gap-4 text-green-700 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Delivery within 2-4 hours
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Easy returns within 24 hours
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Features Section */}
        <div className="mt-20 max-w-6xl mx-auto animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-700 rounded-full"></div>
              Product Description
            </h2>
            <div className="text-gray-700 mb-8 text-lg leading-relaxed bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
              {product.description || "No description available."}
            </div>
            {features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-xl mb-4 text-gray-900 flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  Detailed Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 text-gray-700 text-base bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:scale-105"
                    >
                      <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <span>
                        <strong className="text-green-700">{attr.name}:</strong>{" "}
                        {attr.values.join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Specs Section */}
        <div className="mt-16 max-w-6xl mx-auto animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
              Product Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "SKU", value: product.sku || "None", icon: "📦" },
                { label: "HSN", value: product.hsn || "None", icon: "🏷️" },
                {
                  label: "Weight",
                  value: product.weight ? `${product.weight} kg` : "—",
                  icon: "⚖️",
                },
                {
                  label: "Dimensions",
                  value:
                    product.dimensions &&
                    (product.dimensions.l ||
                      product.dimensions.w ||
                      product.dimensions.h)
                      ? `${product.dimensions.l || "—"} × ${
                          product.dimensions.w || "—"
                        } × ${product.dimensions.h || "—"}`
                      : "—",
                  icon: "📏",
                },
                {
                  label: "Manufacturer",
                  value: product.manufacturer || "None",
                  icon: "🏭",
                },
                {
                  label: "Warranty",
                  value: product.warranty || "None",
                  icon: "🛡️",
                },
                {
                  label: "Batch Number",
                  value: product.batchNumber || "None",
                  icon: "🔢",
                },
                {
                  label: "Certifications",
                  value: product.certifications || "None",
                  icon: "🏆",
                },
                {
                  label: "Safety Info",
                  value: product.safetyInfo || "None",
                  icon: "⚠️",
                },
                {
                  label: "Tax",
                  value:
                    product.tax && product.tax.rate !== undefined
                      ? `${product.tax.rate}%`
                      : "—",
                  icon: "💰",
                },
                {
                  label: "Shipping Class",
                  value: product.shippingClass || "None",
                  icon: "🚚",
                },
                {
                  label: "Returnable",
                  value:
                    product.returnable !== undefined
                      ? product.returnable
                        ? "Yes"
                        : "No"
                      : "No",
                  icon: "↩️",
                },
                {
                  label: "Return Window",
                  value: product.returnWindow
                    ? `${product.returnWindow} days`
                    : "—",
                  icon: "📅",
                },
                {
                  label: "COD Available",
                  value:
                    product.codAvailable !== undefined
                      ? product.codAvailable
                        ? "Yes"
                        : "No"
                      : "No",
                  icon: "💵",
                },
              ].map((spec, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{spec.icon}</span>
                    <span className="font-semibold text-gray-800 text-sm">
                      {spec.label}
                    </span>
                  </div>
                  <div className="text-gray-700 font-medium">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Reviews Section - Only show if there are reviews */}
        {!reviewsLoading && reviews.length > 0 && (
          <div className="mt-20 max-w-6xl mx-auto animate-fade-in-up">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></div>
                Customer Reviews ({reviews.length})
              </h2>
              <div className="space-y-6">
                {reviews.map((review, idx) => (
                  <div
                    key={review._id}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    style={{
                      animationName: "fadeIn",
                      animationDuration: "0.6s",
                      animationDelay: `${idx * 0.1}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="flex gap-4 items-start">
                      <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-full h-14 w-14 flex items-center justify-center font-bold text-white text-xl shadow-lg">
                        {review.user.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900 text-lg">
                            {review.user.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 transition-colors ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill={i < review.rating ? "#facc15" : "none"}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-700 leading-relaxed bg-white rounded-xl p-4 shadow-sm">
                          {review.comment}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Related Products Section - Only show if there are related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 max-w-7xl mx-auto animate-fade-in-up">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-full"></div>
                  Related Products ({relatedProducts.length})
                </h2>
                {product?.category && (
                  <Button
                    variant="outline"
                    className="text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                    onClick={() => {
                      const categoryId =
                        typeof product.category === "object" &&
                        product.category !== null &&
                        "_id" in product.category
                          ? (product.category as ProductCategory)._id
                          : product.category;
                      router.push(`/search?category=${categoryId}`);
                    }}
                  >
                    View All →
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((relProd, idx) => (
                  <div
                    key={relProd._id}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden shadow-lg relative cursor-pointer group transition-all duration-500 hover:shadow-2xl hover:scale-105"
                    style={{
                      animationName: "fadeIn",
                      animationDuration: "0.6s",
                      animationDelay: `${idx * 0.1}s`,
                      animationFillMode: "forwards",
                    }}
                    onClick={() => router.push(`/products/${relProd._id}`)}
                  >
                    {relProd.mrp && relProd.mrp > relProd.price && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg animate-pulse">
                        {Math.round(
                          ((relProd.mrp - relProd.price) / relProd.mrp) * 100
                        )}
                        % OFF
                      </div>
                    )}

                    <div className="relative overflow-hidden">
                      <Image
                        src={relProd.image || "/placeholder.svg"}
                        alt={relProd.name}
                        width={400}
                        height={300}
                        className="object-cover w-full h-48 group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    <div className="p-5">
                      <div
                        className="font-semibold text-gray-900 mb-2 truncate text-lg group-hover:text-indigo-700 transition-colors"
                        title={relProd.name}
                      >
                        {relProd.name}
                      </div>
                      <div className="text-gray-500 text-sm mb-3 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        {relProd.unit || "—"}
                      </div>

                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className={`h-4 w-4 transition-colors ${
                              relProd.rating && j < Math.round(relProd.rating)
                                ? "text-yellow-400"
                                : "text-gray-200"
                            }`}
                            fill={
                              relProd.rating && j < Math.round(relProd.rating)
                                ? "#facc15"
                                : "none"
                            }
                          />
                        ))}
                        <span className="text-gray-500 text-xs ml-1">
                          ({relProd.rating ? relProd.rating.toFixed(1) : "—"})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-green-700 font-bold text-xl">
                          ₹{relProd.price?.toLocaleString() ?? "—"}
                        </span>
                        {relProd.mrp && relProd.mrp > relProd.price && (
                          <span className="text-gray-400 line-through text-sm">
                            ₹{relProd.mrp.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {relProd.stock !== undefined && (
                        <div
                          className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                            relProd.stock > 0
                              ? "text-green-700 bg-green-100"
                              : "text-red-600 bg-red-100"
                          }`}
                        >
                          {relProd.stock > 0 ? "In Stock" : "Out of Stock"}
                        </div>
                      )}
                    </div>

                    <button
                      className={`absolute top-4 right-4 backdrop-blur-sm rounded-full p-2 border hover:scale-110 transition-all duration-300 group/heart ${
                        isInWishlist(relProd._id)
                          ? "bg-red-50 border-red-200"
                          : "bg-white/90 border-gray-200 hover:bg-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWishlist({
                          id: relProd._id,
                          name: relProd.name,
                          price: relProd.price,
                          image: relProd.image,
                          category:
                            typeof relProd.category === "object"
                              ? relProd.category?.name
                              : relProd.category,
                          brand:
                            typeof relProd.brand === "object"
                              ? relProd.brand?.name
                              : relProd.brand,
                          sku: relProd.sku,
                        });
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          isInWishlist(relProd._id)
                            ? "text-red-500 fill-red-500"
                            : "text-gray-400 group-hover/heart:text-red-500"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
