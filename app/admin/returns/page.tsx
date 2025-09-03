"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  RefreshCw, 
  Eye, 
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserCheck,
  AlertCircle
} from "lucide-react"
import toast from "react-hot-toast"
import Image from "next/image"
import ReturnDetailsModal from "../../../components/ReturnDetailsModal"

interface ReturnItem {
  _id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  returnReason: string
  returnStatus: string
  refundAmount?: number
}

interface ReturnRequest {
  _id: string
  returnId: string
  orderId: string
  userId: {
    _id: string
    name: string
    email: string
    phone: string
  }
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  items: ReturnItem[]
  status: string
  returnReason: string
  pickupInfo: {
    address: any
    pickupInstructions?: string
  }
  assignedPickupAgent?: {
    id: string
    name: string
    phone: string
    assignedAt: string
  }
  warehouseInfo: {
    warehouseId: string
    warehouseName: string
  }
  createdAt: string
  updatedAt: string
  statusHistory: Array<{
    status: string
    timestamp: string
    updatedBy: any
    note: string
  }>
  refundPreference?: {
    method?: 'upi' | 'bank'
    upiId?: string
    bankDetails?: {
      accountHolderName?: string
      accountNumber?: string
      ifsc?: string
      bankName?: string
    }
  }
}

interface ReturnStats {
  requested: number
  approved: number
  pickup_assigned: number
  pickup_rejected: number
  picked_up: number
  received: number
  partially_refunded: number
  refunded: number
  rejected: number
}

