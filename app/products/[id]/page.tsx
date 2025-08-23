"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartContext, useWishlistContext, useAppContext } from "@/components/app-provider";
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
  AlertTriangle,
  MessageSquare,
  Package,
  Info,
  Star as StarIcon,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { canAddToCart, getWarehouseConflictInfo } from "@/lib/warehouse-validation";
import { ReviewModal } from "@/components/ReviewModal";
import { ProductBreadcrumb } from "@/components/product-breadcrumb";
import toast from "react-hot-toast";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

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
  deliveryTime?: string;
  shippingClass?: string;
  returnable?: boolean;
  returnWindow?: number;
  codAvailable?: boolean;
  galleryImages?: string[];
  locationName?: string;
  attributes?: ProductAttribute[];
  rating?: number;
  warehouse?: any;
  manufacturer?: string;
  warranty?: string;
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
  title?: string;
  comment: string;
  createdAt: string;
  verified?: boolean;
  helpful?: number;
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ExtendedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cartItems, isItemBeingAdded } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();
  const { user } = useAppContext();
  const [relatedProducts, setRelatedProducts] = useState<ExtendedProduct[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  // Recently viewed products hook
  const { addToRecentlyViewed } = useRecentlyViewed();

  const APIURL = process.env.NEXT_PUBLIC_API_URL;

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReviews = async (productId: string) => {
    try {
      const response = await fetch(`${APIURL}/reviews/product/${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        const reviewsArray = data.reviews || [];
        const overallStats = data.overallStats || { averageRating: 0, totalReviews: 0 };
        
        setReviews(reviewsArray);
        setTotalReviews(overallStats.totalReviews);
        setAverageRating(overallStats.averageRating || 0);
      } else {
        setReviews([]);
        setTotalReviews(0);
        setAverageRating(0);
      }
      
      setReviewsLoading(false);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      setTotalReviews(0);
      setAverageRating(0);
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    const fetchProductData = async () => {
      try {
        // Fetch categories first
        await fetchCategories();
        
        const productResponse = await fetch(`${APIURL}/products/${id}`);
        const productData = await productResponse.json();
        
        if (!productResponse.ok) {
          throw new Error("Product not found");
        }
        
        setProduct(productData);
        
        // Add to recently viewed products
        addToRecentlyViewed(productData);
        
        // Auto-select the first variant if the product has variants
        if (productData.variants && Object.keys(productData.variants).length > 0) {
          const firstVariantKey = Object.keys(productData.variants)[0];
          setSelectedVariant(firstVariantKey);
          
          // If the first variant has images, reset the main image index to show the first variant image
          const firstVariant = productData.variants[firstVariantKey];
          if (firstVariant.images && firstVariant.images.length > 0) {
            setMainImageIdx(0);
          }
        }
        
        await fetchReviews(productData._id);
        
        if (productData && productData.category) {
          const categoryId =
            typeof productData.category === "object" && productData.category._id
              ? productData.category._id
              : productData.category;

          try {
            const relatedResponse = await fetch(`${APIURL}/products/public?category=${categoryId}&limit=8`);
            const relatedProducts = await relatedResponse.json();
            
            if (Array.isArray(relatedProducts)) {
              setRelatedProducts(
                relatedProducts.filter((p: ExtendedProduct) => p._id !== productData._id)
              );
            }
          } catch (error) {
            console.error("Error fetching related products:", error);
            setRelatedProducts([]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching product:", error);
        setLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchProductData();
  }, [id, APIURL]);

  const handleReviewSubmitted = () => {
    if (product) {
      fetchReviews(product._id);
    }
  };

  const handleMarkHelpful = async (reviewId: string, isHelpful: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to mark reviews as helpful');
        return;
      }

      const response = await fetch(`${APIURL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ helpful: isHelpful })
      });

      if (response.ok) {
        // Refresh reviews to show updated helpful count
        if (product) {
          fetchReviews(product._id);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to mark review as helpful');
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      alert('Failed to mark review as helpful');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <CardContent className="space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">
              Product Not Found
            </h1>
            <p className="text-gray-600">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => router.push("/products")}
              className="bg-brand-primary hover:bg-brand-primary-dark"
            >
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = [product.image, ...(product.galleryImages || [])];
  const variants =
    product.variants && Object.keys(product.variants).length > 0
      ? product.variants
      : null;
  const variantImages =
    selectedVariant && variants && variants[selectedVariant]?.images
      ? variants[selectedVariant].images
      : [];
  const allImages = variantImages.length > 0 ? variantImages : images;

  // Get the current price and MRP based on selected variant
  const currentPrice = selectedVariant && variants ? variants[selectedVariant].price : product.price;
  const currentMrp = selectedVariant && variants ? variants[selectedVariant].mrp : product.mrp;
  
  const discountPercent =
    currentMrp > 0 && currentMrp > currentPrice
      ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
      : 0;

  const brandName =
    typeof product.brand === "object" && product.brand
      ? product.brand.name
      : typeof product.brand === "string"
      ? product.brand
      : "Generic Brand";

  // Get the current stock based on selected variant
  const currentStock = selectedVariant && variants ? variants[selectedVariant].stock : product.stock;
  
  const canAddProduct = canAddToCart(product, cartItems);
  const conflictInfo = getWarehouseConflictInfo(product, cartItems);
  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : typeof product.category === "string"
      ? product.category
      : "Uncategorized";

  const displayRating = averageRating || 0;
  const displayReviewCount = totalReviews;
  const features = product.attributes?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductBreadcrumb product={product} categories={categories} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-white group">
                <Image
                  src={allImages[mainImageIdx] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {discountPercent > 0 && (
                  <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    {discountPercent}% OFF
                  </Badge>
                )}
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setMainImageIdx(
                          (mainImageIdx - 1 + allImages.length) % allImages.length
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setMainImageIdx((mainImageIdx + 1) % allImages.length)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => setMainImageIdx(idx)}
                    className={`flex-shrink-0 p-1 h-auto ${
                      mainImageIdx === idx
                        ? "border-green-500 ring-2 ring-green-200"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`thumb-${idx}`}
                      width={60}
                      height={60}
                      className="object-contain rounded"
                    />
                  </Button>
                ))}
              </div>
            )}

            {variants && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Available Variants</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(variants).map((variantKey) => (
                      <Button
                        key={variantKey}
                        variant={selectedVariant === variantKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedVariant(variantKey);
                          setMainImageIdx(0);
                          setQuantity(1); // Reset quantity when variant changes
                        }}
                        className={selectedVariant === variantKey ? "bg-brand-primary hover:bg-brand-primary-dark" : ""}
                      >
                        {variants[variantKey].name || variantKey.replace(/::/g, ' ')}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {brandName}
                      </Badge>
                      <Badge variant="outline" className="text-brand-primary border-brand-primary/20">
                        {categoryName}
                      </Badge>
                      {product.sku && (
                        <Badge variant="outline" className="text-gray-600">
                          SKU: {product.sku}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-3xl font-bold text-brand-primary">
                      ₹{currentPrice.toLocaleString()}
                    </span>
                    {currentMrp > currentPrice && (
                      <>
                        <span className="text-lg text-gray-400 line-through">
                          ₹{currentMrp.toLocaleString()}
                        </span>
                        {discountPercent > 0 && (
                          <Badge className="bg-red-500 hover:bg-red-600">
                            {discountPercent}% OFF
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(displayRating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {displayRating > 0 ? displayRating.toFixed(1) : "No rating"}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({displayReviewCount} review{displayReviewCount !== 1 ? 's' : ''})
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="ml-auto"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Write Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-500">Unit</span>
                    <p className="font-medium">{product.unit}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-500">Price per unit</span>
                    <p className="font-medium">
                      ₹{(currentPrice / (product.weight || 1)).toFixed(2)}
                    </p>
                  </div>
                  {product.weight && (
                    <div className="space-y-1">
                      <span className="text-gray-500">Weight</span>
                      <p className="font-medium">{product.weight} kg</p>
                    </div>
                  )}
                  {product.manufacturer && (
                    <div className="space-y-1">
                      <span className="text-gray-500">Manufacturer</span>
                      <p className="font-medium">{product.manufacturer}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentStock > 0 ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">In Stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
                {currentStock > 0 && (
                  <Badge variant="secondary">
                    {currentStock} available
                  </Badge>
                )}
              </div>
              {!canAddProduct && (
                <Badge variant="destructive" className="text-xs">
                  Different Store
                </Badge>
              )}
            </div>
            
            {features.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <StarIcon className="h-5 w-5 text-green-600" />
                    Key Features
                  </h3>
                  <div className="space-y-3">
                    {features.map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-gray-900">
                            {attr.name}:
                          </strong>{" "}
                          <span className="text-gray-600">
                            {attr.values.join(", ")}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {product.warranty && (
                    <div className="space-y-1">
                      <span className="text-gray-500">Warranty</span>
                      <p className="font-medium">{product.warranty}</p>
                    </div>
                  )}
                  {product.deliveryTime && (
                    <div className="space-y-1">
                      <span className="text-gray-500">Delivery Time</span>
                      <p className="font-medium">{product.deliveryTime}</p>
                    </div>
                  )}
                  {product.returnable !== undefined && (
                    <div className="space-y-1">
                      <span className="text-gray-500">Returnable</span>
                      <p className="font-medium">{product.returnable ? "Yes" : "No"}</p>
                    </div>
                  )}
                  {product.codAvailable !== undefined && (
                    <div className="space-y-1">
                      <span className="text-gray-500">COD Available</span>
                      <p className="font-medium">{product.codAvailable ? "Yes" : "No"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Quantity</span>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="h-10 w-10 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-2 font-medium min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setQuantity((q) => Math.min(q + 1, currentStock))
                        }
                        disabled={currentStock <= quantity}
                        className="h-10 w-10 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {canAddProduct ? (
                      <Button
                        className="flex-1 bg-brand-primary hover:bg-brand-primary-dark h-12"
                        disabled={currentStock <= 0 || isItemBeingAdded(product._id, selectedVariant || undefined)}
                        onClick={async () => {
                          try {
                            await addToCart({
                              id: product._id,
                              name: product.name,
                              price: currentPrice,
                              mrp: currentMrp,
                              image: product.image,
                              category: categoryName,
                              brand: brandName,
                              sku: product.sku,
                              quantity,
                              stock: currentStock,
                              warehouse: product.warehouse,
                              variants: variants ? Object.keys(variants) : undefined,
                              variantId: selectedVariant,
                              variantName: selectedVariant && variants && variants[selectedVariant] 
                                ? (variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')) 
                                : undefined,
                              selectedVariant: selectedVariant && variants ? variants[selectedVariant] : undefined,
                            });
                            const variantText = selectedVariant && variants && variants[selectedVariant] 
                              ? ` (${variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')})` 
                              : '';
                        //    toast.success(`${product.name}${variantText} added to cart`);
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
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {isItemBeingAdded(product._id, selectedVariant || undefined) ? 'Adding...' : 'Add to Cart'}
                      </Button>
                    ) : (
                      <Button
                        className="flex-1 h-12"
                        disabled={true}
                        variant="destructive"
                        title={conflictInfo.message}
                      >
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Cannot Add
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-12 w-12 ${
                        isInWishlist(product._id, selectedVariant || undefined)
                          ? "border-red-300 bg-red-50 text-red-500"
                          : "hover:border-red-300 hover:bg-red-50"
                      }`}
                      onClick={() => {
                        // Check if variants exist and none is selected
                        if (variants && Object.keys(variants).length > 0 && !selectedVariant) {
                          toast.error('Please select a variant before adding to wishlist');
                          return;
                        }
                        
                        addToWishlist({
                          id: product._id,
                          name: product.name,
                          price: currentPrice,
                          mrp: currentMrp,
                          image: product.image,
                          category: categoryName,
                          brand: brandName,
                          sku: product.sku,
                          stock: currentStock,
                          warehouse: product.warehouse,
                          // Include variant information
                          variantId: selectedVariant,
                          variantName: selectedVariant && variants && variants[selectedVariant] 
                            ? (variants[selectedVariant].name || selectedVariant.replace(/::/g, ' ')) 
                            : undefined,
                          selectedVariant: selectedVariant && variants ? variants[selectedVariant] : undefined,
                        });
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isInWishlist(product._id, selectedVariant || undefined)
                            ? "text-red-500 fill-red-500"
                            : "text-gray-400"
                        }`}
                      />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <Share2 className="h-5 w-5 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-green-800">
                    <Truck className="h-5 w-5" />
                    Delivery Information
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-green-700">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Fast delivery available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Easy returns policy</span>
                    </div>
                    {product.codAvailable && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Cash on delivery</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Product Description
              </h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                {product.description ? (
                  <p>{product.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Product Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: "SKU", value: product.sku || "—" },
                  { label: "HSN", value: product.hsn || "—" },
                  { label: "Weight", value: product.weight ? `${product.weight} kg` : "—" },
                  {
                    label: "Dimensions",
                    value:
                      product.dimensions &&
                      (product.dimensions.l || product.dimensions.w || product.dimensions.h)
                        ? `${product.dimensions.l || "—"} × ${product.dimensions.w || "—"} × ${product.dimensions.h || "—"}`
                        : "—",
                  },

                  {
                    label: "Tax Rate",
                    value: product.tax && product.tax.rate !== undefined ? `${product.tax.rate}%` : "—",
                  },
                  { label: "Shipping Class", value: product.shippingClass || "—" },
                  {
                    label: "Returnable",
                    value: product.returnable !== undefined ? (product.returnable ? "Yes" : "No") : "—",
                  },
                  {
                    label: "Return Window",
                    value: product.returnWindow ? `${product.returnWindow} days` : "—",
                  },
                  {
                    label: "COD Available",
                    value: product.codAvailable !== undefined ? (product.codAvailable ? "Yes" : "No") : "—",
                  },
                ]
                  .filter((spec) => spec.value !== "—")
                  .map((spec, idx) => (
                    <div key={idx} className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">{spec.label}</dt>
                      <dd className="text-sm text-gray-900">{spec.value}</dd>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Customer Reviews ({displayReviewCount})
                </h2>
                <Button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Write Review
                </Button>
              </div>

              {reviewsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-100 pb-6 last:border-b-0">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center font-semibold text-green-700">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              {review.user.name}
                            </span>
                            {review.verified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Verified Purchase
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-gray-900 mb-2">
                              {review.title}
                            </h4>
                          )}
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {review.comment}
                          </p>
                          
                          {/* Helpful buttons and actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleMarkHelpful(review._id, true)}
                                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>Helpful ({review.helpful || 0})</span>
                                </button>
                                <button
                                  onClick={() => handleMarkHelpful(review._id, false)}
                                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                  <span>Not helpful</span>
                                </button>
                              </div>
                            </div>
                            

                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No reviews yet</p>
                  <Button
                    onClick={() => setIsReviewModalOpen(true)}
                    variant="outline"
                  >
                    Be the first to review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Related Products ({relatedProducts.length})
                  </h2>
                  {product?.category && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const categoryId =
                          typeof product.category === "object" &&
                          product.category !== null &&
                          "_id" in product.category
                            ? (product.category as ProductCategory)._id
                            : product.category;
                        router.push(`/products?category=${categoryId}`);
                      }}
                    >
                      View All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.slice(0, 4).map((relProd) => (
                    <Card
                      key={relProd._id}
                      className="cursor-pointer hover:shadow-lg transition-shadow group"
                      onClick={() => router.push(`/products/${relProd._id}`)}
                    >
                      <div className="relative">
                        <div className="aspect-square relative overflow-hidden">
                          <Image
                            src={relProd.image || "/placeholder.svg"}
                            alt={relProd.name}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform"
                          />
                        </div>
                        {relProd.mrp && relProd.mrp > relProd.price && (
                          <Badge className="absolute top-2 left-2 bg-red-500">
                            {Math.round(((relProd.mrp - relProd.price) / relProd.mrp) * 100)}% OFF
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className={`absolute top-2 right-2 h-8 w-8 ${
                            isInWishlist(relProd._id)
                              ? "border-red-300 bg-red-50 text-red-500"
                              : "bg-white/90"
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
                            className={`h-4 w-4 ${
                              isInWishlist(relProd._id)
                                ? "text-red-500 fill-red-500"
                                : "text-gray-400"
                            }`}
                          />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2" title={relProd.name}>
                          {relProd.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-green-600 font-bold">
                            ₹{relProd.price?.toLocaleString() ?? "—"}
                          </span>
                          {relProd.mrp && relProd.mrp > relProd.price && (
                            <span className="text-gray-400 line-through text-sm">
                              ₹{relProd.mrp.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, j) => (
                            <Star
                              key={j}
                              className={`h-3 w-3 ${
                                relProd.rating && j < Math.round(relProd.rating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            ({relProd.rating ? relProd.rating.toFixed(1) : "—"})
                          </span>
                        </div>
                        {relProd.stock !== undefined && (
                          <Badge
                            variant={relProd.stock > 0 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {relProd.stock > 0 ? "In Stock" : "Out of Stock"}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productId={product._id}
        productName={product.name}
        productImage={product.image}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}