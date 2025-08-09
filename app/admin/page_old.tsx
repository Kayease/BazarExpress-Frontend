"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../components/AdminLayout"
import { useAppSelector } from '../../lib/store'
import { isAdminUser } from '../../lib/adminAuth'
import { apiGet } from "../../lib/api-client"
import { API_URL, CURRENCY } from "../../lib/config"
import {
  Users, ShoppingCart, Package, IndianRupee, TrendingUp, Eye, Tag, Grid3X3, Building2,
  Truck, CheckCircle, X, RefreshCw, Mail, BarChart3, Percent, Bell, Image
} from "lucide-react"

interface DashboardResponse {
  role: string
  // Admin
  cards?: any
  recentOrders?: any[]
  topProducts?: any[]
  orderStats?: any
  // Warehouse / Inventory
  assignedWarehouses?: any[]
  lowStockProducts?: any[]
  // Marketing
  recentSubscribers?: any[]
  // Support
  userStats?: any
  contactStats?: any
  recentContacts?: any[]
  // Finance
  revenueByDay?: { _id: string; total: number }[]
  ordersByDay?: { _id: string; total: number }[]
}

export default function AdminDashboard() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Localized currency and numbers with Intl - moved before early returns
  const numberFmt = useMemo(() => new Intl.NumberFormat(undefined), [])
  const currencyFmt = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY === '₹' ? 'INR' : 'USD' }), [])
  
  // Helper functions
  const currency = (n: number) => currencyFmt.format(Number(n || 0))
  const role = user?.role || ''

  // Skeleton Components
  const SkeletonStat = () => (
    <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )

  const SkeletonCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-codGray">{title}</h3>
      </div>
      {children}
    </div>
  )

  const SkeletonTable = ({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) => (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="text-left py-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="py-2">
                  <div className="h-4 bg-gray-100 rounded w-24"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const SkeletonList = ({ items = 3 }: { items?: number }) => (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
            <div className="h-3 bg-gray-100 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  )

  const SkeletonSparkline = () => (
    <div className="flex items-end gap-1 h-12 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="w-2 bg-gray-200 rounded" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
      ))}
    </div>
  )

  const SkeletonChips = ({ count = 3 }: { count?: number }) => (
    <div className="flex flex-wrap gap-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-6 bg-gray-200 rounded-full w-20"></div>
      ))}
    </div>
  )

  // Skeleton Loading for Admin Role
  const renderAdminSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-spectra to-elm rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-48"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard title="Recent Orders">
          <SkeletonTable rows={5} cols={4} />
        </SkeletonCard>

        <SkeletonCard title="Top Products">
          <SkeletonList items={5} />
        </SkeletonCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard title="Revenue (7d)">
          <SkeletonSparkline />
        </SkeletonCard>
        <SkeletonCard title="Orders (7d)">
          <SkeletonSparkline />
        </SkeletonCard>
      </div>
    </div>
  )

  // Skeleton Loading for Warehouse Management Role
  const renderWarehouseMgmtSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-56 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-64"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Assigned Warehouses">
        <SkeletonChips count={4} />
      </SkeletonCard>

      <SkeletonCard title="Recent Orders">
        <SkeletonTable rows={5} cols={5} />
        <div className="mt-4">
          <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
          <SkeletonSparkline />
        </div>
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Inventory Management Role
  const renderInventoryMgmtSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-56 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-72"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Assigned Warehouses">
        <SkeletonChips count={3} />
      </SkeletonCard>

      <SkeletonCard title="Low Stock Products">
        <SkeletonList items={4} />
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Marketing Role
  const renderMarketingSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-56 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-48"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Recent Subscribers">
        <SkeletonTable rows={4} cols={3} />
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Support Role
  const renderSupportSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-600 to-cyan-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-52 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-56"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Recent Enquiries">
        <SkeletonTable rows={4} cols={4} />
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Finance Role
  const renderFinanceSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-52 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-60"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard title="Revenue (Last 7 days)">
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 h-3 bg-gray-200 rounded"></div>
                <div className="flex-1 h-3 bg-gray-100 rounded">
                  <div className="h-3 bg-gray-200 rounded" style={{ width: `${Math.random() * 80 + 20}%` }}></div>
                </div>
                <div className="w-28 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard title="Orders (Last 7 days)">
          <SkeletonSparkline />
        </SkeletonCard>
      </div>
    </div>
  )

  // Render skeleton based on role
  const renderSkeleton = () => {
    switch (role) {
      case 'admin':
        return renderAdminSkeleton()
      case 'order_warehouse_management':
        return renderWarehouseMgmtSkeleton()
      case 'product_inventory_management':
        return renderInventoryMgmtSkeleton()
      case 'marketing_content_manager':
        return renderMarketingSkeleton()
      case 'customer_support_executive':
        return renderSupportSkeleton()
      case 'report_finance_analyst':
        return renderFinanceSkeleton()
      default:
        return renderAdminSkeleton()
    }
  }

  useEffect(() => {
    if (!user || !isAdminUser(user.role)) {
      router.push("/")
      return
    }
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await apiGet(`${API_URL}/dashboard`)
        setData(res)
      } catch (e: any) {
        console.error('Dashboard load failed', e)
        setError(e?.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, router])

  if (!user || !isAdminUser(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spectra mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        {renderSkeleton()}
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-700 font-semibold mb-2">Unable to load dashboard</h2>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  const SectionCard = ({ title, children, className = "" }: { title: string; children: any; className?: string }) => (
    <div className={`bg-white rounded-lg p-6 shadow-md ${className}`}>
      <h3 className="text-lg font-semibold text-codGray mb-4">{title}</h3>
      {children}
    </div>
  )

  const Stat = ({ label, value, icon: Icon, colorClass = "text-codGray", bg = "bg-gray-100" }: any) => (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  )

  // Tiny inline sparkline component using simple CSS bar
  const Sparkline = ({ series, color = 'bg-emerald-500', formatter }: { series: { label?: string; value: number }[]; color?: string; formatter: (n: number) => string }) => {
    const max = Math.max(1, ...series.map(s => s.value))
    return (
      <div className="flex items-end gap-1 h-12">
        {series.map((s, idx) => (
          <div key={idx} title={`${s.label ?? ''} ${formatter(s.value)}`} className={`w-2 rounded ${color}`} style={{ height: `${Math.max(4, (s.value / max) * 100)}%` }} />
        ))}
      </div>
    )
  }

  // Skeleton Components
  const SkeletonStat = () => (
    <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )

  const SkeletonCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-codGray">{title}</h3>
      </div>
      {children}
    </div>
  )

  const SkeletonTable = ({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) => (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="text-left py-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="py-2">
                  <div className="h-4 bg-gray-100 rounded w-24"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const SkeletonList = ({ items = 3 }: { items?: number }) => (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
            <div className="h-3 bg-gray-100 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  )

  const SkeletonSparkline = () => (
    <div className="flex items-end gap-1 h-12 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="w-2 bg-gray-200 rounded" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
      ))}
    </div>
  )

  const SkeletonChips = ({ count = 3 }: { count?: number }) => (
    <div className="flex flex-wrap gap-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-6 bg-gray-200 rounded-full w-20"></div>
      ))}
    </div>
  )

  // Skeleton Loading for Admin Role
  const renderAdminSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-spectra to-elm rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-48"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard title="Recent Orders">
          <SkeletonTable rows={5} cols={4} />
        </SkeletonCard>

        <SkeletonCard title="Top Products">
          <SkeletonList items={5} />
        </SkeletonCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard title="Revenue (7d)">
          <SkeletonSparkline />
        </SkeletonCard>
        <SkeletonCard title="Orders (7d)">
          <SkeletonSparkline />
        </SkeletonCard>
      </div>
    </div>
  )

  // Skeleton Loading for Warehouse Management Role
  const renderWarehouseMgmtSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-56 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-64"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Assigned Warehouses">
        <SkeletonChips count={4} />
      </SkeletonCard>

      <SkeletonCard title="Recent Orders">
        <SkeletonTable rows={5} cols={5} />
        <div className="mt-4">
          <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
          <SkeletonSparkline />
        </div>
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Inventory Management Role
  const renderInventoryMgmtSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-56 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-72"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Assigned Warehouses">
        <SkeletonChips count={3} />
      </SkeletonCard>

      <SkeletonCard title="Low Stock Products">
        <SkeletonList items={4} />
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Marketing Role
  const renderMarketingSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-56 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-48"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Recent Subscribers">
        <SkeletonTable rows={4} cols={3} />
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Support Role
  const renderSupportSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-600 to-cyan-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-52 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-56"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <SkeletonCard title="Recent Enquiries">
        <SkeletonTable rows={4} cols={4} />
      </SkeletonCard>
    </div>
  )

  // Skeleton Loading for Finance Role
  const renderFinanceSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-52 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-60"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard title="Revenue (Last 7 days)">
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 h-3 bg-gray-200 rounded"></div>
                <div className="flex-1 h-3 bg-gray-100 rounded">
                  <div className="h-3 bg-gray-200 rounded" style={{ width: `${Math.random() * 80 + 20}%` }}></div>
                </div>
                <div className="w-28 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard title="Orders (Last 7 days)">
          <SkeletonSparkline />
        </SkeletonCard>
      </div>
    </div>
  )

  // Role: Admin
  const renderAdmin = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-spectra to-elm rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Admin'}!</h2>
        <p className="text-gray-200">Here’s your store overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat label="Total Users" value={numberFmt.format(data?.cards?.totalUsers || 0)} icon={Users} colorClass="text-blue-600" bg="bg-blue-100" />
        <Stat label="Total Orders" value={numberFmt.format(data?.orderStats?.total || 0)} icon={ShoppingCart} colorClass="text-green-600" bg="bg-green-100" />
        <Stat label="Total Products" value={numberFmt.format(data?.cards?.totalProducts || 0)} icon={Package} colorClass="text-purple-600" bg="bg-purple-100" />
        <Stat label="Total Revenue" value={currency(data?.cards?.totalRevenue || 0)} icon={IndianRupee} colorClass="text-yellow-600" bg="bg-yellow-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Orders">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Order ID</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders || []).map((o: any) => (
                  <tr key={o.orderId} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{o.orderId}</td>
                    <td className="py-2">{o.customerInfo?.name}</td>
                    <td className="py-2">{currency(o.pricing?.total)}</td>
                    <td className="py-2 text-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 capitalize">{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Top Products">
          <div className="space-y-4">
            {(data?.topProducts || []).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-codGray">{p.name || p.productName || 'Product'}</p>
                  <p className="text-sm text-gray-500">{numberFmt.format(p.sales)} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-spectra">{currency(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Revenue (7d)" className="flex items-end justify-between">
          <Sparkline series={(data?.revenueByDay || []).map((d: { _id: string; total: number }) => ({ label: d._id, value: d.total }))} color="bg-amber-500" formatter={numberFmt.format} />
        </SectionCard>
        <SectionCard title="Orders (7d)" className="flex items-end justify-between">
          <Sparkline series={(data?.ordersByDay || []).map((d: { _id: string; total: number }) => ({ label: d._id, value: d.total }))} color="bg-indigo-500" formatter={numberFmt.format} />
        </SectionCard>
      </div>
    </div>
  )

  // Role: Order & Warehouse Management
  const renderWarehouseMgmt = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Warehouse Dashboard</h2>
        <p className="text-indigo-100">Orders and warehouses assigned to you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="Total" value={numberFmt.format(data?.orderStats?.total || 0)} icon={ShoppingCart} colorClass="text-gray-800" bg="bg-gray-100" />
        <Stat label="New" value={numberFmt.format(data?.orderStats?.new || 0)} icon={Package} colorClass="text-blue-600" bg="bg-blue-100" />
        <Stat label="Processing" value={numberFmt.format(data?.orderStats?.processing || 0)} icon={Package} colorClass="text-yellow-600" bg="bg-yellow-100" />
        <Stat label="Shipped" value={numberFmt.format(data?.orderStats?.shipped || 0)} icon={Truck} colorClass="text-purple-600" bg="bg-purple-100" />
        <Stat label="Delivered" value={numberFmt.format(data?.orderStats?.delivered || 0)} icon={CheckCircle} colorClass="text-green-600" bg="bg-green-100" />
        <Stat label="Cancelled" value={numberFmt.format(data?.orderStats?.cancelled || 0)} icon={X} colorClass="text-red-600" bg="bg-red-100" />
      </div>

      {data?.assignedWarehouses?.length ? (
        <SectionCard title="Assigned Warehouses">
          <div className="flex flex-wrap gap-2">
            {data.assignedWarehouses.map((w: any) => (
              <span key={w._id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                {w.name}
              </span>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Recent Orders">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Order ID</th>
                <th className="text-left py-2">Customer</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders || []).map((o: any) => (
                <tr key={o.orderId} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{o.orderId}</td>
                  <td className="py-2">{o.customerInfo?.name}</td>
                  <td className="py-2">{currency(o.pricing?.total)}</td>
                  <td className="py-2"><span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 capitalize">{o.status}</span></td>
                  <td className="py-2">{o.warehouseInfo?.warehouseName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Array.isArray(data?.ordersByDay) && data.ordersByDay.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-1">Orders (7d)</div>
            <Sparkline series={(data.ordersByDay).map((d: { _id: string; total: number }) => ({ label: d._id, value: d.total }))} color="bg-indigo-500" formatter={numberFmt.format} />
          </div>
        )}
      </SectionCard>
    </div>
  )

  // Role: Product & Inventory Management
  const renderInventoryMgmt = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Inventory Dashboard</h2>
        <p className="text-emerald-100">Products, brands and categories overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat label="Total Products" value={numberFmt.format(data?.cards?.totalProducts || 0)} icon={Package} colorClass="text-purple-700" bg="bg-purple-100" />
        <Stat label="Low Stock" value={numberFmt.format(data?.cards?.lowStock || 0)} icon={RefreshCw} colorClass="text-red-600" bg="bg-red-100" />
        <Stat label="Brands" value={numberFmt.format(data?.cards?.brands || 0)} icon={Tag} colorClass="text-blue-700" bg="bg-blue-100" />
        <Stat label="Categories" value={numberFmt.format(data?.cards?.categories || 0)} icon={Grid3X3} colorClass="text-green-700" bg="bg-green-100" />
      </div>

      {data?.assignedWarehouses?.length ? (
        <SectionCard title="Assigned Warehouses">
          <div className="flex flex-wrap gap-2">
            {data.assignedWarehouses.map((w: any) => (
              <span key={w._id} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                {w.name}
              </span>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Low Stock Products">
        <div className="space-y-3">
          {(data?.lowStockProducts || []).map((p: any) => (
            <div key={p._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">Warehouse: {p.warehouse?.name || '—'}</p>
              </div>
              <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-sm">Stock: {p.stock}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )

  // Role: Marketing & Content Manager
  const renderMarketing = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Marketing Dashboard</h2>
        <p className="text-fuchsia-100">Subscribers, content and reach.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Stat label="Active Subscribers" value={numberFmt.format(data?.cards?.subscribers || 0)} icon={Users} colorClass="text-emerald-700" bg="bg-emerald-100" />
        <Stat label="Total Subscribers" value={numberFmt.format(data?.cards?.totalSubscribers || 0)} icon={Users} colorClass="text-emerald-700" bg="bg-emerald-50" />
        <Stat label="Banners" value={numberFmt.format(data?.cards?.banners || 0)} icon={Image} colorClass="text-purple-700" bg="bg-purple-100" />
        <Stat label="Blogs" value={numberFmt.format(data?.cards?.blogs || 0)} icon={BarChart3} colorClass="text-indigo-700" bg="bg-indigo-100" />
        <Stat label="Notices" value={numberFmt.format(data?.cards?.notices || 0)} icon={Bell} colorClass="text-pink-700" bg="bg-pink-100" />
      </div>

      <SectionCard title="Recent Subscribers">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Source</th>
                <th className="text-left py-2">Subscribed At</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentSubscribers || []).map((s: any) => (
                <tr key={s._id} className="border-b border-gray-100">
                  <td className="py-2">{s.email}</td>
                  <td className="py-2 capitalize">{s.source || '—'}</td>
                  <td className="py-2">{new Date(s.subscribedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )

  // Role: Customer Support Executive
  const renderSupport = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-600 to-cyan-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Support Dashboard</h2>
        <p className="text-sky-100">User and enquiry overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat label="Total Users" value={numberFmt.format(data?.userStats?.total || 0)} icon={Users} colorClass="text-blue-700" bg="bg-blue-100" />
        <Stat label="Active Users" value={numberFmt.format(data?.userStats?.active || 0)} icon={Users} colorClass="text-green-700" bg="bg-green-100" />
        <Stat label="New Enquiries" value={numberFmt.format(data?.contactStats?.new || 0)} icon={Mail} colorClass="text-orange-700" bg="bg-orange-100" />
        <Stat label="Total Orders" value={numberFmt.format(data?.orderStats?.total || 0)} icon={ShoppingCart} colorClass="text-purple-700" bg="bg-purple-100" />
      </div>

      <SectionCard title="Recent Enquiries">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Subject</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentContacts || []).map((c: any) => (
                <tr key={c._id} className="border-b border-gray-100">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.email}</td>
                  <td className="py-2">{c.subject}</td>
                  <td className="py-2 capitalize">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )

  // Role: Report & Finance Analyst
  const renderFinance = () => {
    const revenueSeries = data?.revenueByDay || []
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Finance Dashboard</h2>
          <p className="text-amber-100">Revenue and order insights.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Stat label="Total Revenue" value={currency(data?.cards?.totalRevenue || 0)} icon={IndianRupee} colorClass="text-yellow-900" bg="bg-yellow-100" />
          <Stat label="Today" value={currency(data?.cards?.revenueToday || 0)} icon={TrendingUp} colorClass="text-green-700" bg="bg-green-100" />
          <Stat label="This Month" value={currency(data?.cards?.revenueThisMonth || 0)} icon={TrendingUp} colorClass="text-indigo-700" bg="bg-indigo-100" />
          <Stat label="Avg Order Value" value={currency(data?.cards?.avgOrderValue || 0)} icon={BarChart3} colorClass="text-purple-700" bg="bg-purple-100" />
          <Stat label="Total Orders" value={numberFmt.format(data?.cards?.totalOrders || 0)} icon={ShoppingCart} colorClass="text-blue-700" bg="bg-blue-100" />
          <Stat label="Taxes" value={numberFmt.format(data?.cards?.taxes || 0)} icon={Percent} colorClass="text-rose-700" bg="bg-rose-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Revenue (Last 7 days)">
            <div className="space-y-2">
              {revenueSeries.map((d: { _id: string; total: number }) => (
                <div key={d._id} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-600">{d._id}</div>
                  <div className="flex-1 h-3 bg-gray-100 rounded">
                    <div className="h-3 bg-amber-500 rounded" style={{ width: `${Math.min(100, (d.total || 0) / Math.max(1, Math.max(...revenueSeries.map((r: { _id: string; total: number }) => r.total))) * 100)}%` }} />
                  </div>
                  <div className="w-28 text-right text-sm font-medium">{currency(d.total)}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {Array.isArray(data?.ordersByDay) && (
            <SectionCard title="Orders (Last 7 days)">
              <Sparkline series={(data.ordersByDay).map((d: { _id: string; total: number }) => ({ label: d._id, value: d.total }))} color="bg-indigo-500" formatter={numberFmt.format} />
            </SectionCard>
          )}
        </div>
      </div>
    )
  }

  // Render skeleton based on role
  const renderSkeleton = () => {
    switch (role) {
      case 'admin':
        return renderAdminSkeleton()
      case 'order_warehouse_management':
        return renderWarehouseMgmtSkeleton()
      case 'product_inventory_management':
        return renderInventoryMgmtSkeleton()
      case 'marketing_content_manager':
        return renderMarketingSkeleton()
      case 'customer_support_executive':
        return renderSupportSkeleton()
      case 'report_finance_analyst':
        return renderFinanceSkeleton()
      default:
        return renderAdminSkeleton()
    }
  }

  // Render content based on role
  const renderContent = () => {
    if (!data) return null
    switch (role) {
      case 'admin':
        return renderAdmin()
      case 'order_warehouse_management':
        return renderWarehouseMgmt()
      case 'product_inventory_management':
        return renderInventoryMgmt()
      case 'marketing_content_manager':
        return renderMarketing()
      case 'customer_support_executive':
        return renderSupport()
      case 'report_finance_analyst':
        return renderFinance()
      default:
        return renderAdmin()
    }
  }

  return (
    <AdminLayout>
      {renderContent()}
    </AdminLayout>
  )
}