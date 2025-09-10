"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../../components/AdminLayout"
import MobileDeliveryAdminLayout from "../../../../components/MobileDeliveryAdminLayout"
import OrdersTable from "../../../../components/OrdersTable"
import { useAppSelector } from '../../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../../lib/adminAuth'

export default function AdminShippedOrders() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
      router.push("/")
      return
    }
  }, [user, router])

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
            title="Shipped Orders" 
            statusFilter="shipped"
            showStatusFilter={false}
            showWarehouseFilter={true}
            showDeliveryAgentFilter={false}
            showStatsCards={false}
            hideStatusColumn={true}
            showAssignedColumn={false}
          />
        </MobileDeliveryAdminLayout>
      ) : (
        <AdminLayout>
          <OrdersTable 
            title="Shipped Orders" 
            statusFilter="shipped"
            showStatusFilter={false}
            showWarehouseFilter={true}
            showDeliveryAgentFilter={false}
            showStatsCards={true}
          />
        </AdminLayout>
      )}
    </>
  )
} 