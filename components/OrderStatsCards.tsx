"use client"

import { useEffect, useState, useCallback } from "react"
import { Package, Truck, CheckCircle, X, RefreshCw } from "lucide-react"
import { useAppSelector } from '../lib/store'

interface OrderStatsCardsProps {
  title?: string
  description?: string
}

interface OrderStats {
  new: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  refunded: number
}

export default function OrderStatsCards({ title, description }: OrderStatsCardsProps) {
  const token = useAppSelector((state) => state.auth.token)
  const [orderStats, setOrderStats] = useState<OrderStats>({
    new: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchOrderStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order stats')
      }

      const data = await response.json()
      setOrderStats(data.stats || {
        new: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
      })
    } catch (err) {
      console.error('Error fetching order stats:', err)
      // Don't show error toast for stats as it's not critical
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchOrderStats()
    }
  }, [token, fetchOrderStats])

  return (
    <div className="space-y-6">
      {/* Header */}
      {title && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="space-y-4">
        {/* First Row - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? "..." : orderStats.new}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loading ? "..." : orderStats.processing}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-purple-600">
                  {loading ? "..." : orderStats.shipped}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? "..." : orderStats.delivered}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {loading ? "..." : orderStats.cancelled}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Refunded</p>
                <p className="text-2xl font-bold text-gray-600">
                  {loading ? "..." : orderStats.refunded}
                </p>
              </div>
            </div>
          </div>

          {/* Empty space for visual balance */}
          <div className="hidden lg:block"></div>
        </div>
      </div>
    </div>
  )
}