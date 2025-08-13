"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Package, Truck, CheckCircle, X, RefreshCw, Loader2, Calendar, CreditCard, MapPin, User, Warehouse } from "lucide-react"
import toast from 'react-hot-toast'

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Order Details</h3>
              <p className="text-white/80">#{viewing.orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Status and Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                {(() => {
                  const StatusIcon = statusConfig[viewing.status as keyof typeof statusConfig].icon;
                  return <StatusIcon className="w-4 h-4 text-brand-primary" />;
                })()}
                <span className="text-sm font-medium text-gray-600">Order Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig[viewing.status as keyof typeof statusConfig].bg} ${statusConfig[viewing.status as keyof typeof statusConfig].color}`}>
                {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Order Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(viewing.createdAt).toLocaleDateString('en-IN', {
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
                {viewing.paymentInfo?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Warehouse className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Warehouse</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {viewing.warehouseInfo.warehouseName}
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
              <p className="font-medium">{viewing.customerInfo.name}</p>
              {viewing.deliveryInfo.address.building && <p>{viewing.deliveryInfo.address.building}</p>}
              <p>{viewing.deliveryInfo.address.area}</p>
              <p>{viewing.deliveryInfo.address.city}, {viewing.deliveryInfo.address.state} - {viewing.deliveryInfo.address.pincode}</p>
              {viewing.deliveryInfo.address.landmark && (
                <p className="text-gray-500">Near {viewing.deliveryInfo.address.landmark}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          {viewing.items && viewing.items.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 text-brand-primary mr-2" />
                Order Items ({viewing.items.length})
              </h4>
              <div className="space-y-3">
                {viewing.items.map((item: OrderItem, index: number) => (
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
                      <h5 className="font-medium text-gray-900 mb-1">{item.name}</h5>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                <span className="text-gray-900 font-medium">₹{(viewing.pricing.subtotal || viewing.pricing.total).toFixed(2)}</span>
              </div>

              {/* Discount Applied */}
              {(viewing.pricing.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount Applied</span>
                  <span className="text-green-600 font-medium">-₹{(viewing.pricing.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {/* Tax */}
              {(viewing.pricing.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">₹{(viewing.pricing.taxAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {/* Delivery Charges */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Charges</span>
                <span className={`font-medium ${(viewing.pricing.deliveryCharge || 0) === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {(viewing.pricing.deliveryCharge || 0) === 0 ? 'FREE' : `₹${(viewing.pricing.deliveryCharge || 0).toFixed(2)}`}
                </span>
              </div>

              {/* COD Charges */}
              {(viewing.pricing.codCharge || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">COD Charges</span>
                  <span className="text-gray-900 font-medium">₹{(viewing.pricing.codCharge || 0).toFixed(2)}</span>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-600">₹{Math.ceil(viewing.pricing.total)}</span>
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
                  <span className="font-medium text-gray-900">{viewing.customerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{viewing.customerInfo.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{viewing.customerInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Warehouse:</span>
                  <span className="font-medium text-gray-900">{viewing.warehouseInfo.warehouseName}</span>
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
                    {viewing.paymentInfo?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Type:</span>
                  <span className="font-medium text-gray-900">{viewing.paymentInfo?.paymentMethod?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${viewing.paymentInfo?.status === 'paid' ? 'text-green-600' : viewing.paymentInfo?.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {viewing.paymentInfo?.status?.charAt(0).toUpperCase() + viewing.paymentInfo?.status?.slice(1) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-lg text-gray-900">₹{Math.ceil(viewing.pricing.total)}</span>
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
                    {viewing.assignedDeliveryBoy.name} - {viewing.assignedDeliveryBoy.phone}
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
                  disabled={updating || status === viewing.status || generatingOtp !== null || (status === 'shipped' && !selectedDeliveryBoy)}
                  title={status === viewing.status ? `Order is already ${status}` : status === 'shipped' && !selectedDeliveryBoy ? 'Please select a delivery agent' : ''}
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
        </div>
      </div>
    </div>
  )
}