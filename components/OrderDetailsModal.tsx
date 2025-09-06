"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Package, Truck, CheckCircle, X, RefreshCw, Loader2, Calendar, CreditCard, MapPin, User, Warehouse, Download, FileText } from "lucide-react"
import toast from 'react-hot-toast'
import WarehousePickingModal from './WarehousePickingModal'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  categoryId?: string | { _id: string; name: string }
  brand?: string
  brandId?: string | { _id: string; name: string }
  locationName?: string // Product location in warehouse
  // Variant information
  variantId?: string
  variantName?: string
  selectedVariant?: any
}

interface Order {
  _id: string
  orderId: string
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  createdAt: string
  pricing: {
    total: number
    subtotal: number
    taxAmount: number
    discountAmount: number
    deliveryCharge: number
    codCharge: number
  }
  items: OrderItem[]
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  deliveryInfo: {
    address: {
      building: string
      area: string
      city: string
      state: string
      pincode: string
      landmark?: string
    }
    estimatedDeliveryTime?: string
  }
  paymentInfo: {
    method: 'cod' | 'online'
    paymentMethod: string
    status: string
  }
  warehouseInfo: {
    warehouseName: string
    warehouseId: string
  }
  assignedDeliveryBoy?: {
    id: string
    name: string
    phone: string
  }
  tracking?: {
    trackingNumber?: string
    carrier?: string
  }
}

interface DeliveryBoy {
  id: string
  name: string
  phone: string
  assignedWarehouses: string[]
  assignedWarehouseIds?: string[]
}

interface User {
  id?: string
  role?: string
  assignedWarehouses?: string[]
}

interface OrderDetailsModalProps {
  viewing: Order | null
  onClose: () => void
  user: User | null
  token: string
  deliveryBoys: DeliveryBoy[]
  onOrderUpdate: (updatedOrder: Order) => void
  onRefreshOrders?: () => void
  // Status management props
  status: string
  setStatus: (status: string) => void
  selectedDeliveryBoy: string
  setSelectedDeliveryBoy: (id: string) => void
  // OTP props
  showOtpInput: boolean
  setShowOtpInput: (show: boolean) => void
  otpDigits: string[]
  setOtpDigits: (digits: string[]) => void
  // Loading states
  updating: boolean
  setUpdating: (updating: boolean) => void
  generatingOtp: boolean | string | null
  setGeneratingOtp: (generating: boolean | string | null) => void
  assigningDeliveryBoy?: boolean
  setAssigningDeliveryBoy?: (assigning: boolean) => void
  // Custom functions for different implementations
  updateStatus?: () => Promise<void>
  verifyDeliveryOtp?: () => Promise<void>
  assignDeliveryBoy?: () => Promise<void>
  // OTP handler functions
  handleOtpChange?: (index: number, value: string) => void
  handleOtpKeyDown?: (index: number, e: React.KeyboardEvent) => void
  // Status options function
  getAvailableStatusOptions?: (currentStatus: string, userRole: string) => string[]
}

