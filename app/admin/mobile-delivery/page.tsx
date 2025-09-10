"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MobileDeliveryAdminLayout from "../../../components/MobileDeliveryAdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser } from '../../../lib/adminAuth'
import { apiGet } from "../../../lib/api-client"
import { API_URL, CURRENCY } from "../../../lib/config"
import { useAdminStatsRefresh } from '../../../lib/hooks/useAdminStatsRefresh'
import {
  Package, Truck, CheckCircle, X, RefreshCw, Clock, MapPin, 
  TrendingUp, BarChart3, User, Phone, Calendar
} from "lucide-react"

interface DashboardResponse {
  role: string
  // Delivery Boy specific data
  todayDeliveries?: any[]
  recentDeliveries?: any[]
  assignedWarehouses?: any[]
  cards?: {
    assignedOrders?: number
    shippedOrders?: number
    deliveredToday?: number
    deliveredOrders?: number
    todayCancelledAfterDelivery?: number
    todayRefundedAfterDelivery?: number
    todayAssignedOrdersExcludingCancelledRefunded?: number
  }
  returnStats?: {
    requested?: number
    approved?: number
    pickup_assigned?: number
    pickup_rejected?: number
    picked_up?: number
    received?: number
    partially_refunded?: number
    refunded?: number
    rejected?: number
    today?: number
    total?: number
  }
}

export default function MobileDeliveryDashboard() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Dashboard data fetching function
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const res = await apiGet(`${API_URL}/dashboard`)
      setData(res)
      setError(null)
    } catch (e: any) {
      console.error('Dashboard load failed', e)
      setError(e?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Global stats refresh system integration
  const { isRefreshing } = useAdminStatsRefresh({
    onRefresh: fetchDashboardData,
    debounceMs: 300,
    enabled: true
  })

  // Helper functions
  const currency = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY === '₹' ? 'INR' : 'USD' }).format(Number(n || 0))
  const numberFmt = new Intl.NumberFormat(undefined)

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || user.role !== 'delivery_boy') {
      router.push("/")
      return
    }
    fetchDashboardData()
  }, [user, router])

  if (!user || !isAdminUser(user.role) || user.role !== 'delivery_boy') {
    return (
      <MobileDeliveryAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this section.</p>
          </div>
        </div>
      </MobileDeliveryAdminLayout>
    )
  }

  if (loading) {
    return (
      <MobileDeliveryAdminLayout>
        <div className="p-4 space-y-4">
          {/* Header Skeleton */}
          <div className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MobileDeliveryAdminLayout>
    )
  }

  if (error) {
    return (
      <MobileDeliveryAdminLayout>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-700 font-semibold mb-2">Unable to load dashboard</h2>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </MobileDeliveryAdminLayout>
    )
  }

  const StatCard = ({ label, value, icon: Icon, colorClass = "text-gray-600", bg = "bg-gray-100" }: any) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
          <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </div>
    </div>
  )

  return (
    <MobileDeliveryAdminLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Welcome back, {user?.name || 'Delivery Agent'}!</h2>
              <p className="text-orange-100 text-sm">Here's your delivery overview for today.</p>
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            label="Total Assigned" 
            value={numberFmt.format(data?.cards?.assignedOrders || 0)} 
            icon={Package} 
            colorClass="text-blue-600" 
            bg="bg-blue-100" 
          />
          <StatCard 
            label="Pending Orders" 
            value={numberFmt.format(data?.cards?.shippedOrders || 0)} 
            icon={Truck} 
            colorClass="text-purple-600" 
            bg="bg-purple-100" 
          />
          <StatCard 
            label="Delivered Today" 
            value={numberFmt.format(data?.cards?.deliveredToday || 0)} 
            icon={CheckCircle} 
            colorClass="text-green-600" 
            bg="bg-green-100" 
          />
          <StatCard 
            label="Total Delivered" 
            value={numberFmt.format(data?.cards?.deliveredOrders || 0)} 
            icon={CheckCircle} 
            colorClass="text-emerald-600" 
            bg="bg-emerald-100" 
          />
        </div>

        {/* Returns Overview */}
        {data?.returnStats && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <RefreshCw className="h-4 w-4 mr-2 text-orange-600" />
              Returns Overview
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-orange-600">{data?.returnStats?.today || 0}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{data?.returnStats?.picked_up || 0}</p>
                <p className="text-xs text-gray-500">Picked Up</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{data?.returnStats?.rejected || 0}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Warehouses */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-blue-600" />
            Assigned Warehouses
          </h3>
          <div className="space-y-2">
            {(data?.assignedWarehouses || []).map((warehouse: any) => (
              <div key={warehouse._id} className="flex items-center p-2 bg-blue-50 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800 truncate">{warehouse.name}</p>
                  {warehouse.address && (
                    <p className="text-xs text-blue-600 truncate">{warehouse.address}</p>
                  )}
                </div>
              </div>
            ))}
            {(!data?.assignedWarehouses || data.assignedWarehouses.length === 0) && (
              <div className="text-center py-4">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No warehouses assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Performance */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
            Today's Performance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Delivered Today</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">{data?.cards?.deliveredToday || 0}</span>
                <div className="text-xs text-green-500">
                  {(data?.cards?.todayAssignedOrdersExcludingCancelledRefunded || 0) > 0 ? 
                    `${Math.round(((data?.cards?.deliveredToday || 0) / (data?.cards?.todayAssignedOrdersExcludingCancelledRefunded || 1)) * 100)}% completion` : 
                    '0% completion'
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <Truck className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">Pending Delivery</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-purple-600">{data?.cards?.shippedOrders || 0}</span>
                <div className="text-xs text-purple-500">Shipped orders</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Delivery Progress</span>
                <span>{data?.cards?.deliveredToday || 0} / {((data?.cards?.shippedOrders || 0)+(data?.cards?.deliveredToday || 0))}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${((data?.cards?.shippedOrders || 0)+(data?.cards?.deliveredToday || 0)) > 0 ? 
                      Math.min(100, ((data?.cards?.deliveredToday || 0) / ((data?.cards?.shippedOrders || 0)+(data?.cards?.deliveredToday || 0))) * 100) : 0
                    }%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-indigo-600" />
            Recent Deliveries
          </h3>
          <div className="space-y-2">
            {(data?.todayDeliveries || []).slice(0, 3).map((delivery: any) => (
              <div key={delivery._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">#{delivery.orderId}</p>
                  <p className="text-xs text-gray-500 truncate">{delivery.customerInfo?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">{currency(delivery.pricing?.total || 0)}</p>
                  <p className="text-xs text-gray-500">
                    {delivery.actualDeliveryDate ? 
                      new Date(delivery.actualDeliveryDate).toLocaleTimeString() : 
                      'Just now'
                    }
                  </p>
                </div>
              </div>
            ))}
            {(!data?.todayDeliveries || data.todayDeliveries.length === 0) && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No deliveries completed today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileDeliveryAdminLayout>
  )
}
