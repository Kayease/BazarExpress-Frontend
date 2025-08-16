"use client"

import { useState, useEffect } from "react"
import { Search, X, Package, Building2, Plus, Minus, Filter, ChevronDown, ChevronUp, Loader2, ArrowRight } from "lucide-react"
import toast from 'react-hot-toast'
import { useAppSelector } from '../lib/store'

// Interfaces
interface Warehouse {
  _id: string;
  name: string;
  address: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  contactPhone: string;
  email: string;
  capacity: number;
  status: 'active' | 'inactive';
}

interface Category {
  _id: string;
  name: string;
  thumbnail?: string;
  showOnHome: boolean;
  hide: boolean;
  sortOrder: number;
  parentId?: string;
  popular?: boolean;
  icon?: string;
  description?: string;
  productCount?: number;
  slug?: string;
  children?: Category[];
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  isPopular: boolean;
  showOnHome: boolean;
  status: "active" | "inactive";
}

interface ProductVariant {
  name: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
  sku?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  image?: string;
  mainImage?: string;
  category: string;
  categoryId: string;
  brand: string;
  brandId: string;
  rating: number;
  reviewCount: number;
  description: string;
  inStock: boolean;
  stock: number; // Changed from stockCount to stock to match API
  sku: string;
  warehouseStock?: {
    [warehouseId: string]: number;
  };
  variants?: {
    [key: string]: ProductVariant;
  };
  attributes?: {
    name: string;
    values: string[];
  }[];
}

interface TransferItem {
  productId: string;
  product: Product;
  quantity: number;
  variantKey?: string; // For variant products
  variantDetails?: ProductVariant; // Variant information
}

interface StockTransferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transferData: {
    fromWarehouse: string;
    toWarehouse: string;
    items: TransferItem[];
    notes?: string;
  }) => Promise<void>;
}

