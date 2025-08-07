"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { Search, Filter, MoreHorizontal, Edit, Eye, Package, Truck, CheckCircle, X, RefreshCw, Loader2, Pencil, Calendar, CreditCard, MapPin, User, Warehouse } from "lucide-react"
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
  }
  tracking?: {
    trackingNumber?: string
    carrier?: string
  }
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

      // Function to determine display status based on backend payment status
      const getDisplayStatus = (order: Order) => {
        // Use the payment status from the backend
        return order.paymentInfo.status;
      }

const statusOptions = ["new", "processing", "shipped", "delivered", "cancelled", "refunded"]

export default function AdminOrders() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterWarehouse, setFilterWarehouse] = useState("all")
  const [viewing, setViewing] = useState<Order | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ORDERS_PER_PAGE = 20
  const [orderStats, setOrderStats] = useState({
    total: 0,
    new: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  })
  const router = useRouter()

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
      router.push("/")
      return
    }
    fetchOrders()
  }, [user, router])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      setOrderStats(data.stats || {
        total: 0,
        new: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
      })
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // Extract unique warehouses from orders
  const uniqueWarehouses = Array.from(new Set(orders.map(order => order.warehouseInfo.warehouseName))).filter(Boolean)

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.phone.includes(searchTerm)
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    const matchesWarehouse = filterWarehouse === "all" || order.warehouseInfo.warehouseName === filterWarehouse
    return matchesSearch && matchesStatus && matchesWarehouse
  })

  // Calculate paginated orders
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterWarehouse])

  const openView = (order: Order) => {
    setViewing(order)
    setStatus(order.status)
  }

  const updateStatus = async () => {
    if (!viewing || !status) return

    try {
      setUpdating(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/status/${viewing.orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          note: `Status updated to ${status} by admin`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      const data = await response.json()
      
      // Update the orders list
      setOrders(orders.map(o => 
        o.orderId === viewing.orderId 
          ? { ...o, status: status as Order['status'] } 
          : o
      ))
      
      // Update stats
      await fetchOrders()
      
      setViewing(null)
      toast.success('Order status updated successfully')
    } catch (err) {
      console.error('Error updating order status:', err)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-codGray">Orders Management</h2>
            <p className="text-gray-600">Track and manage all customer orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-codGray">{orderStats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-blue-600">{orderStats.new}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-yellow-600">{orderStats.processing}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Shipped</p>
              <p className="text-2xl font-bold text-purple-600">{orderStats.shipped}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{orderStats.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Warehouses</option>
              {uniqueWarehouses.map((warehouse) => (
                <option key={warehouse} value={warehouse}>
                  {warehouse}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Order ID</th>
                  <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Customer</th>
                  <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Amount</th>
                  <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-sm text-gray-700">Items</th>
                  <th className="text-center py-2 px-3 font-medium text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      {filteredOrders.length === 0 ? "No orders found" : "No orders on this page"}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon
                    const statusColor = statusConfig[order.status as keyof typeof statusConfig].color
                    const statusBg = statusConfig[order.status as keyof typeof statusConfig].bg

                    return (
                      <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50 transition group">
                        <td className="py-2 px-3 align-middle">
                          <p className="font-medium text-xs text-codGray">{order.orderId}</p>
                        </td>
                        <td className="py-2 px-3 align-middle max-w-xs">
                          <div>
                            <p className="font-medium text-xs text-codGray truncate" title={order.customerInfo.name}>{order.customerInfo.name}</p>
                            <p className="text-xs text-gray-500 truncate" title={order.customerInfo.email}>{order.customerInfo.email}</p>
                            <p className="text-xs text-gray-500">{order.customerInfo.phone}</p>
                          </div>
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <p className="font-semibold text-xs text-codGray">₹{order.pricing.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {order.paymentInfo.method === 'cod' ? 'COD' : 'Online'}
                          </p>
                        </td>
                        <td className="py-2 px-3 align-middle text-center">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${statusBg}`}>
                            <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                            <span className={`text-xs font-medium ${statusColor} capitalize`}>{order.status}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 align-middle text-xs text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-3 align-middle text-xs text-gray-600">{order.items.length} items</td>
                        <td className="py-2 px-3 align-middle">
                          <div className="flex items-center justify-center">
                            <button 
                              onClick={() => openView(order)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition-colors shadow-sm"
                              title="View Details"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {(() => {
                  const maxVisiblePages = 5;
                  const pages = [];
                  
                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Smart pagination logic
                    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    // Adjust start if we're near the end
                    const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1);
                    
                    for (let i = adjustedStart; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    // Add ellipsis and first/last page if needed
                    if (adjustedStart > 1) {
                      pages.unshift('...');
                      pages.unshift(1);
                    }
                    if (endPage < totalPages) {
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-500">...</span>
                    ) : (
                      <button
                        key={page}
                        className={`px-3 py-1 rounded text-sm font-medium border ${currentPage === page ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setCurrentPage(page as number)}
                      >
                        {page}
                      </button>
                    )
                  ));
                })()}
                <button
                  className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modern Order Details Modal */}
        {viewing && (
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
                    onClick={() => setViewing(null)}
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
                      {viewing.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
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
                    <p>{viewing.deliveryInfo.address.building}</p>
                    <p>{viewing.deliveryInfo.address.area}</p>
                    <p>{viewing.deliveryInfo.address.city}, {viewing.deliveryInfo.address.state} - {viewing.deliveryInfo.address.pincode}</p>
                    {viewing.deliveryInfo.address.landmark && (
                      <p className="text-gray-500">Near {viewing.deliveryInfo.address.landmark}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
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
                      <span className="text-gray-900 font-medium">₹{viewing.pricing.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Discount Applied */}
                    {viewing.pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Discount Applied</span>
                        <span className="text-green-600 font-medium">-₹{viewing.pricing.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {/* Tax */}
                    {viewing.pricing.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">₹{viewing.pricing.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {/* Delivery Charges */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Charges</span>
                      <span className={`font-medium ${viewing.pricing.deliveryCharge === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {viewing.pricing.deliveryCharge === 0 ? 'FREE' : `₹${viewing.pricing.deliveryCharge.toFixed(2)}`}
                      </span>
                    </div>
                    
                    {/* COD Charges */}
                    {viewing.pricing.codCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">COD Charges</span>
                        <span className="text-gray-900 font-medium">₹{viewing.pricing.codCharge.toFixed(2)}</span>
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
                        <span className="font-medium text-gray-900">{viewing.customerInfo.email}</span>
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
                          {viewing.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Type:</span>
                        <span className="font-medium text-gray-900">{viewing.paymentInfo.paymentMethod.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${viewing.paymentInfo.status === 'paid' ? 'text-green-600' : viewing.paymentInfo.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {viewing.paymentInfo.status.charAt(0).toUpperCase() + viewing.paymentInfo.status.slice(1)}
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
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                        user?.role === 'customer_support_executive' 
                          ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                          : ''
                      }`}
                      value={status} 
                      onChange={e => setStatus(e.target.value)}
                      disabled={user?.role === 'customer_support_executive'}
                      title={user?.role === 'customer_support_executive' ? 'Customer Support Executive cannot change order status' : ''}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                    
                    {user?.role === 'customer_support_executive' ? (
                      <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                        <Eye className="h-4 w-4 inline mr-2" />
                        View Only - Cannot change order status
                      </div>
                    ) : (
                      <button 
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                        onClick={updateStatus}
                        disabled={updating || status === viewing.status}
                      >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Updating Status...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Update Status
                        </>
                      )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
