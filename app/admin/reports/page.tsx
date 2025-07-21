"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Calendar } from "lucide-react"

export default function AdminReports() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/")
    }
  }, [user, router])

  const salesData = {
    thisMonth: 45678.9,
    lastMonth: 38234.5,
    growth: 19.5,
    ordersThisMonth: 856,
    ordersLastMonth: 723,
    orderGrowth: 18.4,
  }

  const topCategories = [
    { name: "Electronics", sales: 25430.5, percentage: 55.7 },
    { name: "Fashion", sales: 12340.25, percentage: 27.0 },
    { name: "Home & Kitchen", sales: 5678.9, percentage: 12.4 },
    { name: "Sports", sales: 2229.25, percentage: 4.9 },
  ]

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spectra mx-auto mb-4"></div>
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
            <h2 className="text-2xl font-bold text-codGray">Reports & Analytics</h2>
            <p className="text-gray-600">Track your business performance</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-surface-tertiary hover:bg-surface-tertiary-dark border border-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors">
              Export PDF
            </button>
            <button className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg transition-colors">
              Generate Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
                <p className="text-2xl font-bold text-codGray">${salesData.thisMonth.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />+{salesData.growth}% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders This Month</p>
                <p className="text-2xl font-bold text-codGray">{salesData.ordersThisMonth.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />+{salesData.orderGrowth}% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-codGray">
                  ${(salesData.thisMonth / salesData.ordersThisMonth).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  This month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-codGray">3.2%</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  -0.3% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-codGray mb-4">Sales Overview</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Sales Chart Placeholder</p>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-codGray mb-4">Top Categories</h3>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-codGray">{category.name}</span>
                      <span className="text-sm text-gray-500">{category.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold text-codGray">${category.sales.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold text-codGray mb-4">Monthly Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Month</th>
                  <th className="text-left py-2">Revenue</th>
                  <th className="text-left py-2">Orders</th>
                  <th className="text-left py-2">Customers</th>
                  <th className="text-left py-2">Growth</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2">March 2024</td>
                  <td className="py-2">${salesData.thisMonth.toLocaleString()}</td>
                  <td className="py-2">{salesData.ordersThisMonth}</td>
                  <td className="py-2">1,247</td>
                  <td className="py-2 text-green-600">+{salesData.growth}%</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">February 2024</td>
                  <td className="py-2">${salesData.lastMonth.toLocaleString()}</td>
                  <td className="py-2">{salesData.ordersLastMonth}</td>
                  <td className="py-2">1,156</td>
                  <td className="py-2 text-green-600">+12.3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
