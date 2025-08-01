"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Search, 
  Filter, 
  ShoppingCart, 
  Truck, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Package,
  Store
} from 'lucide-react';
import { useLocation } from '@/components/LocationProvider';
import { 
  getProductsByLocation, 
  LocationProductsResponse, 
  ProductWithDelivery,
  formatDistance,
  formatDuration
} from '@/lib/location';
import { useCartContext, useWishlistContext } from '@/components/app-provider';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface LocationBasedProductsProps {
  categoryId?: string;
  searchQuery?: string;
  pincode?: string | null;
}


export function LocationBasedProducts({ 
  categoryId, 
  searchQuery,
  pincode
}: LocationBasedProductsProps) {
  const { 
    selectedLocation, 
    locationName, 
    deliveryAvailable, 
    availableWarehouses,
    setShowLocationModal,
  } = useLocation();
  
  const { addToCart } = useCartContext();
  const { addToWishlist, isInWishlist } = useWishlistContext();

  // Product states
  const [products, setProducts] = useState<ProductWithDelivery[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const productsPerPage = 12;
  
  // Filters
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Load products when location or filters change
  useEffect(() => {
    // If pincode prop is given, treat as location detected
    if ((pincode || selectedLocation) && deliveryAvailable) {
      loadProducts();
    } else {
      setProducts([]);
      setTotalProducts(0);
    }

  }, [pincode, selectedLocation, deliveryAvailable, categoryId, currentPage, selectedWarehouse, sortBy]);

  // Load products from API
  const loadProducts = async () => {
    // Use pincode prop if provided, else selectedLocation
    let locationArg = selectedLocation;
    if (pincode) {
      // Build a minimal location object for compatibility
      locationArg = { pincode } as any;
    }

    if (!locationArg) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getProductsByLocation(locationArg, {
        category: categoryId,
        search: localSearchQuery || searchQuery,
        page: currentPage,
        limit: productsPerPage
      });

      if (response.success && response.deliveryAvailable) {
        let filteredProducts = response.products;

        // Filter by warehouse if selected
        if (selectedWarehouse !== 'all') {
          filteredProducts = response.products.filter(
            product => product.warehouseId._id === selectedWarehouse
          );
        }


        // Sort products
        filteredProducts.sort((a, b) => {
          switch (sortBy) {
            case 'price-low':
              return a.price - b.price;
            case 'price-high':
              return b.price - a.price;
            case 'distance':
              return (a.deliveryInfo?.distance || 999) - (b.deliveryInfo?.distance || 999);
            case 'name':
            default:
              return a.name.localeCompare(b.name);
          }

        });

        setProducts(filteredProducts);
        setTotalProducts(response.totalProducts);
        setTotalPages(response.pagination.pages);
      } else {
        setProducts([]);
        setTotalProducts(0);
        setError(response.message || 'No products available for delivery');
      }

    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please try again.');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setIsLoading(false);
    }

  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadProducts();
  };

  // Handle add to cart
  const handleAddToCart = (product: ProductWithDelivery) => {
    try {
      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        warehouseId: product.warehouseId._id,
        warehouseName: product.warehouseId.name
      });
      
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }

  };

  // No location selected
  if (!selectedLocation) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Select Your Location
        </h3>
        <p className="text-gray-600 mb-6">
          Choose your delivery location to see available products
        </p>
        <Button 
          onClick={() => setShowLocationModal(true)}

          className="bg-green-600 hover:bg-green-700"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Select Location
        </Button>
      </div>
    );
  }


  // No delivery available
  if (!deliveryAvailable) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Delivery Available
        </h3>
        <p className="text-gray-600 mb-2">
          We don't deliver to your selected location yet.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Location: {locationName}

        </p>
        <Button 
          onClick={() => setShowLocationModal(true)}

          variant="outline"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Change Location
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Location Header */}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Delivering to: {locationName}

              </p>
              <p className="text-sm text-green-600">
                {availableWarehouses.length} warehouse(s) available
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowLocationModal(true)}

            variant="outline"
            size="sm"
          >
            Change
          </Button>
        </div>
      </div>

      {/* Search and Filters */}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}

        <div className="flex-1">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={localSearchQuery}

                onChange={(e) => setLocalSearchQuery(e.target.value)}

                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}

                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <Button onClick={handleSearch} size="sm">
              Search
            </Button>
          </div>
        </div>

        {/* Warehouse Filter */}

        <div className="lg:w-48">
          <select
            value={selectedWarehouse}

            onChange={(e) => setSelectedWarehouse(e.target.value)}

            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Warehouses</option>
            {availableWarehouses.map((warehouse) => (
              <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                {warehouse.warehouseName} ({formatDistance(warehouse.distance)})
              </option>
            ))}

          </select>
        </div>

        {/* Sort */}

        <div className="lg:w-40">
          <select
            value={sortBy}

            onChange={(e) => setSortBy(e.target.value)}

            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="name">Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="distance">Distance</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {isLoading ? 'Loading...' : `${totalProducts} products available for delivery`}
        </p>
        
        {availableWarehouses.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Store className="h-4 w-4" />
            <span>From {availableWarehouses.length} warehouse(s)</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadProducts} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.deliveryInfo?.isFreeDeliveryZone && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Free Delivery
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-green-600">
                    ₹{product.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </span>
                </div>

                {/* Delivery Info */}
                {product.deliveryInfo && (
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Store className="h-3 w-3" />
                      <span>{product.deliveryInfo.warehouseName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="h-3 w-3" />
                      <span>{formatDistance(product.deliveryInfo.distance)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(product.deliveryInfo.duration)} delivery</span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <Button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Products */}
      {!isLoading && !error && products.length === 0 && totalProducts === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Products Found
          </h3>
          <p className="text-gray-600 mb-6">
            No products are available for delivery to your location.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => setShowLocationModal(true)}
              variant="outline"
            >
              Try Different Location
            </Button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}