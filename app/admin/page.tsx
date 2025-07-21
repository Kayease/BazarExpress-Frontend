"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../components/AdminLayout"
import { useAppSelector } from '../../lib/store'
import { Users, ShoppingCart, Package, DollarSign, TrendingUp, Eye } from "lucide-react"

// Mock data for dashboard
const dashboardStats = {
  totalUsers: 1247,
  totalOrders: 856,
  totalProducts: 342,
  totalRevenue: 45678.9,
  newUsersToday: 23,
  ordersToday: 12,
  revenueToday: 2340.5,
  conversionRate: 3.2,
}

const recentOrders = [
  { id: "ORD-001", customer: "John Doe", amount: 299.99, status: "delivered", date: "2024-03-15" },
  { id: "ORD-002", customer: "Jane Smith", amount: 149.99, status: "shipped", date: "2024-03-15" },
  { id: "ORD-003", customer: "Mike Johnson", amount: 89.97, status: "processing", date: "2024-03-14" },
  { id: "ORD-004", customer: "Sarah Wilson", amount: 199.99, status: "delivered", date: "2024-03-14" },
  { id: "ORD-005", customer: "Tom Brown", amount: 79.99, status: "shipped", date: "2024-03-13" },
]

const topProducts = [
  { name: "Wireless Bluetooth Headphones", sales: 156, revenue: 12480.44 },
  { name: " Fitness Watch", sales: 89, revenue: 17791.11 },
  { name: "Premium Coffee Maker", sales: 67, revenue: 10049.33 },
  { name: "Organic Cotton T-Shirt", sales: 234, revenue: 7017.66 },
]

export default function AdminDashboard() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/")
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spectra mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-spectra to-elm rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Admin'}!</h2>
          <p className="text-gray-200">Here's what's happening with your store today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-codGray">{dashboardStats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />+{dashboardStats.newUsersToday} today
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-codGray">{dashboardStats.totalOrders.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />+{dashboardStats.ordersToday} today
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-codGray">{dashboardStats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Package className="h-4 w-4 mr-1" />
                  In inventory
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-codGray">${dashboardStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +${dashboardStats.revenueToday.toLocaleString()} today
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-codGray mb-4">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Order ID</th>
                    <th className="text-left py-2">Customer</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{order.id}</td>
                      <td className="py-2">{order.customer}</td>
                      <td className="py-2">${order.amount}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-codGray mb-4">Top Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-codGray">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-spectra">${product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold text-codGray mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary-dark text-white py-3 px-4 rounded-lg transition-colors">
              <Package className="h-5 w-5" />
              <span>Add Product</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary-dark text-white py-3 px-4 rounded-lg transition-colors">
              <Eye className="h-5 w-5" />
              <span>View Orders</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary-dark text-white py-3 px-4 rounded-lg transition-colors">
              <Users className="h-5 w-5" />
              <span>Manage Users</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