export default function StockTransferModal({
  open,
  onClose,
  onSubmit
}: StockTransferModalProps) {
  // Get user and token from Redux store
  const user = useAppSelector((state: any) => state?.auth?.user)
  const token = useAppSelector((state: any) => state?.auth?.token)
  // State management
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [fromWarehouse, setFromWarehouse] = useState("")
  const [toWarehouse, setToWarehouse] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedParentCategory, setSelectedParentCategory] = useState("")
  const [selectedSubCategory, setSelectedSubCategory] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [parentCategories, setParentCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && user && token) {
      setFromWarehouse("")
      setToWarehouse("")
      setSearchTerm("")
      setSelectedParentCategory("")
      setSelectedSubCategory("")
      setSelectedBrand("")
      setProducts([])
      setTransferItems([])
      setNotes("")
      setPage(1)
      setHasMore(true)
      setExpandedProducts(new Set())
      fetchWarehouses()
      fetchParentCategories()
      fetchBrands()
    }
  }, [open, user, token])

  // Fetch products when warehouse or filters change
  useEffect(() => {
    if (fromWarehouse && user && token) {
      setPage(1)
      setProducts([])
      setHasMore(true)
      fetchProducts(true)
    }
  }, [fromWarehouse, searchTerm, selectedParentCategory, selectedSubCategory, selectedBrand, user, token])

  // Fetch subcategories when parent category changes
  useEffect(() => {
    if (selectedParentCategory) {
      fetchSubCategories(selectedParentCategory)
      setSelectedSubCategory("") // Reset subcategory when parent changes
    } else {
      setSubCategories([])
      setSelectedSubCategory("")
    }
  }, [selectedParentCategory])

  // Fetch warehouses
  const fetchWarehouses = async () => {
    if (!token) {
      console.error('No token available for warehouse fetch')
      return
    }

    setLoadingWarehouses(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch warehouses' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const warehousesData = await response.json()
      console.log('Fetched warehouses in modal:', warehousesData)

      // Ensure we have an array and filter for active warehouses
      const activeWarehouses = Array.isArray(warehousesData)
        ? warehousesData.filter(warehouse => warehouse.status !== 'inactive')
        : []

      setWarehouses(activeWarehouses)
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to fetch warehouses: ${errorMessage}`)
      setWarehouses([])
    } finally {
      setLoadingWarehouses(false)
    }
  }

  // Fetch parent categories (categories without parent)
  const fetchParentCategories = async () => {
    if (!token) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filter for parent categories (those without parentId)
        const parents = data.filter((cat: any) => !cat.parentId)
        setParentCategories(parents)
      }
    } catch (error) {
      console.error('Error fetching parent categories:', error)
    }
  }

  // Fetch subcategories for a parent category
  const fetchSubCategories = async (parentId: string) => {
    if (!token) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/subcategories/${parentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSubCategories(data)
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      setSubCategories([])
    }
  }

  // Fetch brands
  const fetchBrands = async () => {
    if (!token) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  // Fetch products with pagination
  const fetchProducts = async (reset = false) => {
    if (loadingProducts || (!hasMore && !reset)) return

    if (!token) {
      console.error('No token available for products fetch')
      return
    }

    setLoadingProducts(true)
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '20',
        warehouse: fromWarehouse
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedParentCategory) params.append('parentCategory', selectedParentCategory)
      if (selectedSubCategory) params.append('category', selectedSubCategory)
      if (selectedBrand) params.append('brand', selectedBrand)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/paginated?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (reset) {
          setProducts(data.products || [])
          setPage(2)
        } else {
          setProducts(prev => [...prev, ...(data.products || [])])
          setPage(prev => prev + 1)
        }
        // Check if there are more pages
        const currentPage = parseInt(data.page || 1)
        const totalPages = parseInt(data.totalPages || 1)
        setHasMore(currentPage < totalPages)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoadingProducts(false)
    }
  }

  // Handle quantity change for main product or variant
  const handleQuantityChange = (productId: string, quantity: number, variantKey?: string) => {
    const product = products.find(p => p._id === productId)
    if (!product) return

    let maxStock: number
    let variantDetails: ProductVariant | undefined

    if (variantKey && product.variants?.[variantKey]) {
      // For variant products
      variantDetails = product.variants[variantKey]
      maxStock = variantDetails.stock || 0
    } else {
      // For main product
      maxStock = product.stock || 0
    }

    const validQuantity = Math.max(0, Math.min(quantity, maxStock))

    setTransferItems(prev => {
      const itemKey = variantKey ? `${productId}-${variantKey}` : productId
      const existing = prev.find(item => 
        variantKey 
          ? (item.productId === productId && item.variantKey === variantKey)
          : (item.productId === productId && !item.variantKey)
      )
      
      if (existing) {
        if (validQuantity === 0) {
          return prev.filter(item => 
            variantKey 
              ? !(item.productId === productId && item.variantKey === variantKey)
              : !(item.productId === productId && !item.variantKey)
          )
        }
        return prev.map(item =>
          (variantKey 
            ? (item.productId === productId && item.variantKey === variantKey)
            : (item.productId === productId && !item.variantKey))
            ? { ...item, quantity: validQuantity }
            : item
        )
      } else if (validQuantity > 0) {
        return [...prev, { 
          productId, 
          product, 
          quantity: validQuantity,
          variantKey,
          variantDetails
        }]
      }
      return prev
    })
  }

  // Toggle product expansion
  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // Get current quantity for a product/variant
  const getCurrentQuantity = (productId: string, variantKey?: string): number => {
    const item = transferItems.find(item => 
      variantKey 
        ? (item.productId === productId && item.variantKey === variantKey)
        : (item.productId === productId && !item.variantKey)
    )
    return item?.quantity || 0
  }

  // Get total quantity for a product (main + all variants)
  const getTotalProductQuantity = (productId: string): number => {
    return transferItems
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  // Get available warehouses for "to" dropdown
  const availableToWarehouses = warehouses.filter(w =>
    w._id !== fromWarehouse && w.status !== 'inactive'
  )

  // Calculate totals
  const totalItems = transferItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = transferItems.reduce((sum, item) => {
    const price = item.variantDetails ? Number(item.variantDetails.price) || 0 : Number(item.product.price) || 0
    return sum + (price * item.quantity)
  }, 0)

  // Handle form submission
  const handleSubmit = async () => {
    if (!fromWarehouse || !toWarehouse) {
      toast.error('Please select both source and destination warehouses')
      return
    }

    if (transferItems.length === 0) {
      toast.error('Please select at least one product to transfer')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        fromWarehouse,
        toWarehouse,
        items: transferItems,
        notes: notes.trim() || undefined
      })
      toast.success('Stock transfer created successfully')
      onClose()
    } catch (error) {
      console.error('Error creating stock transfer:', error)
      toast.error('Failed to create stock transfer')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null
  // Temporarily disable auth check for testing
  // if (!user || !token) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Create Stock Transfer</h3>
              <p className="text-white/80">Transfer inventory between warehouses</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Warehouse Selection - Fixed */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline w-4 h-4 mr-1" />
                  From Warehouse
                </label>
                <select
                  value={fromWarehouse}
                  onChange={(e) => setFromWarehouse(e.target.value)}
                  disabled={loadingWarehouses}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingWarehouses ? 'Loading warehouses...' : 'Select Source Warehouse'}
                  </option>
                  {warehouses.filter(w => w.status !== 'inactive').map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline w-4 h-4 mr-1" />
                  To Warehouse
                </label>
                <select
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!fromWarehouse || loadingWarehouses}
                >
                  <option value="">
                    {loadingWarehouses ? 'Loading warehouses...' : 'Select Destination Warehouse'}
                  </option>
                  {availableToWarehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transfer Summary */}
            {transferItems.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Items: </span>
                    <span className="font-bold text-brand-primary">{totalItems}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Total Value: </span>
                    <span className="font-bold text-green-600">₹{totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Filters - Always Visible */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
              <div className="flex flex-col space-y-3">
                {/* Search Bar and Filter Button */}
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg border transition-colors ${showFilters
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    title="Toggle filters"
                  >
                    <Filter className="w-5 h-5" />
                  </button>

                  {/* Clear Filters Button */}
                  {(selectedParentCategory || selectedSubCategory || selectedBrand) && (
                    <button
                      onClick={() => {
                        setSelectedParentCategory("")
                        setSelectedSubCategory("")
                        setSelectedBrand("")
                      }}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                      title="Clear all filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                    {/* Parent Category */}
                    <select
                      value={selectedParentCategory}
                      onChange={(e) => setSelectedParentCategory(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="">All Parent Categories</option>
                      {parentCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {/* Sub Category */}
                    <select
                      value={selectedSubCategory}
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                      disabled={!selectedParentCategory}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">All Sub Categories</option>
                      {subCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {/* Brand */}
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="">All Brands</option>
                      {brands.map((brand) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Products List - Scrollable */}
            <div className="overflow-y-auto p-4" style={{ height: '400px' }}>
              {!fromWarehouse ? (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium mb-2">Select a Source Warehouse</p>
                    <p className="text-gray-500">Choose a warehouse from the dropdown above to view available products</p>
                  </div>
                </div>
              ) : loadingProducts && products.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary mr-2" />
                  <span className="text-gray-600">Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No products found in this warehouse</p>
                  <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => {
                    const hasVariants = product.variants && Object.keys(product.variants).length > 0
                    const isExpanded = expandedProducts.has(product._id)
                    const totalProductQuantity = getTotalProductQuantity(product._id)
                    const mainProductQuantity = getCurrentQuantity(product._id)
                    const warehouseStock = product.stock || 0

                    return (
                      <div key={product._id}>
                        {/* Main Product Row */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-4">
                            {/* Product Image */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {(product.images?.[0] || product.image || product.mainImage) ? (
                                <img
                                  src={product.images?.[0] || product.image || product.mainImage}
                                  alt={product.name}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-medium text-gray-900">{product.name}</h5>
                                {hasVariants && (
                                  <button
                                    onClick={() => toggleProductExpansion(product._id)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title={isExpanded ? "Hide variants" : "Show variants"}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>SKU: {product.sku}</span>
                                <span>Brand: {typeof product.brand === 'object' ? (product.brand as any)?.name : product.brand}</span>
                                {!hasVariants && (
                                  <span className={`font-medium ${warehouseStock === 0 ? 'text-red-600' :
                                    warehouseStock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                    Available: {warehouseStock} units
                                    {warehouseStock === 0 && ' (Out of Stock)'}
                                    {warehouseStock > 0 && warehouseStock < 10 && ' (Low Stock)'}
                                  </span>
                                )}
                                {hasVariants && (
                                  <span className="font-medium text-blue-600">
                                    {product.variants ? Object.keys(product.variants).length : 0} variants available
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-medium text-green-600 mt-1">
                                ₹{(Number(product.price) || 0).toFixed(2)}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3">
                              {hasVariants ? (
                                // Show total quantity for variant products
                                <div className="text-center">
                                  <div className="text-sm text-gray-500 mb-1">Total Selected</div>
                                  <div className="w-16 text-center border border-gray-300 rounded px-2 py-1 bg-gray-50 font-medium">
                                    {totalProductQuantity}
                                  </div>
                                </div>
                              ) : (
                                // Regular quantity controls for non-variant products
                                <>
                                  <button
                                    onClick={() => handleQuantityChange(product._id, mainProductQuantity - 1)}
                                    disabled={mainProductQuantity === 0 || warehouseStock === 0}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max={warehouseStock}
                                      value={mainProductQuantity}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0
                                        if (value <= warehouseStock) {
                                          handleQuantityChange(product._id, value)
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const value = parseInt(e.target.value) || 0
                                        if (value > warehouseStock) {
                                          handleQuantityChange(product._id, warehouseStock)
                                        }
                                      }}
                                      disabled={warehouseStock === 0}
                                      className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleQuantityChange(product._id, mainProductQuantity + 1)}
                                    disabled={mainProductQuantity >= warehouseStock || warehouseStock === 0}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Variants Section */}
                        {hasVariants && isExpanded && product.variants && (
                          <div className="ml-4 mt-2 space-y-2">
                            {Object.entries(product.variants).map(([variantKey, variant]) => {
                              const variantQuantity = getCurrentQuantity(product._id, variantKey)
                              const variantStock = variant.stock || 0
                              
                              return (
                                <div
                                  key={variantKey}
                                  className="bg-gray-50 rounded-lg border border-gray-200 p-3"
                                >
                                  <div className="flex items-center space-x-4">
                                    {/* Variant Image */}
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                      {variant.images?.[0] ? (
                                        <img
                                          src={variant.images[0]}
                                          alt={variant.name}
                                          className="object-cover w-full h-full"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Package className="w-4 h-4 text-gray-400" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Variant Info */}
                                    <div className="flex-1">
                                      <h6 className="font-medium text-gray-800 text-sm">{variant.name}</h6>
                                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                        {variant.sku && <span>SKU: {variant.sku}</span>}
                                        <span className={`font-medium ${variantStock === 0 ? 'text-red-600' :
                                          variantStock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                          Available: {variantStock} units
                                          {variantStock === 0 && ' (Out of Stock)'}
                                          {variantStock > 0 && variantStock < 10 && ' (Low Stock)'}
                                        </span>
                                      </div>
                                      <div className="text-xs font-medium text-green-600 mt-1">
                                        ₹{(Number(variant.price) || 0).toFixed(2)}
                                      </div>
                                    </div>

                                    {/* Variant Quantity Controls */}
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleQuantityChange(product._id, variantQuantity - 1, variantKey)}
                                        disabled={variantQuantity === 0 || variantStock === 0}
                                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <div className="flex items-center justify-center">
                                        <input
                                          type="number"
                                          min="0"
                                          max={variantStock}
                                          value={variantQuantity}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value) || 0
                                            if (value <= variantStock) {
                                              handleQuantityChange(product._id, value, variantKey)
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const value = parseInt(e.target.value) || 0
                                            if (value > variantStock) {
                                              handleQuantityChange(product._id, variantStock, variantKey)
                                            }
                                          }}
                                          disabled={variantStock === 0}
                                          className="w-12 text-center border border-gray-300 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleQuantityChange(product._id, variantQuantity + 1, variantKey)}
                                        disabled={variantQuantity >= variantStock || variantStock === 0}
                                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center py-4">
                      <button
                        onClick={() => fetchProducts()}
                        disabled={loadingProducts}
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                      >
                        {loadingProducts ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Load More Products</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes for this transfer..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!fromWarehouse || !toWarehouse || transferItems.length === 0 || submitting}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Transfer...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Create Stock Transfer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}