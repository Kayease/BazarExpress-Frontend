"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { Search, Filter, MoreHorizontal, Edit, Eye, Package, Truck, CheckCircle, X, RefreshCw, Loader2 } from "lucide-react"
import { Pencil } from "lucide-react"
import toast from 'react-hot-toast'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  brand?: string
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
}

const statusOptions = ["new", "processing", "shipped", "delivered", "cancelled", "refunded"]

export default function AdminOrders() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [viewing, setViewing] = useState<Order | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
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
    if (!user || user.role !== "admin") {
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.phone.includes(searchTerm)
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

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

  if (!user || user.role !== "admin") {
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

          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Items</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon
                    const statusColor = statusConfig[order.status as keyof typeof statusConfig].color
                    const statusBg = statusConfig[order.status as keyof typeof statusConfig].bg

                    return (
                      <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="font-medium text-codGray">{order.orderId}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-codGray">{order.customerInfo.name}</p>
                            <p className="text-sm text-gray-500">{order.customerInfo.email}</p>
                            <p className="text-sm text-gray-500">{order.customerInfo.phone}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-codGray">₹{order.pricing.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {order.paymentInfo.method === 'cod' ? 'COD' : 'Online'}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusBg} w-fit`}>
                            <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                            <span className={`text-sm font-medium ${statusColor} capitalize`}>{order.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-gray-600">{order.items.length} items</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => openView(order)}
                              className="p-1 text-gray-400 hover:text-brand-primary transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
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
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-brand-primary hover:text-white transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-brand-primary text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-brand-primary hover:text-white transition-colors">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-brand-primary hover:text-white transition-colors">
              Next
            </button>
          </div>
        </div>

        {/* View Modal */}
        {viewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <button 
                    onClick={() => setViewing(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">Order ID:</span> {viewing.orderId}</div>
                      <div><span className="font-medium">Customer:</span> {viewing.customerInfo.name}</div>
                      <div><span className="font-medium">Email:</span> {viewing.customerInfo.email}</div>
                      <div><span className="font-medium">Phone:</span> {viewing.customerInfo.phone}</div>
                      <div><span className="font-medium">Date:</span> {new Date(viewing.createdAt).toLocaleDateString()}</div>
                      <div><span className="font-medium">Payment:</span> {viewing.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</div>
                      <div><span className="font-medium">Warehouse:</span> {viewing.warehouseInfo.warehouseName}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Delivery Address</h3>
                    <div className="text-sm">
                      <p>{viewing.deliveryInfo.address.building}</p>
                      <p>{viewing.deliveryInfo.address.area}</p>
                      <p>{viewing.deliveryInfo.address.city}, {viewing.deliveryInfo.address.state}</p>
                      <p>{viewing.deliveryInfo.address.pincode}</p>
                      {viewing.deliveryInfo.address.landmark && (
                        <p className="text-gray-600">Near {viewing.deliveryInfo.address.landmark}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {viewing.items.map((item: OrderItem, index: number) => (
                      <div key={`${item.productId}-${index}`} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.category && <p className="text-sm text-gray-500">{item.category}</p>}
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{viewing.pricing.subtotal.toFixed(2)}</span>
                    </div>
                    {viewing.pricing.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{viewing.pricing.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {viewing.pricing.deliveryCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Charge:</span>
                        <span>₹{viewing.pricing.deliveryCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {viewing.pricing.codCharge > 0 && (
                      <div className="flex justify-between">
                        <span>COD Charge:</span>
                        <span>₹{viewing.pricing.codCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {viewing.pricing.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="text-green-600">-₹{viewing.pricing.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{viewing.pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-lg font-semibold mb-3">Update Status</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-3 mb-4" 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors" 
                  onClick={() => setViewing(null)}
                >
                  Cancel
                </button>
                <button 
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50" 
                  onClick={updateStatus}
                  disabled={updating}
                >
                  {updating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
