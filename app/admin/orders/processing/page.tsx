"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../../components/AdminLayout"
import OrdersTable from "../../../../components/OrdersTable"
import { useAppSelector } from '../../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../../lib/adminAuth'

export default function AdminProcessingOrders() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
      router.push("/")
      return
    }
  }, [user, router])

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
      router.push("/")
      return
    }

  return (
    <AdminLayout>
      <OrdersTable 
        title="Processing Orders" 
        statusFilter="processing"
        showStatusFilter={false}
        showWarehouseFilter={true}
      />
    </AdminLayout>
  )
}