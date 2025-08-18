"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Eye, Package, Truck, CheckCircle, X, RefreshCw, Loader2, Calendar, CreditCard, MapPin, User, Warehouse, Download } from "lucide-react"
import { useAppSelector } from '../lib/store'
import toast from 'react-hot-toast'
import { useDebounce } from '../hooks/use-debounce'
import { useAdminStatsRefresh } from '../lib/hooks/useAdminStatsRefresh'
import WarehousePickingModal from './WarehousePickingModal'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  categoryId?: string | { _id: string; name: string }
  brand?: string
  brandId?: string | { _id: string; name: string }
  locationName?: string // Product location in warehouse
  variantName?: string // Direct variant name field
  variantId?: string // Variant ID for lookup
  selectedVariant?: string | { name: string; [key: string]: any } // Selected variant info
}

interface Order {
  _id: string
  orderId: string
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  createdAt: string
  pricing: {
    total: number
    subtotal: number
    taxAmount: number
    discountAmount: number
    deliveryCharge: number
    codCharge: number
  }
  items: OrderItem[]
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  deliveryInfo: {
    address: {
      building: string
      area: string
      city: string
      state: string
      pincode: string
      landmark?: string
      latitude?: number
      longitude?: number
    }
    estimatedDeliveryTime?: string
  }
  paymentInfo: {
    method: 'cod' | 'online'
    paymentMethod: string
    status: string
  }
  warehouseInfo: {
    warehouseName: string
    warehouseId: string
  }
  assignedDeliveryBoy?: {
    id: string
    name: string
    phone: string
  }
  tracking?: {
    trackingNumber?: string
    carrier?: string
  }
}

