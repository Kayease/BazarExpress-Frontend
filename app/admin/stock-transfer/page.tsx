"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { Search, Filter, Package, Truck, Building2, Clock, IndianRupee, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import AdminLoader from '../../../components/ui/AdminLoader'

// Mock data interfaces
interface StockTransferItem {
  _id: string;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface StockTransfer {
  _id: string;
  transferId: string;
  fromWarehouse: string;
  toWarehouse: string;
  items: StockTransferItem[];
  totalItems: number;
  totalValue: number;
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled';
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function AdminStockTransfer() {
  const user = useAppSelector((state: any) => state.auth.user)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const router = useRouter()

  // Mock data
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([])

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'stock-transfer')) {
      router.push("/")
      return
    }
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [user, router])

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const mockTransfers: StockTransfer[] = [
        {
          _id: '1',
          transferId: 'TR-2024-001',
          fromWarehouse: 'Mumbai Central',
          toWarehouse: 'Mumbai Andheri',
          items: [
            { _id: 'item1', productName: 'Organic Bananas', productImage: '/placeholder.svg', sku: 'BAN-ORG-001', quantity: 50, unitPrice: 120 },
            { _id: 'item2', productName: 'Fresh Milk', productImage: '/placeholder.svg', sku: 'MILK-FRESH-001', quantity: 30, unitPrice: 60 }
          ],
          totalItems: 80,
          totalValue: 7800,
          status: 'completed',
          requestedBy: 'John Manager',
          requestedAt: '2024-01-15T08:00:00Z',
          completedAt: '2024-01-15T14:30:00Z',
          notes: 'Urgent transfer for weekend stock',
          priority: 'high'
        },
        {
          _id: '2',
          transferId: 'TR-2024-002',
          fromWarehouse: 'Delhi North',
          toWarehouse: 'Delhi South',
          items: [
            { _id: 'item3', productName: 'Whole Wheat Bread', productImage: '/placeholder.svg', sku: 'BREAD-WW-001', quantity: 100, unitPrice: 45 },
            { _id: 'item4', productName: 'Eggs', productImage: '/placeholder.svg', sku: 'EGG-FRESH-001', quantity: 200, unitPrice: 80 }
          ],
          totalItems: 300,
          totalValue: 20500,
          status: 'in-transit',
          requestedBy: 'Sarah Supervisor',
          requestedAt: '2024-01-15T10:00:00Z',
          notes: 'Regular stock replenishment',
          priority: 'medium'
        },
        {
          _id: '3',
          transferId: 'TR-2024-003',
          fromWarehouse: 'Bangalore East',
          toWarehouse: 'Bangalore West',
          items: [
            { _id: 'item5', productName: 'Apples', productImage: '/placeholder.svg', sku: 'APPLE-FRESH-001', quantity: 75, unitPrice: 200 },
            { _id: 'item6', productName: 'Rice', productImage: '/placeholder.svg', sku: 'RICE-BASMATI-001', quantity: 25, unitPrice: 150 }
          ],
          totalItems: 100,
          totalValue: 18750,
          status: 'pending',
          requestedBy: 'Mike Coordinator',
          requestedAt: '2024-01-15T12:00:00Z',
          notes: 'New store opening stock',
          priority: 'high'
        },
        {
          _id: '4',
          transferId: 'TR-2024-004',
          fromWarehouse: 'Chennai Central',
          toWarehouse: 'Chennai Airport',
          items: [
            { _id: 'item7', productName: 'Pulses', productImage: '/placeholder.svg', sku: 'PULSE-MIX-001', quantity: 40, unitPrice: 180 }
          ],
          totalItems: 40,
          totalValue: 7200,
          status: 'cancelled',
          requestedBy: 'Lisa Admin',
          requestedAt: '2024-01-14T16:00:00Z',
          notes: 'Cancelled due to stock unavailability',
          priority: 'low'
        }
      ]
      setStockTransfers(mockTransfers)
    }

    if (!loading) {
      generateMockData()
    }
  }, [loading])

  const filteredTransfers = stockTransfers.filter((transfer) => {
    const matchesSearch = 
      transfer.transferId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || transfer.status === filterStatus
    const matchesPriority = filterPriority === "all" || transfer.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const pendingTransfers = stockTransfers.filter(t => t.status === 'pending')
  const inTransitTransfers = stockTransfers.filter(t => t.status === 'in-transit')
  const completedTransfers = stockTransfers.filter(t => t.status === 'completed')
  const totalValue = stockTransfers.reduce((sum, transfer) => sum + transfer.totalValue, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in-transit':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'in-transit':
        return 'text-blue-600 bg-blue-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'stock-transfer')) {
    return <AdminLoader message="Checking permissions..." fullScreen />
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-codGray">Stock Transfer Management</h2>
              <p className="text-gray-600">Manage inventory movement between warehouses</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-codGray">Stock Transfer Management</h2>
            <p className="text-gray-600">Manage inventory movement between warehouses</p>
          </div>
          <button
            className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Transfer</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transfers</p>
                <p className="text-2xl font-bold text-codGray">{stockTransfers.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingTransfers.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">{inTransitTransfers.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  <IndianRupee className="inline h-5 w-5" />
                  {totalValue.toLocaleString()}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-transit">In Transit</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-separate border-spacing-y-1">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-6 font-medium text-sm">Transfer ID</th>
                  <th className="text-left py-3 px-6 font-medium text-sm">From → To</th>
                  <th className="text-left py-3 px-6 font-medium text-sm">Items</th>
                  <th className="text-left py-3 px-6 font-medium text-sm">Total Value</th>
                  <th className="text-left py-3 px-6 font-medium text-sm">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-sm">Priority</th>
                  <th className="text-left py-3 px-6 font-medium text-sm">Requested</th>
                  <th className="text-left py-3 px-6 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer._id} className="bg-white hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <p className="font-medium text-codGray">{transfer.transferId}</p>
                      <p className="text-sm text-gray-500">{transfer.requestedBy}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm text-codGray">{transfer.fromWarehouse}</p>
                        <p className="text-xs text-gray-500">→</p>
                        <p className="text-sm text-codGray">{transfer.toWarehouse}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {transfer.items.map((item) => (
                          <div key={item._id} className="flex items-center space-x-2">
                            <span className="text-sm text-codGray">{item.productName}</span>
                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Total: {transfer.totalItems} items</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-green-600">
                        <IndianRupee className="inline h-4 w-4" />
                        {transfer.totalValue.toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                        {getStatusIcon(transfer.status)}
                        <span className="capitalize">{transfer.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(transfer.priority)}`}>
                        <span className="capitalize">{transfer.priority}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600">
                        {new Date(transfer.requestedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transfer.requestedAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button className="text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
                          View Details
                        </button>
                        {transfer.status === 'pending' && (
                          <button className="text-green-600 hover:text-green-700 text-sm">
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransfers.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No stock transfers found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