const statusConfig = {
  new: { icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
  processing: { icon: Package, color: "text-yellow-600", bg: "bg-yellow-100" },
  shipped: { icon: Truck, color: "text-purple-600", bg: "bg-purple-100" },
  delivered: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  cancelled: { icon: X, color: "text-red-600", bg: "bg-red-100" },
  refunded: { icon: RefreshCw, color: "text-gray-600", bg: "bg-gray-100" },
  pending: { icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
  prepaid: { icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
  paid: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
}

// Default status options function
const defaultGetAvailableStatusOptions = (currentStatus: string, userRole: string): string[] => {
  if (userRole === 'customer_support_executive') {
    return [currentStatus] // Customer support can't change status
  }
  
  if (userRole === 'admin') {
    return ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  }
  
  if (userRole === 'order_warehouse_management') {
    // Warehouse managers can change to delivered, cancelled, refunded
    return [currentStatus, 'delivered', 'cancelled', 'refunded'].filter((status, index, arr) => arr.indexOf(status) === index)
  }
  
  if (userRole === 'delivery_boy') {
    // Delivery Agents can only mark as delivered
    return currentStatus === 'shipped' ? [currentStatus, 'delivered'] : [currentStatus]
  }
  
  return [currentStatus]
}

export default function OrderDetailsModal({
  viewing,
  onClose,
  user,
  token,
  deliveryBoys,
  onOrderUpdate,
  onRefreshOrders,
  status,
  setStatus,
  selectedDeliveryBoy,
  setSelectedDeliveryBoy,
  showOtpInput,
  setShowOtpInput,
  otpDigits,
  setOtpDigits,
  updating,
  setUpdating,
  generatingOtp,
  setGeneratingOtp,
  assigningDeliveryBoy,
  setAssigningDeliveryBoy,
  updateStatus,
  verifyDeliveryOtp,
  assignDeliveryBoy,
  handleOtpChange: propHandleOtpChange,
  handleOtpKeyDown: propHandleOtpKeyDown,
  getAvailableStatusOptions = defaultGetAvailableStatusOptions
}: OrderDetailsModalProps) {
  
  // State for picking modal
  const [pickingModalOrder, setPickingModalOrder] = useState<Order | null>(null)
  // State for enhanced order data with variant information
  const [enhancedOrder, setEnhancedOrder] = useState<Order | null>(null)
  
  // Effect to enhance order data when viewing changes
  useEffect(() => {
    const enhanceOrderData = async () => {
      if (!viewing) {
        setEnhancedOrder(null)
        return
      }
      
      try {
        // Use the same function that works for the picking modal
        console.log('OrderDetailsModal: Enhancing order data for:', viewing.orderId)
        const orderWithLocations = await fetchOrderWithProductLocations(viewing, token)
        console.log('OrderDetailsModal: Enhanced order data:', orderWithLocations)
        setEnhancedOrder(orderWithLocations)
      } catch (error) {
        console.error('Error enhancing order data:', error)
        // Fallback to original order if enhancement fails
        setEnhancedOrder(viewing)
      }
    }
    
    enhanceOrderData()
  }, [viewing, token])
  
  // Function to handle opening picking modal
  const handleOpenPickingModal = async () => {
    if (!viewing) return
    
    try {
      // Fetch product details with locations if needed
      const orderWithLocations = await fetchOrderWithProductLocations(viewing, token)
      setPickingModalOrder(orderWithLocations)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Failed to load order details')
    }
  }
  
  // Function to fetch order with product location details
  const fetchOrderWithProductLocations = async (order: Order, token: string): Promise<Order> => {
    try {
      // Fetch product details for each item to get location information
      const itemsWithLocations = await Promise.all(
        order.items.map(async (item) => {
          try {
            // Use the backend API URL
            const response = await fetch(`http://localhost:4000/api/products/${item.productId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              const productData = await response.json()
              console.log(`OrderDetailsModal: Product data for ${item.productId}:`, productData)
              console.log(`OrderDetailsModal: Original item data:`, item)
              const enhancedItem = {
                ...item,
                locationName: productData.locationName || 'Location not specified',
                // Preserve and enhance variant information
                variantName: item.variantName || productData.variantName || null,
                selectedVariant: item.selectedVariant || null
              }
              console.log(`OrderDetailsModal: Enhanced item:`, enhancedItem)
              return enhancedItem
            }
            return {
              ...item,
              locationName: 'Location not specified',
              // Preserve variant information even if product fetch fails
              variantName: item.variantName || null,
              selectedVariant: item.selectedVariant || null
            }
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error)
            return {
              ...item,
              locationName: 'Location not specified',
              // Preserve variant information even if product fetch fails
              variantName: item.variantName || null,
              selectedVariant: item.selectedVariant || null
            }
          }
        })
      )
      
      return {
        ...order,
        items: itemsWithLocations
      }
    } catch (error) {
      console.error('Error fetching product locations:', error)
      return order
    }
  }
  
  // Handle OTP input changes - use passed function or default
  const handleOtpChange = propHandleOtpChange || ((index: number, value: string) => {
    if (value.length > 1) return
    
    const newOtp = [...otpDigits]
    newOtp[index] = value
    setOtpDigits(newOtp)
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  })

  const handleOtpKeyDown = propHandleOtpKeyDown || ((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  })

  // Default update status function if not provided
  const defaultUpdateStatus = async () => {
    if (!viewing || !status || !updateStatus) return
    await updateStatus()
  }

  // Default verify OTP function if not provided
  const defaultVerifyDeliveryOtp = async () => {
    if (!viewing || !verifyDeliveryOtp) return
    await verifyDeliveryOtp()
  }

  // Default assign delivery Agent function if not provided
  const defaultAssignDeliveryBoy = async () => {
    if (!viewing || !selectedDeliveryBoy || !assignDeliveryBoy) return
    await assignDeliveryBoy()
  }

  if (!viewing) return null

  // Use enhanced order data if available, otherwise fallback to viewing
  const displayOrder = enhancedOrder || viewing
  
  // Debug: Log the data to see what's available
  console.log('OrderDetailsModal Debug:', {
    viewing: viewing,
    enhancedOrder: enhancedOrder,
    displayOrder: displayOrder,
    firstItem: displayOrder?.items?.[0]
  })

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Order Details</h3>
              <p className="text-white/80">#{displayOrder.orderId}</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Download Invoice Button - Only for warehouse managers and admins */}
              {(user?.role === 'order_warehouse_management' || user?.role === 'admin') && (
                <button
                  onClick={handleOpenPickingModal}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                  title="Generate Warehouse Picking List"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Picking List</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Status and Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                {(() => {
                  const StatusIcon = statusConfig[displayOrder.status as keyof typeof statusConfig].icon;
                  return <StatusIcon className="w-4 h-4 text-brand-primary" />;
                })()}
                <span className="text-sm font-medium text-gray-600">Order Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig[displayOrder.status as keyof typeof statusConfig].bg} ${statusConfig[displayOrder.status as keyof typeof statusConfig].color}`}>
                {displayOrder.status.charAt(0).toUpperCase() + displayOrder.status.slice(1)}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Order Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(displayOrder.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Payment</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {displayOrder.paymentInfo?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Warehouse className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Warehouse</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {displayOrder.warehouseInfo.warehouseName}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold text-gray-900">Delivery Address</h4>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium">{displayOrder.customerInfo.name}</p>
              {displayOrder.deliveryInfo.address.building && <p>{displayOrder.deliveryInfo.address.building}</p>}
              <p>{displayOrder.deliveryInfo.address.area}</p>
              <p>{displayOrder.deliveryInfo.address.city}, {displayOrder.deliveryInfo.address.state} - {displayOrder.deliveryInfo.address.pincode}</p>
              {displayOrder.deliveryInfo.address.landmark && (
                <p className="text-gray-500">Near {displayOrder.deliveryInfo.address.landmark}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          {displayOrder.items && displayOrder.items.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 text-brand-primary mr-2" />
                Order Items ({displayOrder.items.length})
              </h4>
              <div className="space-y-3">
                {displayOrder.items.map((item: OrderItem, index: number) => (
                  <div key={`${item.productId}-${index}`} className="flex items-center p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 ml-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        {item.name}
                      </h5>
                      
                      {/* Enhanced Variant Display */}
                      {(() => {
                        // Enhanced variant name extraction with debugging
                        let variantName = null
                        
                        // Debug: Log item data to understand structure
                        console.log('OrderDetailsModal - Item variant data:', {
                          productId: item.productId,
                          variantId: item.variantId,
                          variantName: item.variantName,
                          selectedVariant: item.selectedVariant,
                          itemName: item.name
                        })
                        
                        // Priority order for variant name extraction:
                        // 1. Direct variantName field (most reliable)
                        if (item.variantName) {
                          variantName = item.variantName
                          console.log('OrderDetailsModal - Using direct variantName:', variantName)
                        } 
                        // 2. selectedVariant.name if selectedVariant is an object
                        else if (item.selectedVariant && typeof item.selectedVariant === 'object' && item.selectedVariant.name) {
                          variantName = item.selectedVariant.name
                          console.log('OrderDetailsModal - Using selectedVariant.name:', variantName)
                        } 
                        // 3. selectedVariant as string if it's a string
                        else if (item.selectedVariant && typeof item.selectedVariant === 'string') {
                          variantName = item.selectedVariant
                          console.log('OrderDetailsModal - Using selectedVariant as string:', variantName)
                        } 
                        // 4. Look up variant in productId.variants array using variantId
                        else if (item.variantId && typeof item.productId === 'object' && (item.productId as any).variants) {
                          const variant = (item.productId as any).variants.find((v: any) => v._id === item.variantId || v.id === item.variantId)
                          if (variant && variant.name) {
                            variantName = variant.name
                            console.log('OrderDetailsModal - Found variant in product variants:', variantName)
                          }
                        }
                        // 5. Fallback: Extract from product name if it contains variant info
                        else if (item.name && item.name.includes('(') && item.name.includes(')')) {
                          const match = item.name.match(/\(([^)]+)\)/)
                          if (match && match[1]) {
                            variantName = match[1]
                            console.log('OrderDetailsModal - Extracted from product name:', variantName)
                          }
                        }
                        
                        console.log('OrderDetailsModal - Final variant name:', variantName)
                        
                        return variantName ? (
                          <div className="mb-2">
                            <div className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
                              <div className="w-2 h-2 bg-white rounded-full mr-2 opacity-80"></div>
                              {variantName}
                            </div>
                          </div>
                        ) : null
                      })()}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-1">
                        <span>Qty: {item.quantity}</span>
                        {item.brandId && (
                          <span>
                            Brand: {typeof item.brandId === 'object' ? item.brandId.name : (typeof item.brandId === 'string' && item.brandId.length > 20 ? 'Loading...' : item.brandId)}
                          </span>
                        )}
                        {item.categoryId && (
                          <span>
                            Category: {typeof item.categoryId === 'object' ? item.categoryId.name : (typeof item.categoryId === 'string' && item.categoryId.length > 20 ? 'Loading...' : item.categoryId)}
                          </span>
                        )}
                      </div>
                      {/* Warehouse Location - Only visible to warehouse managers and admins */}
                      {(user?.role === 'order_warehouse_management' || user?.role === 'admin') && item.locationName && (
                        <div className="flex items-center space-x-1 text-xs">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-600 font-medium">Location: {item.locationName}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Info */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{item.price.toFixed(2)} x {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 text-brand-primary mr-2" />
              Order Summary
            </h4>
            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">₹{(displayOrder.pricing.subtotal || displayOrder.pricing.total).toFixed(2)}</span>
              </div>

              {/* Discount Applied */}
              {(displayOrder.pricing.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount Applied</span>
                  <span className="text-green-600 font-medium">-₹{(displayOrder.pricing.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {/* Tax */}
              {(displayOrder.pricing.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">₹{(displayOrder.pricing.taxAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {/* Delivery Charges */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Charges</span>
                <span className={`font-medium ${(displayOrder.pricing.deliveryCharge || 0) === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {(displayOrder.pricing.deliveryCharge || 0) === 0 ? 'FREE' : `₹${(displayOrder.pricing.deliveryCharge || 0).toFixed(2)}`}
                </span>
              </div>

              {/* COD Charges */}
              {(displayOrder.pricing.codCharge || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">COD Charges</span>
                  <span className="text-gray-900 font-medium">₹{(displayOrder.pricing.codCharge || 0).toFixed(2)}</span>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-600">₹{Math.ceil(displayOrder.pricing.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <User className="w-5 h-5 text-brand-primary" />
                <h4 className="font-semibold text-gray-900">Customer Information</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{displayOrder.customerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{displayOrder.customerInfo.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{displayOrder.customerInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Warehouse:</span>
                  <span className="font-medium text-gray-900">{displayOrder.warehouseInfo.warehouseName}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard className="w-5 h-5 text-brand-primary" />
                <h4 className="font-semibold text-gray-900">Payment Information</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium text-gray-900">
                    {displayOrder.paymentInfo?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Type:</span>
                  <span className="font-medium text-gray-900">{displayOrder.paymentInfo?.paymentMethod?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${displayOrder.paymentInfo?.status === 'paid' ? 'text-green-600' : displayOrder.paymentInfo?.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {displayOrder.paymentInfo?.status?.charAt(0).toUpperCase() + displayOrder.paymentInfo?.status?.slice(1) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-lg text-gray-900">₹{Math.ceil(displayOrder.pricing.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <RefreshCw className="w-5 h-5 text-brand-primary mr-2" />
              Update Order Status
            </h4>
            <div className="space-y-4">
              <select
                className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent ${user?.role === 'customer_support_executive'
                    ? 'bg-gray-100 cursor-not-allowed opacity-60'
                    : ''
                  }`}
                value={status}
                onChange={e => setStatus(e.target.value)}
                disabled={user?.role === 'customer_support_executive'}
                title={user?.role === 'customer_support_executive' ? 'Customer Support Executive cannot change order status' : ''}
              >
                {getAvailableStatusOptions(viewing?.status || '', user?.role || '').map(opt => (
                  <option key={`status-${opt}`} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
              
              {/* Delivery agent Selection - Only when status is being changed to shipped */}
              {status === 'shipped' && user?.role !== 'customer_support_executive' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Delivery Agent <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    value={selectedDeliveryBoy} 
                    onChange={e => setSelectedDeliveryBoy(e.target.value)}
                    disabled={assigningDeliveryBoy}
                  >
                    <option key="default-option" value="">Choose a delivery agent...</option>
                    {deliveryBoys
                      .filter(db => {
                        const assignedWarehouses = db.assignedWarehouses || db.assignedWarehouseIds || [];
                        const warehouseId = viewing?.warehouseInfo?.warehouseId || '';
                        return Array.isArray(assignedWarehouses) && assignedWarehouses.some(id => {
                          if (typeof id === 'string') {
                            return id === warehouseId;
                          } else if (typeof id === 'object' && id !== null) {
                            return (id as any)._id === warehouseId || (id as any).id === warehouseId;
                          }
                          return false;
                        });
                      })
                      .map((deliveryBoy, index) => {
                        const deliveryBoyId = deliveryBoy.id || (deliveryBoy as any)._id;
                        return (
                          <option 
                            key={deliveryBoyId ? `delivery-boy-${deliveryBoyId}` : `delivery-boy-index-${index}`} 
                            value={deliveryBoyId || ""}
                          >
                            {deliveryBoy.name} - {deliveryBoy.phone}
                          </option>
                        );
                      })}
                  </select>
                  {deliveryBoys.filter(db => {
                    const assignedWarehouses = db.assignedWarehouses || db.assignedWarehouseIds || [];
                    const warehouseId = viewing?.warehouseInfo?.warehouseId || '';
                    return Array.isArray(assignedWarehouses) && assignedWarehouses.some(id => {
                      if (typeof id === 'string') {
                        return id === warehouseId;
                      } else if (typeof id === 'object' && id !== null) {
                        return (id as any)._id === warehouseId || (id as any).id === warehouseId;
                      }
                      return false;
                    });
                  }).length === 0 && (
                    <p className="text-sm text-red-600">No delivery Agents assigned to this warehouse</p>
                  )}
                </div>
              )}
              
              {/* Show assigned delivery agent info */}
              {viewing?.assignedDeliveryBoy && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Assigned Delivery Agent:</span>
                  </div>
                  <div className="mt-1 text-sm text-blue-700">
                    {displayOrder.assignedDeliveryBoy?.name} - {displayOrder.assignedDeliveryBoy?.phone}
                  </div>
                </div>
              )}

              {/* OTP Input for Delivery Status - Only for warehouse managers and delivery Agents */}
              {showOtpInput && status === 'delivered' && (user?.role === 'order_warehouse_management' || user?.role === 'delivery_boy') && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <h5 className="font-medium text-gray-900 mb-2">Enter Delivery OTP</h5>
                    <p className="text-sm text-gray-600 mb-4">Please enter the 4-digit OTP to confirm delivery</p>
                  </div>

                  <div className="flex justify-center space-x-3">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                        placeholder="0"
                      />
                    ))}
                  </div>

                  <button
                    onClick={defaultVerifyDeliveryOtp}
                    disabled={updating || otpDigits.join('').length !== 4}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Verifying OTP...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify OTP & Mark as Delivered
                      </>
                    )}
                  </button>
                </div>
              )}

              {user?.role === 'customer_support_executive' ? (
                <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <Eye className="h-4 w-4 inline mr-2" />
                  View Only - Cannot change order status
                </div>
              ) : !showOtpInput ? (
                <button
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  onClick={defaultUpdateStatus}
                  disabled={updating || status === displayOrder.status || generatingOtp !== null || (status === 'shipped' && !selectedDeliveryBoy)}
                  title={status === displayOrder.status ? `Order is already ${status}` : status === 'shipped' && !selectedDeliveryBoy ? 'Please select a delivery agent' : ''}
                >
                  {generatingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating OTP...
                    </>
                  ) : updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating Status...
                    </>
                  ) : (() => {
                    // Determine button text and icon based on role, current status, and selected status
                    const isAdmin = user?.role === 'admin'
                    const isWarehouseManager = user?.role === 'order_warehouse_management'
                    const isDeliveryBoy = user?.role === 'delivery_boy'
                    const currentStatus = viewing?.status
                    const selectedStatus = status
                    const isChangingToDelivered = selectedStatus === 'delivered' && currentStatus !== 'delivered'

                    if (isChangingToDelivered && (isWarehouseManager || isDeliveryBoy)) {
                      return (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Generate Delivery OTP
                        </>
                      )
                    } else if (isChangingToDelivered && isAdmin) {
                      return (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Delivered
                        </>
                      )
                    }
                    return (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Update Status
                      </>
                    )
                  })()}
                </button>
              ) : null}
            </div>
          </div>

          {/* Invoice Actions */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 text-brand-primary mr-2" />
              Invoice Actions
            </h4>
            
            {/* Preview Invoice Button - Available for all users */}
            <button
              onClick={handleOpenPickingModal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center mb-3"
              title="Preview Invoice"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Invoice
            </button>
            
            {/* Generate Picking List - Only for warehouse managers and admins */}
            {(user?.role === 'order_warehouse_management' || user?.role === 'admin') && (
              <>
                <button
                  onClick={handleOpenPickingModal}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  title="Generate Warehouse Picking List"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Picking List
                </button>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Generate PDF with product locations for warehouse collection
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Warehouse Picking Modal */}
    {pickingModalOrder && (
      <WarehousePickingModal
        order={pickingModalOrder}
        isOpen={!!pickingModalOrder}
        onClose={() => setPickingModalOrder(null)}
      />
    )}
  </>
  )
}