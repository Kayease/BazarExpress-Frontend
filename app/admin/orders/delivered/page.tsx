"use client"

import { useEffect, useState } from "react"
import AdminLayout from "../../../../components/AdminLayout"
import { getCurrentUser } from "../../../../lib/auth"
import { Eye, Edit, CheckCircle, Search } from "lucide-react"

const mockOrders = [
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
  // ...add more demo delivered orders as needed
]

const statusConfig = {
  delivered: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
}

export default function AdminDeliveredOrders() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState(mockOrders)
  const [searchTerm, setSearchTerm] = useState("")
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      window.location.href = "/"
      return
    }
    setUser(currentUser)
  }, [])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (!user) {
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-codGray">Delivered Orders</h2>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                {filteredOrders.map((order) => (
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
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusConfig.delivered.bg} w-fit`}>
                        <CheckCircle className={`h-4 w-4 ${statusConfig.delivered.color}`} />
                        <span className={`text-sm font-medium ${statusConfig.delivered.color} capitalize`}>{order.status}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
} 