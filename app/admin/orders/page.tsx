"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { Search, Filter, MoreHorizontal, Edit, Eye, Package, Truck, CheckCircle, X, RefreshCw } from "lucide-react"
import { Pencil } from "lucide-react"

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    email: "john@example.com",
    amount: 299.99,
    status: "delivered",
    date: "2024-03-15",
    items: 2,
    paymentMethod: "Credit Card",
    shippingAddress: "123 Main St, New York, NY 10001",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    email: "jane@example.com",
    amount: 149.99,
    status: "shipped",
    date: "2024-03-15",
    items: 1,
    paymentMethod: "PayPal",
    shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    email: "mike@example.com",
    amount: 89.97,
    status: "processing",
    date: "2024-03-14",
    items: 3,
    paymentMethod: "Credit Card",
    shippingAddress: "789 Pine St, Chicago, IL 60601",
  },
  {
    id: "ORD-004",
    customer: "Sarah Wilson",
    email: "sarah@example.com",
    amount: 199.99,
    status: "delivered",
    date: "2024-03-14",
    items: 1,
    paymentMethod: "Debit Card",
    shippingAddress: "321 Elm St, Houston, TX 77001",
  },
  {
    id: "ORD-005",
    customer: "Tom Brown",
    email: "tom@example.com",
    amount: 79.99,
    status: "cancelled",
    date: "2024-03-13",
    items: 1,
    paymentMethod: "Credit Card",
    shippingAddress: "654 Maple Dr, Phoenix, AZ 85001",
  },
  {
    id: "ORD-006",
    customer: "Alice Cooper",
    email: "alice@example.com",
    amount: 59.99,
    status: "refunded",
    date: "2024-03-12",
    items: 1,
    paymentMethod: "Credit Card",
    shippingAddress: "987 Willow St, Miami, FL 33101",
  },
]

const statusConfig = {
  processing: { icon: Package, color: "text-yellow-600", bg: "bg-yellow-100" },
  shipped: { icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
  delivered: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  cancelled: { icon: X, color: "text-red-600", bg: "bg-red-100" },
  refunded: { icon: RefreshCw, color: "text-purple-600", bg: "bg-purple-100" },
}

const statusOptions = ["Processing", "Shipped", "Delivered", "Cancelled", "Refunded"]

export default function AdminOrders() {
  const user = useAppSelector((state) => state.auth.user)
  const [orders, setOrders] = useState(mockOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [viewing, setViewing] = useState<any | null>(null)
  const [status, setStatus] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/")
    }
  }, [user, router])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const orderStats = {
    total: orders.length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  }

  const openView = (order: any) => {
    setViewing(order)
    setStatus(order.status)
  }
  const updateStatus = () => {
    setOrders(orders.map(o => o.id === viewing.id ? { ...o, status } : o))
    setViewing(null)
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-codGray">{orderStats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-yellow-600">{orderStats.processing}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Shipped</p>
              <p className="text-2xl font-bold text-blue-600">{orderStats.shipped}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
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
                {filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon
                  const statusColor = statusConfig[order.status as keyof typeof statusConfig].color
                  const statusBg = statusConfig[order.status as keyof typeof statusConfig].bg

                  return (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <p className="font-medium text-codGray">{order.id}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-codGray">{order.customer}</p>
                          <p className="text-sm text-gray-500">{order.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-codGray">${order.amount}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusBg} w-fit`}>
                          <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                          <span className={`text-sm font-medium ${statusColor} capitalize`}>{order.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{new Date(order.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-gray-600">{order.items} items</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-brand-primary transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-brand-primary transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>

                      </div>
                      </td>
                    </tr>
                  )
                })}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8 relative border-4 border-spectra">
              <div className="text-2xl font-bold mb-4 text-spectra">Order Details</div>
              <div className="mb-2"><span className="font-semibold">Order ID:</span> {viewing.id}</div>
              <div className="mb-2"><span className="font-semibold">User:</span> {viewing.customer}</div>
              <div className="mb-2"><span className="font-semibold">Date:</span> {viewing.date}</div>
              <div className="mb-2"><span className="font-semibold">Status:</span> <span className={`px-3 py-1 rounded-full text-white ${viewing.status === "Delivered" ? "bg-green-500" : viewing.status === "Cancelled" ? "bg-red-500" : viewing.status === "Shipped" ? "bg-elm" : "bg-spectra"}`}>{viewing.status}</span></div>
              <div className="mb-2"><span className="font-semibold">Total:</span> ${viewing.amount.toFixed(2)}</div>
              <div className="mb-4"><span className="font-semibold">Shipping:</span> {viewing.shippingAddress}</div>
              <div className="mb-4">
                <span className="font-semibold">Products:</span>
                <ul className="list-disc ml-6 mt-2">
                  {viewing.products.map((p: any, i: number) => (
                    <li key={i} className="mb-1">{p.name} <span className="text-gray-500">x{p.qty}</span> <span className="text-elm font-semibold">${p.price.toFixed(2)}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Update Status</label>
                <select className="w-full border border-gray-300 rounded-lg p-3" value={status} onChange={e => setStatus(e.target.value)}>
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="bg-gradient-to-r from-brand-primary to-elm text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform" onClick={updateStatus}>Save</button>
                <button className="bg-gray-200 hover:bg-gray-300 text-codGray font-semibold py-2 px-6 rounded-lg transition-colors" onClick={() => setViewing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