export default function AdminReturns() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const router = useRouter()

  // State management
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReturnStats>({
    requested: 0,
    approved: 0,
    pickup_assigned: 0,
    pickup_rejected: 0,
    picked_up: 0,
    received: 0,
    partially_refunded: 0,
    refunded: 0,
    rejected: 0
  })

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState({
    status: 'all',
    warehouseId: 'all',
    assignedAgent: 'all',
    search: ''
  })

  // Modal states
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)

  // Assignment states
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [assignmentNote, setAssignmentNote] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Refund states
  const [refundItems, setRefundItems] = useState<{[key: string]: {refundAmount: number, selected: boolean}}>({})
  const [refundMethod, setRefundMethod] = useState('original_payment')
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)

  // Warehouses for filtering
  const [warehouses, setWarehouses] = useState<any[]>([])

  // Row-level UI state for actions
  const [rowStatus, setRowStatus] = useState<Record<string, string>>({})
  const [rowAgent, setRowAgent] = useState<Record<string, string>>({})
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({})
  const [rowResending, setRowResending] = useState<Record<string, boolean>>({})

  // Check access
  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
      router.push("/")
      return
    }
  }, [user, router])

  // Fetch returns data
  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.warehouseId !== 'all' && { warehouseId: filters.warehouseId }),
        ...(filters.assignedAgent !== 'all' && { assignedAgent: filters.assignedAgent }),
      })

      const endpoint = user?.role === 'delivery_boy' 
        ? `/returns/delivery/assigned?${queryParams}`
        : `/returns/admin/all?${queryParams}`

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch returns')
      }

      const data = await response.json()
      setReturns(data.returns || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.totalCount || 0)
      
      if (data.stats && user?.role !== 'delivery_boy') {
        setStats(data.stats)
      }

    } catch (error) {
      console.error('Error fetching returns:', error)
      toast.error('Failed to fetch return requests')
    } finally {
      setLoading(false)
    }
  }, [token, currentPage, filters, user?.role])

  // Fetch delivery agents for assignment
  const fetchDeliveryAgents = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?role=delivery_boy&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeliveryAgents(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching delivery agents:', error)
    }
  }, [token])

  // Fetch warehouses for filtering
  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // API returns an array of warehouses directly
        setWarehouses(Array.isArray(data) ? data : (data.warehouses || []))
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }, [token])

  // Initial data fetch
  useEffect(() => {
    if (token && user) {
      fetchReturns()
      if (user.role !== 'delivery_boy') {
        fetchDeliveryAgents()
        fetchWarehouses()
      }
    }
  }, [token, user, fetchReturns, fetchDeliveryAgents, fetchWarehouses])

  // Handle status update
  const handleStatusUpdate = async (returnId: string, newStatus: string, note: string = '') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${returnId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, note })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      toast.success('Status updated successfully')
      fetchReturns()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  const getAvailableReturnStatusOptions = (status: string, role: string) => {
    const map: Record<string, string[]> = {
      requested: ['approved', 'rejected'],
      approved: ['pickup_assigned', 'rejected'],
      pickup_assigned: [],
      pickup_rejected: ['approved', 'pickup_assigned', 'rejected'],
      picked_up: ['received'],
      received: ['partially_refunded', 'refunded'],
      partially_refunded: ['refunded'],
      refunded: [],
      rejected: []
    }
    if (role === 'delivery_boy') return []
    return map[status] || []
  }

  const resendPickupOtp = async (ret: ReturnRequest) => {
    if (!ret?.returnId || !ret?.assignedPickupAgent?.id) return
    try {
      setRowResending(prev => ({ ...prev, [ret.returnId]: true }))
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${ret.returnId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pickup_assigned', assignedPickupAgent: ret.assignedPickupAgent.id, note: 'Resend pickup OTP' })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to resend OTP')
      }
      toast.success('Pickup OTP resent')
      fetchReturns()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to resend OTP')
    } finally {
      setRowResending(prev => ({ ...prev, [ret.returnId]: false }))
    }
  }

  // Handle pickup agent assignment
  const handleAssignAgent = async () => {
    if (!selectedReturn || !selectedAgent) {
      toast.error('Please select a delivery agent')
      return
    }

    try {
      setIsAssigning(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${selectedReturn.returnId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'pickup_assigned',
          assignedPickupAgent: selectedAgent,
          note: assignmentNote || 'Pickup agent assigned'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign agent')
      }

      toast.success('Pickup agent assigned successfully')
      setShowAssignModal(false)
      setSelectedAgent('')
      setAssignmentNote('')
      fetchReturns()
    } catch (error) {
      console.error('Error assigning agent:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assign agent')
    } finally {
      setIsAssigning(false)
    }
  }

  // Handle delivery agent pickup actions
  const handlePickupAction = async (returnId: string, action: 'reject' | 'picked_up', note: string = '') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${returnId}/pickup`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, note })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} pickup`)
      }

      const actionText = action === 'reject' ? 'rejected' : 'marked as picked up'
      toast.success(`Return ${actionText} successfully`)
      fetchReturns()
    } catch (error) {
      console.error(`Error ${action} pickup:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${action} pickup`)
    }
  }

  // Handle refund processing
  const handleProcessRefund = async () => {
    if (!selectedReturn) return

    const selectedItems = Object.entries(refundItems)
      .filter(([_, item]) => item.selected)
      .map(([itemId, item]) => ({
        itemId,
        refundAmount: item.refundAmount
      }))

    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to refund')
      return
    }

    try {
      setIsProcessingRefund(true)
      
      console.log('🔍 Processing refund for return:', selectedReturn.returnId)
      console.log('📦 Selected items for refund:', selectedItems)
      console.log('💳 Refund method:', refundMethod)
      console.log('📋 Return status:', selectedReturn.status)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${selectedReturn.returnId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: selectedItems,
          refundMethod: selectedReturn.refundPreference?.method ? 'original_payment' : refundMethod
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process refund')
      }

      toast.success('Refund processed successfully')
      setShowRefundModal(false)
      setRefundItems({})
      fetchReturns()
    } catch (error) {
      console.error('Error processing refund:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process refund')
    } finally {
      setIsProcessingRefund(false)
    }
  }

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    const statusMap: {[key: string]: {color: string, bgColor: string, icon: any}} = {
      requested: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
      approved: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
      pickup_assigned: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: UserCheck },
      pickup_rejected: { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
      picked_up: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Truck },
      received: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: Package },
      partially_refunded: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: RefreshCw },
      refunded: { color: 'text-green-600', bgColor: 'bg-green-100', icon: RefreshCw },
      rejected: { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle }
    }
    return statusMap[status] || { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'orders')) {
    return (
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role === 'delivery_boy' ? 'My Return Pickups' : 'Return Orders'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'delivery_boy' 
                ? 'Manage your assigned return pickups' 
                : 'Manage customer return requests and refunds'
              }
            </p>
          </div>
        </div>

        {/* Stats Cards - Only for admin/warehouse managers */}
        {user?.role !== 'delivery_boy' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Object.entries(stats).map(([status, count]) => {
              const statusInfo = getStatusInfo(status)
              const StatusIcon = statusInfo.icon
              return (
                <div key={status} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-semibold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {formatStatus(status)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Filters - Only for admin/warehouse managers */}
        {user?.role !== 'delivery_boy' && (
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="pickup_assigned">Pickup Assigned</option>
                  <option value="pickup_rejected">Pickup Rejected</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="received">Received</option>
                  <option value="partially_refunded">Partially Refunded</option>
                  <option value="refunded">Refunded</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select
                  value={filters.warehouseId}
                  onChange={(e) => setFilters(prev => ({ ...prev, warehouseId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Warehouses</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
                <select
                  value={filters.assignedAgent}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignedAgent: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Agents</option>
                  <option value="unassigned">Unassigned</option>
                  {deliveryAgents.map(agent => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCurrentPage(1)
                    fetchReturns()
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Returns Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {user?.role !== 'delivery_boy' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Agent
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={user?.role === 'delivery_boy' ? 6 : 7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'delivery_boy' ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
                      No return requests found
                    </td>
                  </tr>
                ) : (
                  returns.map((returnRequest) => {
                    const statusInfo = getStatusInfo(returnRequest.status)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <tr key={returnRequest._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {returnRequest.returnId}
                            </div>
                            <div className="text-sm text-gray-500">
                              Order: {returnRequest.orderId}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {returnRequest.customerInfo.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {returnRequest.customerInfo.phone}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {returnRequest.items.length} item{returnRequest.items.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₹{returnRequest.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {formatStatus(returnRequest.status)}
                          </span>
                        </td>
                        
                        {user?.role !== 'delivery_boy' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {returnRequest.assignedPickupAgent ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {returnRequest.assignedPickupAgent.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {returnRequest.assignedPickupAgent.phone}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not assigned</span>
                            )}
                          </td>
                        )}
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(returnRequest.createdAt).toLocaleDateString()}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2 items-center">
                            <button
                              onClick={() => {
                                setSelectedReturn(returnRequest)
                                setShowDetailsModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {/* Map button to pickup location */}
                            {returnRequest?.pickupInfo?.address?.lat && returnRequest?.pickupInfo?.address?.lng && (
                              <a
                                href={`https://www.google.com/maps?q=${returnRequest.pickupInfo.address.lat},${returnRequest.pickupInfo.address.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800"
                                title="Open in Maps"
                              >
                                <MapPin className="h-4 w-4" />
                              </a>
                            )}
                            {/* Refund actions removed: status updates are handled inside ReturnDetailsModal */}
                            
                            {/* Only View and Map should appear across all roles */}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>


      </div>
              {/* Details Modal */}
              {showDetailsModal && selectedReturn && (
          <ReturnDetailsModal
            open={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            data={selectedReturn as any}
            role={user?.role}
            deliveryAgents={deliveryAgents}
            onUpdateStatus={async (status, note) => {
              await handleStatusUpdate(selectedReturn.returnId, status, note)
              setShowDetailsModal(false)
            }}
            onAssignPickup={async (agentId, note) => {
              // reuse existing API call path
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${selectedReturn.returnId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pickup_assigned', assignedPickupAgent: agentId, note: note || 'Pickup agent assigned' })
              })
              fetchReturns()
              setShowDetailsModal(false)
            }}
            onPickupAction={async (action, note) => {
              await handlePickupAction(selectedReturn.returnId, action, note)
              setShowDetailsModal(false)
            }}
            onVerifyPickupOtp={async (otp) => {
              // Verify OTP endpoint
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${selectedReturn.returnId}/verify-otp`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp })
              })
              fetchReturns()
            }}
            onGeneratePickupOtp={async (returnId) => {
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${returnId}/resend-otp`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                })
                if (!response.ok) {
                  throw new Error('Failed to generate pickup OTP')
                }
                toast.success('Pickup OTP sent to customer successfully!')
              } catch (error) {
                console.error('Error generating pickup OTP:', error)
                toast.error('Failed to send pickup OTP. Please try again.')
                throw error
              }
            }}
          />
        )}

        {/* Assign Agent Modal */}
        {showAssignModal && selectedReturn && user?.role !== 'delivery_boy' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Assign Pickup Agent</h2>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Delivery Agent
                    </label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose an agent...</option>
                      {deliveryAgents.map(agent => (
                        <option key={agent._id} value={agent._id}>
                          {agent.name} - {agent.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignment Note (Optional)
                    </label>
                    <textarea
                      value={assignmentNote}
                      onChange={(e) => setAssignmentNote(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any special instructions..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignAgent}
                      disabled={!selectedAgent || isAssigning}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isAssigning ? 'Assigning...' : 'Assign Agent'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedReturn && user?.role !== 'delivery_boy' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Process Refund</h2>
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Items to Refund */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Items to Refund</h3>
                    <div className="space-y-3">
                      {selectedReturn.items.map((item) => (
                        <div key={item._id} className={`flex items-center space-x-3 p-3 border rounded-lg ${item.returnStatus === 'refunded' ? 'bg-gray-50 opacity-60' : ''}`}>
                          {item.returnStatus !== 'refunded' ? (
                            <input
                              type="checkbox"
                              checked={refundItems[item._id]?.selected || false}
                              onChange={(e) => {
                                setRefundItems(prev => ({
                                  ...prev,
                                  [item._id]: {
                                    ...prev[item._id],
                                    selected: e.target.checked
                                  }
                                }))
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          ) : (
                            <div className="h-4 w-4 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ₹{item.price}
                            </p>
                            {item.returnStatus === 'refunded' && (
                              <p className="text-xs text-green-600 font-medium">Already Refunded: ₹{item.refundAmount}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {item.returnStatus !== 'refunded' ? (
                              <>
                                <label className="block text-xs text-gray-600 mb-1">Refund Amount</label>
                                <input
                                  type="number"
                                  value={refundItems[item._id]?.refundAmount || (item.price * item.quantity)}
                                  onChange={(e) => {
                                    setRefundItems(prev => ({
                                      ...prev,
                                      [item._id]: {
                                        ...prev[item._id],
                                        refundAmount: parseFloat(e.target.value) || 0
                                      }
                                    }))
                                  }}
                                  className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
                                  min="0"
                                  max={item.price * item.quantity}
                                  step="0.01"
                                />
                              </>
                            ) : (
                              <span className="text-sm text-green-600 font-medium">Refunded</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Refund Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Method
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="original_payment">Original Payment Method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="wallet">Wallet Credit</option>
                    </select>
                  </div>

                  {/* Total Refund Amount */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Refund Amount:</span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{Object.entries(refundItems)
                          .filter(([_, item]) => item.selected)
                          .reduce((sum, [_, item]) => sum + item.refundAmount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRefundModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProcessRefund}
                      disabled={isProcessingRefund || Object.values(refundItems).every(item => !item.selected)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isProcessingRefund ? 'Processing...' : 'Process Refund'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  )
}