const statusConfig = {
  new: { icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
  processing: { icon: Package, color: "text-yellow-600", bg: "bg-yellow-100" },
  shipped: { icon: Truck, color: "text-purple-600", bg: "bg-purple-100" },
  delivered: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  cancelled: { icon: X, color: "text-red-600", bg: "bg-red-100" },
  refunded: { icon: RefreshCw, color: "text-gray-600", bg: "bg-gray-100" },
  pending: { icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
  prepaid: { icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
  paid: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
}

// Function to determine display status based on backend payment status
const getDisplayStatus = (order: Order) => {
  // Use the payment status from the backend
  return order.paymentInfo.status;
}

const statusOptions = ["new", "processing", "shipped", "delivered", "cancelled", "refunded"]

// Type guard to ensure warehouseInfo has the correct structure
const hasValidWarehouseInfo = (order: any): order is Order => {
  return order && 
         order.warehouseInfo && 
         typeof order.warehouseInfo.warehouseName === 'string' && 
         typeof order.warehouseInfo.warehouseId === 'string'
}

// Transform function to ensure order has correct warehouseInfo structure
const normalizeOrder = (order: any): Order => {
  // If warehouseInfo has _id and name instead of warehouseId and warehouseName, transform it
  if (order.warehouseInfo && order.warehouseInfo._id && order.warehouseInfo.name && !order.warehouseInfo.warehouseId) {
    return {
      ...order,
      warehouseInfo: {
        warehouseId: order.warehouseInfo._id,
        warehouseName: order.warehouseInfo.name
      }
    }
  }
  return order as Order
}

interface OrdersTableProps {
  title: string
  statusFilter?: string
  showStatusFilter?: boolean
  showWarehouseFilter?: boolean
  showDeliveryAgentFilter?: boolean // Control whether to show delivery agent filter
  showAssignedColumn?: boolean // Control whether to show the Assigned column
  showStatsCards?: boolean // Control whether to show stats cards
  endpoint?: string // Custom endpoint for different pages
  filterByWarehouse?: boolean // For warehouse-specific filtering
}

export default function OrdersTable({
  title,
  statusFilter,
  showStatusFilter = false,
  showWarehouseFilter = true,
  showDeliveryAgentFilter = false,
  showAssignedColumn = true,
  showStatsCards = false,
  endpoint,
  filterByWarehouse = false
}: OrdersTableProps) {
  const token = useAppSelector((state) => state.auth.token)
  const user = useAppSelector((state) => state.auth.user)
  
  // Delivery agent specific logic
  const isDeliveryAgent = user?.role === 'delivery_boy'
  
  // Automatically show delivery agent filter for specific status sections
  const shouldShowDeliveryAgentFilter = showDeliveryAgentFilter || 
    (statusFilter && ['shipped', 'delivered', 'cancelled', 'refunded'].includes(statusFilter))
  
  // Hide stats cards for delivery agents
  const shouldShowStatsCards = showStatsCards && !isDeliveryAgent
  
  // Hide delivery agent filter for delivery agents (they only see their own orders)
  const shouldShowDeliveryAgentFilterForUser = shouldShowDeliveryAgentFilter && !isDeliveryAgent
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterWarehouse, setFilterWarehouse] = useState("all")
  const [filterDeliveryAgent, setFilterDeliveryAgent] = useState("all")
  const [viewing, setViewing] = useState<Order | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState(["", "", "", ""])
  const [otpSessionId, setOtpSessionId] = useState("")
  const [generatingOtp, setGeneratingOtp] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [deliveryBoys, setDeliveryBoys] = useState<Array<{ id: string, _id?: string, name: string, phone: string, assignedWarehouses: string[], assignedWarehouseIds: string[] }>>([])
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("")
  const [assigningDeliveryBoy, setAssigningDeliveryBoy] = useState(false)
  const [warehouses, setWarehouses] = useState<Array<{ _id: string, name: string }>>([])
  const [warehousesLoading, setWarehousesLoading] = useState(false)
  const [orderStats, setOrderStats] = useState({
    new: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  })
  const [pickingModalOrder, setPickingModalOrder] = useState<Order | null>(null) // Track which order to show picking modal for
  const ORDERS_PER_PAGE = 20

  // Global stats refresh system integration
  const { isRefreshing } = useAdminStatsRefresh({
    onRefresh: async () => {
      // Refresh both orders and stats when global refresh is triggered
      await Promise.all([
        fetchOrders(currentPage),
        shouldShowStatsCards ? fetchOrderStats() : Promise.resolve()
      ]);
    },
    debounceMs: 300,
    enabled: true
  });

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  // Track if search is being processed
  const isSearching = searchTerm !== debouncedSearchTerm

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ORDERS_PER_PAGE.toString()
      })

      // Add filters to query parameters
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse)
      if (showStatusFilter && filterStatus !== 'all') params.append('status', filterStatus)
      if (shouldShowDeliveryAgentFilterForUser && filterDeliveryAgent !== 'all') params.append('deliveryBoyId', filterDeliveryAgent)
      
      // For delivery agents, automatically filter by their assigned orders
      if (isDeliveryAgent) {
        params.append('deliveryBoyId', user.id)
      }

      let apiEndpoint = endpoint || (statusFilter
        ? `${process.env.NEXT_PUBLIC_API_URL}/orders/admin/status/${statusFilter}`
        : `${process.env.NEXT_PUBLIC_API_URL}/orders/admin/all`)
      
      apiEndpoint += `?${params}`

      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      const rawOrders = data.orders || []
      
      // Normalize and transform orders to ensure they have the correct structure
      const normalizedOrders = rawOrders.map(normalizeOrder)
      setOrders(normalizedOrders)

      // Update pagination data
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages)
        setTotalOrders(data.pagination.totalOrders)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [token, debouncedSearchTerm, filterWarehouse, filterStatus, statusFilter, ORDERS_PER_PAGE, endpoint, showStatusFilter, shouldShowDeliveryAgentFilterForUser, filterDeliveryAgent, isDeliveryAgent, user?.id])

  // Fetch delivery agents
  const fetchDeliveryBoys = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?role=delivery_boy`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch delivery agents')
      }

      const data = await response.json()
      const rawDeliveryBoys = data.users || data
      
      // Ensure each delivery agenthas both id and _id for compatibility
      const normalizedDeliveryBoys = rawDeliveryBoys.map((db: any) => ({
        ...db,
        id: db.id || db._id, // Prefer id, fallback to _id
        _id: db._id || db.id, // Keep _id for backend compatibility
      }))
      
      console.log('Fetched delivery agents:', normalizedDeliveryBoys)
      setDeliveryBoys(normalizedDeliveryBoys)
    } catch (error) {
      console.error('Error fetching delivery agents:', error)
      toast.error('Failed to fetch delivery agents')
    }
  }, [token])

  // Fetch warehouses for filter dropdown
  const fetchWarehouses = useCallback(async () => {
    try {
      setWarehousesLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch warehouses')
      }

      const data = await response.json()
      const warehouseList = data.warehouses || data || []
      
      console.log('Fetched warehouses:', warehouseList)
      setWarehouses(warehouseList)
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      // Don't show error toast as this is not critical - fallback to extracting from orders
    } finally {
      setWarehousesLoading(false)
    }
  }, [token])

  // Fetch order stats for stats cards
  const fetchOrderStats = useCallback(async () => {
    if (!shouldShowStatsCards) return // Only fetch if stats cards should be shown
    
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
  }, [token, shouldShowStatsCards])

  // Function to fetch order with product location details
  const fetchOrderWithProductLocations = useCallback(async (order: Order): Promise<Order> => {
    try {
      // Fetch product details for each item to get location information
      const itemsWithLocations = await Promise.all(
        order.items.map(async (item) => {
          try {
            // Use the backend API URL
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${item.productId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              const productData = await response.json()
              return {
                ...item,
                locationName: productData.locationName || 'Location not specified'
              }
            }
            return {
              ...item,
              locationName: 'Location not specified'
            }
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error)
            return {
              ...item,
              locationName: 'Location not specified'
            }
          }
        })
      )
      
      return {
        ...order,
        items: itemsWithLocations
      }
    } catch (error) {
      console.error('Error fetching product locations:', error)
      return order
    }
  }, [token])

  // Function to handle opening picking modal
  const handleOpenPickingModal = useCallback(async (order: Order) => {
    if (!order) return
    
    try {
      // Fetch product details with locations if needed
      const orderWithLocations = await fetchOrderWithProductLocations(order)
      setPickingModalOrder(orderWithLocations)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Failed to load order details')
    }
  }, [fetchOrderWithProductLocations])

  useEffect(() => {
    fetchOrders(1)
    // Only fetch delivery boys if not a delivery agent (they don't need this data)
    if (!isDeliveryAgent) {
      fetchDeliveryBoys()
    }
    // Fetch warehouses for all roles (needed for warehouse filter)
    fetchWarehouses()
    if (shouldShowStatsCards) {
      fetchOrderStats()
    }
  }, [fetchOrders, fetchDeliveryBoys, fetchWarehouses, fetchOrderStats, shouldShowStatsCards, isDeliveryAgent])

  // Fetch orders when filters change
  useEffect(() => {
    setCurrentPage(1)
    fetchOrders(1)
  }, [debouncedSearchTerm, filterWarehouse, filterStatus, filterDeliveryAgent, fetchOrders])

  // Get warehouses for filter dropdown - use fetched warehouses or fallback to extracting from current orders
  const warehouseOptions = warehouses.length > 0 
    ? warehouses 
    : Array.from(
        new Map(
          orders
            .filter(order => order.warehouseInfo.warehouseName) // Filter out empty names
            .map(order => [
              order.warehouseInfo.warehouseName, // Use name as key to remove duplicates
              { 
                _id: order.warehouseInfo.warehouseId, 
                name: order.warehouseInfo.warehouseName 
              }
            ])
        ).values()
      )

  // Filter delivery agents based on user role and warehouse assignments
  const getFilteredDeliveryAgents = () => {
    // Admin can see all delivery agents
    if (user?.role === 'admin') {
      console.log('[Delivery Agent Filter] Admin role - showing all delivery agents:', deliveryBoys.length)
      return deliveryBoys
    }

    // Warehouse managers can only see delivery agents assigned to their warehouses
    if (user?.role === 'order_warehouse_management') {
      // Get the user's assigned warehouse IDs from the current orders or warehouses
      const userWarehouseIds = warehouseOptions.map(w => w._id)
      
      const filtered = deliveryBoys.filter(deliveryBoy => {
        const assignedWarehouses = deliveryBoy.assignedWarehouseIds || deliveryBoy.assignedWarehouses || []
        // Check if delivery agentis assigned to any of the user's warehouses
        return assignedWarehouses.some(warehouseId => 
          userWarehouseIds.includes(warehouseId)
        )
      })
      
      console.log('[Delivery Agent Filter] Warehouse manager role:', {
        userWarehouseIds,
        totalDeliveryBoys: deliveryBoys.length,
        filteredDeliveryBoys: filtered.length,
        filtered: filtered.map(db => ({ name: db.name, assignedWarehouses: db.assignedWarehouseIds || db.assignedWarehouses }))
      })
      
      return filtered
    }

    // For other roles, return all delivery agents
    console.log('[Delivery Agent Filter] Other role - showing all delivery agents:', deliveryBoys.length)
    return deliveryBoys
  }

  const filteredDeliveryAgents = getFilteredDeliveryAgents()

  // Since we're doing server-side filtering and pagination, use orders directly
  const paginatedOrders = orders

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchOrders(newPage)
  }

  const openView = (order: Order) => {
    setViewing(order)
    setStatus(order.status)
    setShowOtpInput(false)
    setOtp(["", "", "", ""])
    setOtpSessionId("")
    // Handle both id and _id formats for assigned delivery boy
    const assignedId = order.assignedDeliveryBoy?.id || (order.assignedDeliveryBoy as any)?._id || ""
    setSelectedDeliveryBoy(assignedId)
  }

  const assignDeliveryBoy = async () => {
    if (!viewing || !selectedDeliveryBoy) return

    try {
      setAssigningDeliveryBoy(true)
      
      // Debug: Log the delivery agents structure and selected value
      console.log('Available delivery agents:', deliveryBoys.map(db => ({ id: db.id, _id: db._id, name: db.name })))
      console.log('Selected delivery agentID:', selectedDeliveryBoy)
      
      // Try to find delivery agent by id first, then by _id as fallback
      let deliveryBoy = deliveryBoys.find(db => db.id === selectedDeliveryBoy)
      if (!deliveryBoy) {
        deliveryBoy = deliveryBoys.find(db => db._id === selectedDeliveryBoy)
      }

      if (!deliveryBoy) {
        console.error('Delivery agent not found. Available IDs:', deliveryBoys.map(db => ({ id: db.id, _id: db._id })))
        throw new Error('Selected delivery agent not found')
      }
      
      console.log('Found delivery boy:', deliveryBoy)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${viewing._id}/assign-delivery`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryBoyId: deliveryBoy._id || deliveryBoy.id, // Use _id for backend compatibility
          deliveryBoyName: deliveryBoy?.name,
          deliveryBoyPhone: deliveryBoy?.phone
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to assign delivery boy'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage)
      }

      toast.success('Delivery agent assigned successfully')
    } catch (error: any) {
      console.error('Error assigning delivery boy:', error)
      const errorMessage = error.message || 'Failed to assign delivery boy'
      toast.error(errorMessage)
      throw error // Re-throw to prevent status update
    } finally {
      setAssigningDeliveryBoy(false)
    }
  }

  const generateDeliveryOtp = async () => {
    if (!viewing) return

    try {
      setGeneratingOtp(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/delivery-otp/${viewing.orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OTP Generation Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate delivery OTP')
      }

      const data = await response.json()
      setOtpSessionId(data.sessionId)
      setShowOtpInput(true)
      
      // Clear previous OTP input when generating/resending
      setOtp(['', '', '', ''])
      
      // Focus on first OTP input
      setTimeout(() => {
        const firstInput = document.getElementById('otp-0')
        if (firstInput) {
          firstInput.focus()
        }
      }, 100)
      
      toast.success('Delivery OTP generated successfully')
    } catch (err) {
      console.error('Error generating delivery OTP:', err)
      toast.error('Failed to generate delivery OTP')
    } finally {
      setGeneratingOtp(false)
    }
  }

  const verifyDeliveryOtp = async () => {
    if (!viewing || !otpSessionId) return

    const otpString = otp.join('')
    if (otpString.length !== 4) {
      toast.error('Please enter complete 4-digit OTP')
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/delivery-verify/${viewing.orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otp: otpString,
          sessionId: otpSessionId,
          note: 'Order delivered - OTP verified'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify delivery OTP')
      }

      const data = await response.json()

      // Update the orders list
      setOrders(orders.map(o =>
        o.orderId === viewing.orderId
          ? { ...o, status: 'delivered' as Order['status'] }
          : o
      ))

      // Refresh orders
      await fetchOrders()

      setViewing(null)
      setShowOtpInput(false)
      setOtp(["", "", "", ""])
      setOtpSessionId("")
      toast.success('Order status updated to delivered successfully')
    } catch (err) {
      console.error('Error verifying delivery OTP:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to verify delivery OTP')
    } finally {
      setUpdating(false)
    }
  }

  // Function to open Google Maps with directions to delivery address
  const openMap = (order: Order) => {
    const { latitude, longitude } = order.deliveryInfo.address
    
    if (latitude && longitude) {
      // Open Google Maps with turn-by-turn directions from current location to coordinates
      const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
      window.open(mapUrl, '_blank')
    } else {
      // Fallback: directions to address if coordinates are not available
      const address = `${order.deliveryInfo.address.building}, ${order.deliveryInfo.address.area}, ${order.deliveryInfo.address.city}, ${order.deliveryInfo.address.state} ${order.deliveryInfo.address.pincode}`
      const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`
      window.open(mapUrl, '_blank')
    }
  }

  // Function to validate status transitions for warehouse managers
  const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
    // Always allow the current status to be shown in dropdown
    if (currentStatus === newStatus) {
      return true
    }

    // Define the status hierarchy (order matters)
    const statusHierarchy = ['new', 'processing', 'shipped', 'delivered']

    // If current status is cancelled or refunded, can't change to other statuses
    if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
      return false
    }

    // If current status is delivered, can only change to refunded
    if (currentStatus === 'delivered') {
      return newStatus === 'refunded'
    }

    // Special cases for warehouse managers - can cancel or refund from active statuses
    if (newStatus === 'cancelled' || newStatus === 'refunded') {
      // Can cancel or refund from any active status (new, processing, shipped, delivered)
      return ['new', 'processing', 'shipped', 'delivered'].includes(currentStatus)
    }

    // For normal progression, check hierarchy
    const currentIndex = statusHierarchy.indexOf(currentStatus)
    const newIndex = statusHierarchy.indexOf(newStatus)

    // If either status is not in hierarchy, allow it (for edge cases)
    if (currentIndex === -1 || newIndex === -1) {
      return true
    }

    // Can only move forward or stay same
    return newIndex >= currentIndex
  }

  // Function to get available status options based on current status and user role
  const getAvailableStatusOptions = (currentStatus: string, userRole: string): string[] => {
    // Super admin can see all options
    if (userRole === 'admin') {
      return statusOptions
    }

    // For delivery agents, show current status + delivered option if current status is shipped
    if (userRole === 'delivery_boy') {
      if (currentStatus === 'shipped') {
        return ['shipped', 'delivered'] // Show both current status and delivered option
      }
      return [currentStatus] // Show only current status for other statuses (disabled dropdown)
    }

    // For warehouse managers, apply restrictions
    if (userRole === 'order_warehouse_management') {
      const availableOptions = statusOptions.filter(option => isValidStatusTransition(currentStatus, option))
      console.log(`[Status Transitions] Current: ${currentStatus}, Role: ${userRole}, Available:`, availableOptions)
      return availableOptions
    }

    // For other roles, return all options (existing behavior)
    return statusOptions
  }

  const updateStatus = async () => {
    if (!viewing || !status) return

    // Check if user is order_warehouse_management role
    const isWarehouseManager = user?.role === 'order_warehouse_management'
    const isDeliveryAgent = user?.role === 'delivery_boy'

    // Delivery agents can only change status from shipped to delivered
    if (isDeliveryAgent) {
      if (viewing.status !== 'shipped' || status !== 'delivered') {
        toast.error('Delivery agents can only change status from shipped to delivered')
        return
      }
      // Generate OTP for delivery verification
      await generateDeliveryOtp()
      return
    }

    // Validate status progression for warehouse managers only
    if (isWarehouseManager && !isValidStatusTransition(viewing.status, status)) {
      // Provide more specific error messages based on the attempted transition
      if (viewing.status === 'refunded' || viewing.status === 'cancelled') {
        toast.error('Cannot change status of refunded or cancelled orders.')
      } else if (status === 'cancelled' || status === 'refunded') {
        toast.error('Invalid status transition. You can only cancel or refund active orders.')
      } else {
        toast.error('Invalid status transition. You can only move orders forward in the process.')
      }
      return
    }

    // If status is being changed to delivered and user is warehouse manager, generate OTP instead
    if (status === 'delivered' && isWarehouseManager) {
      await generateDeliveryOtp()
      return
    }

    // If status is being changed to shipped, check if delivery agent is selected (mandatory for both admin and warehouse managers)
    if (status === 'shipped' && !selectedDeliveryBoy) {
      toast.error('Please select a delivery agent before marking as shipped')
      return
    }

    try {
      setUpdating(true)

      // If changing to shipped and delivery agent is selected, assign delivery agent first
      if (status === 'shipped' && selectedDeliveryBoy) {
        try {
          await assignDeliveryBoy()
        } catch (deliveryBoyError) {
          // If delivery agent assignment fails, don't proceed with status update
          throw new Error('Cannot update status to shipped: Delivery agent assignment failed')
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/status/${viewing.orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          note: `Status updated to ${status} by admin`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update order status')
      }

      const data = await response.json()

      // Update the orders list
      setOrders(orders.map(o =>
        o.orderId === viewing.orderId
          ? { ...o, status: status as Order['status'] }
          : o
      ))

      // Refresh the orders to get updated data
      await fetchOrders()

      setViewing(null)
      
      // Show appropriate success message
      if (status === 'shipped' && selectedDeliveryBoy) {
        //toast.success('Order status updated to shipped and delivery agent assigned successfully')
      } else {
        toast.success('Order status updated successfully')
      }
    } catch (err: any) {
      console.error('Error updating order status:', err)
      toast.error(err.message || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        {shouldShowStatsCards && (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">Manage and track customer orders</p>
            </div>
            {/* Global refresh indicator */}
            {isRefreshing && (
              <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating stats...</span>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        {shouldShowStatsCards && (
          <div className="space-y-4">
            {/* First Row - 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Package className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-indigo-600">{orderStats.new + orderStats.processing + orderStats.shipped + orderStats.delivered + orderStats.cancelled + orderStats.refunded}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New</p>
                    <p className="text-2xl font-bold text-blue-600">{orderStats.new}</p>
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
                    <p className="text-2xl font-bold text-yellow-600">{orderStats.processing}</p>
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
                    <p className="text-2xl font-bold text-purple-600">{orderStats.shipped}</p>
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
                    <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
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
                    <p className="text-2xl font-bold text-red-600">{orderStats.cancelled}</p>
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
                    <p className="text-2xl font-bold text-gray-600">{orderStats.refunded}</p>
                  </div>
                </div>
              </div>

              {/* Empty space for visual balance */}
              <div className="hidden lg:block"></div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
              <input
                type="text"
                placeholder={isSearching ? "Searching..." : "Search by order ID, customer name, or phone..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${isSearching ? 'pr-10' : ''}`}
              />
            </div>
            
            {/* Status Filter */}
            {showStatusFilter && (
              <div className="min-w-[160px]">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            )}
            
            {/* Warehouse Filter */}
            {showWarehouseFilter && (
              <div className="min-w-[180px]">
                <select
                  value={filterWarehouse}
                  onChange={(e) => setFilterWarehouse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="all">All Warehouses</option>
                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Delivery Agent Filter */}
            {shouldShowDeliveryAgentFilterForUser && (
              <div className="min-w-[200px]">
                <select
                  value={filterDeliveryAgent}
                  onChange={(e) => setFilterDeliveryAgent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="all">All Delivery Agents</option>
                  {filteredDeliveryAgents.map((deliveryBoy) => {
                    const dbId = deliveryBoy.id || deliveryBoy._id
                    return (
                      <option key={dbId} value={dbId}>
                        {deliveryBoy.name} - {deliveryBoy.phone}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left py-3 px-3 font-semibold text-xs text-gray-700 w-24">Order ID</th>
          <th className="text-left py-3 px-3 font-semibold text-xs text-gray-700 w-28">Customer</th>
          <th className="text-left py-3 px-3 font-semibold text-xs text-gray-700 w-20">Amount</th>
          <th className="text-center py-3 px-3 font-semibold text-xs text-gray-700 w-24">Status</th>
          <th className="text-center py-3 px-3 font-semibold text-xs text-gray-700 w-28">Warehouse</th>
          {showAssignedColumn && (
            <th className="py-3 px-3 font-semibold text-xs text-gray-700 w-28 text-center">Assigned to</th>
          )}
          <th className="text-center py-3 px-3 font-semibold text-xs text-gray-700 w-32">Actions</th>
        </tr>
      </thead>
      <tbody>
        {paginatedOrders.length === 0 ? (
          <tr>
            <td colSpan={showAssignedColumn ? 7 : 6} className="py-8 text-center text-gray-500">
              {orders.length === 0 ? "No orders found" : "No orders on this page"}
            </td>
          </tr>
        ) : (
          paginatedOrders.map((order) => {
            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon
            const statusColor = statusConfig[order.status as keyof typeof statusConfig].color
            const statusBg = statusConfig[order.status as keyof typeof statusConfig].bg

            const formatAddress = (address: any) => {
              return `${address.building ? address.building + ', ' : ''}${address.city || ''}`
            }

            return (
              <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {/* Order ID */}
                <td className="py-3 px-3">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            <p className="font-semibold text-xs text-gray-900">{order.orderId}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year:'numeric' })}</p>
                            <p className="text-xs text-gray-500">{order.items.length} items</p>
                          </div>
                </td>
                
                {/* Customer */}
                <td className="py-3 px-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-900 truncate" title={order.customerInfo.name}>
                      {order.customerInfo.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate" title={order.customerInfo.email}>
                              {order.customerInfo.email}
                            </div>
                    <div className="text-xs text-gray-500 truncate" title={order.customerInfo.phone}>
                      {order.customerInfo.phone}
                    </div>
                  </div>
                </td>
                
                {/* Amount */}
                <td className="py-3 px-3">
                  <div className="text-xs font-semibold text-gray-900">
                    ₹{Math.ceil(order.pricing.total)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.paymentInfo.method === 'cod' ? 'COD' : 'Online'}
                  </div>
                </td>
                
                {/* Status */}
                <td className="py-3 px-3 text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusBg} ${statusColor}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </td>

                
                {/* Warehouse */}
                <td className="py-3 px-3 text-center">
                  <div className="text-xs text-gray-600 truncate" title={order.warehouseInfo.warehouseName}>
                    {order.warehouseInfo.warehouseName}
                  </div>
                </td>
                
                {/* Assigned to */}
                {showAssignedColumn && (
                  <td className="py-3 px-3 text-center">
                    {order.assignedDeliveryBoy ? (
                      <div className="text-xs text-gray-600 truncate" title={`${order.assignedDeliveryBoy.name} - ${order.assignedDeliveryBoy.phone}`}>
                        {order.assignedDeliveryBoy.name}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">---</span>
                    )}
                  </td>
                )}
                
                {/* Actions */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => openView(order)}
                      className="inline-flex items-center px-2 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => openMap(order)}
                      className="inline-flex items-center px-2 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                      title="View Location on Map"
                    >
                      <MapPin className="h-3 w-3" />
                    </button>
                    {/* Download Invoice Button - Only for warehouse managers and admins */}
                    {(user?.role === 'order_warehouse_management' || user?.role === 'admin') && (
                      <button
                        onClick={() => handleOpenPickingModal(order)}
                        className="inline-flex items-center px-2 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        title="Generate Warehouse Picking List"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    )}
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
          {paginatedOrders.length > 0 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)} of {totalOrders} orders
              </p>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {(() => {
                    const maxVisiblePages = 5;
                    const pages = [];

                    if (totalPages <= maxVisiblePages) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Smart pagination logic
                      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                      // Adjust start if we're near the end
                      const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1);

                      for (let i = adjustedStart; i <= endPage; i++) {
                        pages.push(i);
                      }

                      // Add ellipsis and first/last page if needed
                      if (adjustedStart > 1) {
                        pages.unshift('...');
                        pages.unshift(1);
                      }
                      if (endPage < totalPages) {
                        pages.push('...');
                        pages.push(totalPages);
                      }
                    }

                    return pages.map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-500">...</span>
                      ) : (
                        <button
                          key={page}
                          className={`px-3 py-1 rounded text-sm font-medium border ${currentPage === page ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => handlePageChange(page as number)}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                  <button
                    className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>


      </div>
      {/* Modern Order Details Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Order Details</h3>
                  <p className="text-white/80">#{viewing.orderId}</p>
                </div>
                <button
                  onClick={() => setViewing(null)}
                  className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Status and Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {(() => {
                      const StatusIcon = statusConfig[viewing.status as keyof typeof statusConfig].icon;
                      return <StatusIcon className="w-4 h-4 text-brand-primary" />;
                    })()}
                    <span className="text-sm font-medium text-gray-600">Order Status</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig[viewing.status as keyof typeof statusConfig].bg} ${statusConfig[viewing.status as keyof typeof statusConfig].color}`}>
                    {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-medium text-gray-600">Order Date</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(viewing.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-medium text-gray-600">Payment</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {viewing.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Warehouse className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-medium text-gray-600">Warehouse</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {viewing.warehouseInfo.warehouseName}
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-brand-primary" />
                  <h4 className="font-semibold text-gray-900">Delivery Address</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium">{viewing.customerInfo.name}</p>
                  <p>{viewing.deliveryInfo.address.building}</p>
                  <p>{viewing.deliveryInfo.address.area}</p>
                  <p>{viewing.deliveryInfo.address.city}, {viewing.deliveryInfo.address.state} - {viewing.deliveryInfo.address.pincode}</p>
                  {viewing.deliveryInfo.address.landmark && (
                    <p className="text-gray-500">Near {viewing.deliveryInfo.address.landmark}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 text-brand-primary mr-2" />
                  Order Items ({viewing.items.length})
                </h4>
                <div className="space-y-3">
                  {viewing.items.map((item: OrderItem, index: number) => (
                    <div key={`${item.productId}-${index}`} className="flex items-center p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 ml-4">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {item.name}
                          {(() => {
                            // Enhanced variant name extraction
                            let variantName = null
                            
                            // Priority order for variant name extraction:
                            // 1. Direct variantName field
                            // 2. selectedVariant.name if selectedVariant exists
                            // 3. selectedVariant as string if it's a string
                            // 4. Look up variant in productId.variants array using variantId
                            // 5. Extract from product name if it contains variant info
                            if (item.variantName) {
                              variantName = item.variantName
                            } else if (item.selectedVariant && typeof item.selectedVariant === 'object' && item.selectedVariant.name) {
                              variantName = item.selectedVariant.name
                            } else if (item.selectedVariant && typeof item.selectedVariant === 'string') {
                              variantName = item.selectedVariant
                            } else if (typeof item.productId === 'object' && (item.productId as any).variantName) {
                              variantName = (item.productId as any).variantName
                            } else if (item.variantId && typeof item.productId === 'object' && (item.productId as any).variants) {
                              // Look up variant in the product's variants array
                              const variant = (item.productId as any).variants.find((v: any) => v._id === item.variantId || v.id === item.variantId)
                              if (variant && variant.name) {
                                variantName = variant.name
                              }
                            } else if (item.name && item.name.includes('(') && item.name.includes(')')) {
                              // Fallback: Extract from product name if it contains variant info
                              const match = item.name.match(/\(([^)]+)\)/)
                              if (match && match[1]) {
                                variantName = match[1]
                              }
                            }
                            
                            return variantName ? (
                              <span className="text-sm text-blue-600 font-medium ml-2 bg-blue-50 px-2 py-1 rounded">
                                {variantName}
                              </span>
                            ) : null
                          })()}
                        </h5>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Qty: {item.quantity}</span>
                          {item.brandId && (
                            <span>
                              Brand: {typeof item.brandId === 'object' ? item.brandId.name : (typeof item.brandId === 'string' && item.brandId.length > 20 ? 'Loading...' : item.brandId)}
                            </span>
                          )}
                          {item.categoryId && (
                            <span>
                              Category: {typeof item.categoryId === 'object' ? item.categoryId.name : (typeof item.categoryId === 'string' && item.categoryId.length > 20 ? 'Loading...' : item.categoryId)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{item.price.toFixed(2)} x {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 text-brand-primary mr-2" />
                  Order Summary
                </h4>
                <div className="space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-medium">₹{viewing.pricing.subtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount Applied */}
                  {viewing.pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount Applied</span>
                      <span className="text-green-600 font-medium">-₹{viewing.pricing.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Tax */}
                  {viewing.pricing.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">₹{viewing.pricing.taxAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Delivery Charges */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className={`font-medium ${viewing.pricing.deliveryCharge === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {viewing.pricing.deliveryCharge === 0 ? 'FREE' : `₹${viewing.pricing.deliveryCharge.toFixed(2)}`}
                    </span>
                  </div>

                  {/* COD Charges */}
                  {viewing.pricing.codCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">COD Charges</span>
                      <span className="text-gray-900 font-medium">₹{viewing.pricing.codCharge.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-green-600">₹{Math.ceil(viewing.pricing.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-5 h-5 text-brand-primary" />
                    <h4 className="font-semibold text-gray-900">Customer Information</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{viewing.customerInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{viewing.customerInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{viewing.customerInfo.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Warehouse:</span>
                      <span className="font-medium text-gray-900">{viewing.warehouseInfo.warehouseName}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-5 h-5 text-brand-primary" />
                    <h4 className="font-semibold text-gray-900">Payment Information</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium text-gray-900">
                        {viewing.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Type:</span>
                      <span className="font-medium text-gray-900">{viewing.paymentInfo.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${viewing.paymentInfo.status === 'paid' ? 'text-green-600' : viewing.paymentInfo.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {viewing.paymentInfo.status.charAt(0).toUpperCase() + viewing.paymentInfo.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-lg text-gray-900">₹{Math.ceil(viewing.pricing.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <RefreshCw className="w-5 h-5 text-brand-primary mr-2" />
                  Update Order Status
                </h4>
                <div className="space-y-4">
                  <select
                    className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                      user?.role === 'customer_support_executive' || (user?.role === 'delivery_boy' && viewing?.status !== 'shipped')
                        ? 'bg-gray-100 cursor-not-allowed opacity-60'
                        : ''
                      }`}
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    disabled={user?.role === 'customer_support_executive' || (user?.role === 'delivery_boy' && viewing?.status !== 'shipped')}
                    title={
                      user?.role === 'customer_support_executive' 
                        ? 'Customer Support Executive cannot change order status' 
                        : user?.role === 'delivery_boy' && viewing?.status !== 'shipped'
                        ? 'Delivery agents can only change status from shipped to delivered'
                        : ''
                    }
                  >
                    {getAvailableStatusOptions(viewing?.status || '', user?.role || '').map(opt => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Help text for warehouse managers */}
                  {user?.role === 'order_warehouse_management' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Note: You can only move orders forward in the process. Cancelled and refunded orders cannot be changed.
                    </p>
                  )}

                  {/* Help text for delivery agents */}
                  {user?.role === 'delivery_boy' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Note: You can only change status from 'shipped' to 'delivered' with OTP verification.
                    </p>
                  )}

                  {/* Delivery agent Selection - Only when status is being changed to shipped and not delivery_boy */}
                  {status === 'shipped' && user?.role !== 'customer_support_executive' && user?.role !== 'delivery_boy' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Delivery Agent<span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        value={selectedDeliveryBoy}
                        onChange={e => setSelectedDeliveryBoy(e.target.value)}
                        disabled={assigningDeliveryBoy}
                      >
                        <option value="">Choose a delivery boy...</option>
                        {deliveryBoys
                          .filter(db => (db.assignedWarehouseIds || db.assignedWarehouses).includes(viewing?.warehouseInfo?.warehouseId || ''))
                          .map(deliveryBoy => {
                            // Use _id if id is not available (MongoDB ObjectId fallback)
                            const dbId = deliveryBoy.id || deliveryBoy._id
                            return (
                              <option key={dbId} value={dbId}>
                                {deliveryBoy.name} - {deliveryBoy.phone}
                              </option>
                            )
                          })}
                      </select>
                      {deliveryBoys.filter(db => (db.assignedWarehouseIds || db.assignedWarehouses).includes(viewing?.warehouseInfo?.warehouseId || '')).length === 0 && (
                        <p className="text-sm text-red-600">
                          {user?.role === 'order_warehouse_management' 
                            ? 'No delivery agents assigned to your warehouses' 
                            : 'No delivery agents assigned to this warehouse'
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Show assigned delivery agent info for delivery_boy role */}
                  {user?.role === 'delivery_boy' && viewing?.assignedDeliveryBoy && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Assigned Delivery Agent
                      </label>
                      <div className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100 text-gray-700">
                        {viewing.assignedDeliveryBoy.name} - {viewing.assignedDeliveryBoy.phone}
                      </div>
                      <p className="text-xs text-gray-500">
                        This order is assigned to you. You cannot change the delivery agent.
                      </p>
                    </div>
                  )}

                  {/* Show assigned delivery agent info */}
                  {viewing?.assignedDeliveryBoy && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Assigned Delivery Boy:</span>
                      </div>
                      <div className="mt-1 text-sm text-blue-700">
                        {viewing.assignedDeliveryBoy.name} - {viewing.assignedDeliveryBoy.phone}
                      </div>
                    </div>
                  )}

                  {/* OTP Input for Delivery Status - For warehouse managers and delivery boys */}
                  {showOtpInput && status === 'delivered' && (user?.role === 'order_warehouse_management' || user?.role === 'delivery_boy') && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="text-center">
                        <h5 className="font-medium text-gray-900 mb-2">Enter Delivery OTP</h5>
                        <p className="text-sm text-gray-600 mb-4">Please enter the 4-digit OTP to confirm delivery</p>
                      </div>

                      <div className="flex justify-center space-x-3">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                            placeholder="0"
                          />
                        ))}
                      </div>

                      {/* Resend OTP Link */}
                      <div className="text-center">
                        <button
                          onClick={generateDeliveryOtp}
                          disabled={generatingOtp}
                          className="text-sm text-brand-primary hover:text-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingOtp ? 'Resending...' : 'Resend OTP'}
                        </button>
                      </div>

                      <button
                        onClick={verifyDeliveryOtp}
                        disabled={updating || otp.join('').length !== 4}
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Verifying OTP...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verify OTP & Mark as Delivered
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {user?.role === 'customer_support_executive' ? (
                    <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                      <Eye className="h-4 w-4 inline mr-2" />
                      View Only - Cannot change order status
                    </div>
                  ) : !showOtpInput ? (
                    <button
                      className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      onClick={updateStatus}
                      disabled={updating || status === viewing.status || generatingOtp || assigningDeliveryBoy || (status === 'shipped' && !selectedDeliveryBoy)}
                      title={status === viewing.status ? `Order is already ${status}` : status === 'shipped' && !selectedDeliveryBoy ? 'Please select a delivery boy' : ''}
                    >
                      {generatingOtp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating OTP...
                        </>
                      ) : assigningDeliveryBoy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Assigning Delivery Boy...
                        </>
                      ) : updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Updating Status...
                        </>
                      ) : (() => {
                        // Determine button text and icon based on role, current status, and selected status
                        const isAdmin = user?.role === 'admin'
                        const isWarehouseManager = user?.role === 'order_warehouse_management'
                        const isDeliveryBoy = user?.role === 'delivery_boy'
                        const currentStatus = viewing?.status
                        const selectedStatus = status
                        const isChangingToDelivered = selectedStatus === 'delivered' && currentStatus !== 'delivered'
                        const isChangingToShipped = selectedStatus === 'shipped' && currentStatus !== 'shipped'

                        if (isChangingToDelivered && (isWarehouseManager || isDeliveryBoy)) {
                          return (
                            <>
                              <Package className="h-4 w-4 mr-2" />
                              {isDeliveryBoy ? 'Generate Delivery OTP' : 'Generate Delivery OTP'}
                            </>
                          )
                        } else if (isChangingToDelivered && isAdmin) {
                          return (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Delivered
                            </>
                          )
                        } else if (isChangingToShipped && (selectedDeliveryBoy || isAdmin)) {
                          return (
                            <>
                              <Truck className="h-4 w-4 mr-2" />
                              {selectedDeliveryBoy ? 'Assign & Mark as Shipped' : 'Mark as Shipped'}
                            </>
                          )
                        } else {
                          return (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Update Status
                            </>
                          )
                        }
                      })()}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Picking Modal */}
      {pickingModalOrder && hasValidWarehouseInfo(pickingModalOrder) && (
        <WarehousePickingModal
          order={pickingModalOrder}
          isOpen={!!pickingModalOrder}
          onClose={() => setPickingModalOrder(null)}
        />
      )}
    </div>
  )
}