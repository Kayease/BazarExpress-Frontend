"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import MobileDeliveryAdminLayout from "../../../components/MobileDeliveryAdminLayout"
import OrdersTable from "../../../components/OrdersTable"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'



export default function AdminOrders() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const [orderStats, setOrderStats] = useState({
    new: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  })
  const router = useRouter()

  const fetchOrderStats = useCallback(async () => {
    try {
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
    }
  }, [token])

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
      router.push("/")
      return
    }
    fetchOrderStats()
  }, [user, router, fetchOrderStats])

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
    return user?.role === 'delivery_boy' ? (
      <MobileDeliveryAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this section.</p>
          </div>
        </div>
      </MobileDeliveryAdminLayout>
    ) : (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this section.</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <>
      {user?.role === 'delivery_boy' ? (
        <MobileDeliveryAdminLayout>
          <OrdersTable 
            title="All Orders"
            showStatusFilter={true}
            showWarehouseFilter={true}
            showDeliveryAgentFilter={false}
            showStatsCards={false}
            hideWarehouseColumn={true}
            showAssignedColumn={false}
          />
        </MobileDeliveryAdminLayout>
      ) : (
        <AdminLayout>
          <OrdersTable 
            title="All Orders"
            showStatusFilter={true}
            showWarehouseFilter={true}
            showDeliveryAgentFilter={true}
            showStatsCards={true}
          />
        </AdminLayout>
      )}
    </>
  )
}