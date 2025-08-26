
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';

interface Product {
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
  brand?: any;
  category?: any;
  tax?: any;
  priceIncludesTax?: boolean;
  weight?: number;
  dimensions?: any;
  deliveryTime?: string;
  shippingClass?: string;
  returnable?: boolean;
  returnWindow?: number;
  codAvailable?: boolean;
  galleryImages?: string[];
  locationName?: string;
  attributes?: any[];
  rating?: number;
  warehouse?: any;
  manufacturer?: string;
  warranty?: string;
  variants?: any;
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

interface UseProductOptimizedReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  reviews: ProductReview[];
  reviewsLoading: boolean;
  relatedProducts: Product[];
  relatedProductsLoading: boolean;
  refreshProduct: () => void;
  refreshReviews: () => void;
  refreshRelatedProducts: () => void;
}

// Simple in-memory cache for products
const productCache = new Map<string, { data: Product; timestamp: number }>();
const reviewsCache = new Map<string, { data: ProductReview[]; timestamp: number }>();
const relatedProductsCache = new Map<string, { data: Product[]; timestamp: number }>();

// Clear any existing cache to prevent format issues
reviewsCache.clear();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProductOptimized = (): UseProductOptimizedReturn => {
  const params = useParams();
  const productId = params?.id as string;
  
  console.log('🎯 useProductOptimized hook initialized with productId:', productId);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);

  // Check if cached data is still valid
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  // Fetch product data with caching
  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    console.log('🔍 Fetching product:', productId);

    // Check cache first
    const cached = productCache.get(productId);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('✅ Using cached product data');
      setProduct(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const APIURL = process.env.NEXT_PUBLIC_API_URL;
      console.log('🌐 API URL:', APIURL);
      const response = await fetch(`${APIURL}/products/${productId}`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
      
      const productData = await response.json();
      console.log('📦 Product data received:', productData);
      
      // Cache the product data
      productCache.set(productId, { data: productData, timestamp: Date.now() });
      
      setProduct(productData);
    } catch (err) {
      console.error('❌ Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [productId, isCacheValid]);

  // Fetch reviews with caching
  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    // Check cache first
    const cached = reviewsCache.get(productId);
    if (cached && isCacheValid(cached.timestamp)) {
      // Ensure cached data is an array (handle old cache format)
      const cachedReviews = Array.isArray(cached.data) ? cached.data : [];
      setReviews(cachedReviews);
      return;
    }

    try {
      setReviewsLoading(true);
      
      const APIURL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${APIURL}/reviews/product/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const reviewsData = await response.json();
      console.log('📝 Reviews API response:', reviewsData);
      
      // Extract just the reviews array from the API response
      const reviewsArray = reviewsData.reviews || [];
      console.log('📝 Extracted reviews array:', reviewsArray);
      
      // Cache the reviews data
      reviewsCache.set(productId, { data: reviewsArray, timestamp: Date.now() });
      
      setReviews(reviewsArray);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId, isCacheValid]);

  // Fetch related products with caching
  const fetchRelatedProducts = useCallback(async () => {
    if (!productId || !product?.category) return;

    const categoryId = typeof product.category === 'object' ? product.category._id : product.category;
    const warehouseId = product.warehouse?._id || 'no-warehouse';
    const cacheKey = `${productId}_${categoryId}_${warehouseId}`;

    // Check cache first
    const cached = relatedProductsCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      setRelatedProducts(cached.data);
      return;
    }

    try {
      setRelatedProductsLoading(true);
      
      const APIURL = process.env.NEXT_PUBLIC_API_URL;
      
      // Get location state from localStorage since we can't access the useLocation hook here
      let locationState = null;
      let isGlobalMode = false;
      
      try {
        const storedLocation = localStorage.getItem('locationState');
        if (storedLocation) {
          locationState = JSON.parse(storedLocation);
          isGlobalMode = locationState?.isGlobalMode || false;
        }
      } catch (e) {
        console.log('No location state found, using fallback');
      }

      let relatedData;
      
      // Use location-aware API if location is detected
      if (locationState?.pincode && locationState?.isLocationDetected) {
        const mode = isGlobalMode ? 'global' : 'auto';
        const response = await fetch(`${APIURL}/warehouses/products-by-pincode?pincode=${locationState.pincode}&category=${categoryId}&limit=20&mode=${mode}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch location-aware related products');
        }
        
        const locationResponse = await response.json();
        relatedData = locationResponse.success ? locationResponse.products : [];
      } else {
        // Fallback to global products if no location detected
        const response = await fetch(`${APIURL}/products/public?category=${categoryId}&limit=20`);
        if (!response.ok) {
          throw new Error('Failed to fetch related products');
        }
        relatedData = await response.json();
      }
      
      // Filter to only show products from the same warehouse as the current product
      let filteredRelatedProducts = Array.isArray(relatedData) 
        ? relatedData.filter((p: Product) => {
            // Skip the current product
            if (p._id === productId) return false;
            
            // If current product has a warehouse, only show products from the same warehouse
            if (product.warehouse && p.warehouse) {
              return p.warehouse._id === product.warehouse._id;
            }
            
            // If no warehouse info, show the product (fallback)
            return true;
          })
        : [];
      
      // Limit to 8 products
      filteredRelatedProducts = filteredRelatedProducts.slice(0, 8);
      
      // Cache the related products data
      relatedProductsCache.set(cacheKey, { data: filteredRelatedProducts, timestamp: Date.now() });
      
      setRelatedProducts(filteredRelatedProducts);
    } catch (err) {
      console.error('Failed to fetch related products:', err);
    } finally {
      setRelatedProductsLoading(false);
    }
  }, [productId, product?.category, product?.warehouse, isCacheValid]);

  // Memoized refresh functions
  const refreshProduct = useCallback(() => {
    if (productId) {
      productCache.delete(productId);
      fetchProduct();
    }
  }, [productId, fetchProduct]);

  const refreshReviews = useCallback(() => {
    if (productId) {
      reviewsCache.delete(productId);
      fetchReviews();
    }
  }, [productId, fetchReviews]);

  const refreshRelatedProducts = useCallback(() => {
    if (productId && product?.category) {
      const categoryId = typeof product.category === 'object' ? product.category._id : product.category;
      const warehouseId = product.warehouse?._id || 'no-warehouse';
      const cacheKey = `${productId}_${categoryId}_${warehouseId}`;
      relatedProductsCache.delete(cacheKey);
      fetchRelatedProducts();
    }
  }, [productId, product?.category, product?.warehouse, fetchRelatedProducts]);

  // Fetch product on mount and when productId changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - productId:', productId);
    fetchProduct();
  }, [fetchProduct]);

  // Fetch reviews after product is loaded
  useEffect(() => {
    if (product) {
      fetchReviews();
    }
  }, [product, fetchReviews]);

  // Fetch related products after product and reviews are loaded
  useEffect(() => {
    if (product && !reviewsLoading) {
      fetchRelatedProducts();
    }
  }, [product, reviewsLoading, product?.warehouse, fetchRelatedProducts]);

  // Memoized return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    product,
    loading,
    error,
    reviews,
    reviewsLoading,
    relatedProducts,
    relatedProductsLoading,
    refreshProduct,
    refreshReviews,
    refreshRelatedProducts,
  }), [
    product,
    loading,
    error,
    reviews,
    reviewsLoading,
    relatedProducts,
    relatedProductsLoading,
    refreshProduct,
    refreshReviews,
    refreshRelatedProducts,
  ]);

  return returnValue;
};
