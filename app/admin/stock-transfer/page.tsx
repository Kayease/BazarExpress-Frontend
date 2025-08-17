"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { Search, Filter, Package, Truck, Building2, Clock, IndianRupee, Plus, CheckCircle, XCircle, AlertCircle, Eye, Calendar, Download } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import AdminLoader from '../../../components/ui/AdminLoader'
import DateRangePicker from '../../../components/ui/DateRangePicker'
import StockTransferModal from '../../../components/StockTransferModal'
import StockTransferDetailsModal from '../../../components/StockTransferDetailsModal'
import StockTransferReportModal from '../../../components/StockTransferReportModal'
import toast from 'react-hot-toast'

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
  fromWarehouseDetails?: Warehouse;
  toWarehouseDetails?: Warehouse;
  items: StockTransferItem[];
  totalItems: number;
  totalValue: number;
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

interface Warehouse {
  _id: string;
  name: string;
  address: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  contactPhone: string;
  email: string;
  capacity: number;
  status: 'active' | 'inactive';
}

export default function AdminStockTransfer() {
  const user = useAppSelector((state: any) => state.auth.user)
  const token = useAppSelector((state: any) => state.auth.token)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const router = useRouter()

  // Stock transfers data
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([])

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'stock-transfer')) {
      router.push("/")
      return
    }
    
    // Only fetch data if token is available
    if (token) {
      fetchWarehouses()
      fetchStockTransfers()
      setLoading(false)
    } else {
      router.push("/")
    }
  }, [user, token, router])

  // Fetch warehouses
  const fetchWarehouses = async () => {
    if (!token) {
      console.error('No token available for warehouse fetch')
      return
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch warehouses' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const warehousesData = await response.json();
      console.log('Fetched warehouses:', warehousesData);
      
      // Ensure we have an array and filter for active warehouses
      const activeWarehouses = Array.isArray(warehousesData) 
        ? warehousesData.filter(warehouse => warehouse.status !== 'inactive')
        : [];
      
      setWarehouses(activeWarehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to fetch warehouses: ${errorMessage}`);
      // Set empty array on error
      setWarehouses([]);
    }
  }



  const filteredTransfers = stockTransfers.filter((transfer) => {
    const matchesSearch = 
      transfer.transferId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toWarehouse.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || transfer.status === filterStatus
    
    let matchesDateRange = true
    if (startDate && endDate) {
      const transferDate = new Date(transfer.createdAt)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59) // Include the entire end date
      matchesDateRange = transferDate >= start && transferDate <= end
    }
    
    return matchesSearch && matchesStatus && matchesDateRange
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

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start)
    setEndDate(end)
  }

  // Fetch stock transfers from API
  const fetchStockTransfers = async () => {
    if (!token) {
      console.error('No token available for stock transfers fetch')
      return
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock-transfers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch stock transfers' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Fetched stock transfers:', result);
      
      if (result.success && Array.isArray(result.data)) {
        // Transform API data to match frontend interface
        const transformedTransfers = result.data.map((transfer: any) => ({
          _id: transfer._id,
          transferId: transfer.transferId,
          fromWarehouse: transfer.fromWarehouse?.name || 'Unknown',
          toWarehouse: transfer.toWarehouse?.name || 'Unknown',
          fromWarehouseDetails: transfer.fromWarehouse ? {
            _id: transfer.fromWarehouse._id,
            name: transfer.fromWarehouse.name,
            address: transfer.fromWarehouse.address || '',
            location: transfer.fromWarehouse.location || { lat: null, lng: null },
            contactPhone: transfer.fromWarehouse.contactPhone || '',
            email: transfer.fromWarehouse.email || '',
            capacity: transfer.fromWarehouse.capacity || 0,
            status: transfer.fromWarehouse.status || 'active'
          } : undefined,
          toWarehouseDetails: transfer.toWarehouse ? {
            _id: transfer.toWarehouse._id,
            name: transfer.toWarehouse.name,
            address: transfer.toWarehouse.address || '',
            location: transfer.toWarehouse.location || { lat: null, lng: null },
            contactPhone: transfer.toWarehouse.contactPhone || '',
            email: transfer.toWarehouse.email || '',
            capacity: transfer.toWarehouse.capacity || 0,
            status: transfer.toWarehouse.status || 'active'
          } : undefined,
          items: transfer.items.map((item: any) => ({
            _id: item.product?._id || item._id,
            productName: item.productName,
            productImage: item.product?.image || item.product?.mainImage || '/placeholder.svg',
            sku: item.sku,
            mainSku: item.mainSku || item.product?.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            variantKey: item.variantKey,
            variantName: item.variantName
          })),
          totalItems: transfer.totalItems,
          totalValue: transfer.totalValue,
          status: transfer.status,
          createdAt: transfer.createdAt,
          completedAt: transfer.completedAt,
          notes: transfer.notes
        }));
        
        setStockTransfers(transformedTransfers);
      } else {
        setStockTransfers([]);
      }
    } catch (error) {
      console.error('Error fetching stock transfers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to fetch stock transfers: ${errorMessage}`);
      setStockTransfers([]);
    }
  }

  // Handle stock transfer creation
  const handleCreateTransfer = async (transferData: {
    fromWarehouse: string;
    toWarehouse: string;
    items: any[];
    notes?: string;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock-transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          fromWarehouse: transferData.fromWarehouse,
          toWarehouse: transferData.toWarehouse,
          items: transferData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            variantKey: item.variantKey,
            variantDetails: item.variantDetails
          })),
          notes: transferData.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create stock transfer' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Stock transfer created successfully');
        // Refresh the transfers list
        fetchStockTransfers();
      } else {
        throw new Error(result.error || 'Failed to create stock transfer');
      }
    } catch (error) {
      console.error('Error creating stock transfer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create stock transfer: ${errorMessage}`);
      throw error;
    }
  }

  // Handle viewing transfer details
  const handleViewDetails = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer)
    setShowDetailsModal(true)
  }

  // Handle downloading transfer report
  const handleDownloadReport = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer)
    setShowReportModal(true)
  }

  // Handle status update
  const handleStatusUpdate = async (transferId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock-transfers/${transferId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status: newStatus,
          notes: notes 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update transfer status' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Transfer status updated successfully');
        // Refresh the transfers list
        fetchStockTransfers();
      } else {
        throw new Error(result.error || 'Failed to update transfer status');
      }
    } catch (error) {
      console.error('Error updating transfer status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update transfer status: ${errorMessage}`);
      throw error;
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
      <div className="space-y-6" data-testid="stock-transfer-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-codGray">Stock Transfer Management</h2>
            <p className="text-gray-600">Manage inventory movement between warehouses</p>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
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

        {/* Filters - Only show when there are transfers */}
        {stockTransfers.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
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
              <div className="flex items-center justify-center">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder="Date Range"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {stockTransfers.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              {/* Empty State Icon */}
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Truck className="w-12 h-12 text-blue-500" />
              </div>
              
              {/* Empty State Text */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Stock Transfers Yet</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                Get started by creating your first stock transfer between warehouses. 
                This will help you manage inventory movement efficiently.
              </p>
              
              {/* Call to Action */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Transfer</span>
                </button>
              </div>
              
              {/* Additional Info */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Inventory Management</h4>
                  <p className="text-sm text-gray-600">Efficiently move stock between locations</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Warehouse Coordination</h4>
                  <p className="text-sm text-gray-600">Coordinate transfers across multiple warehouses</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Truck className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Track Progress</h4>
                  <p className="text-sm text-gray-600">Monitor transfer status and completion</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Table View (when transfers exist)
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left border-separate border-spacing-y-1">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-6 font-medium text-sm">Transfer ID</th>
                    <th className="text-center py-3 px-6 font-medium text-sm">From → To</th>
                    <th className="text-center py-3 px-6 font-medium text-sm">Items</th>
                    <th className="text-center py-3 px-6 font-medium text-sm">Total Value</th>
                    <th className="text-center py-3 px-6 font-medium text-sm">Status</th>
                    <th className="text-center py-3 px-6 font-medium text-sm">Last Updated</th>
                    <th className="text-center py-3 px-6 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((transfer) => (
                    <tr key={transfer._id} className="bg-white hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <p className="font-semibold  text-codGray">{transfer.transferId}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div>
                          <p className="text-sm text-codGray">{transfer.fromWarehouse}</p>
                          <p className="text-xs text-gray-500">→</p>
                          <p className="text-sm text-codGray">{transfer.toWarehouse}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-codGray">{transfer.totalItems}</p>
                          <p className="text-xs text-gray-500">items</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <p className="font-medium text-green-600">
                          <IndianRupee className="inline h-4 w-4" />
                          {transfer.totalValue.toLocaleString()}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {getStatusIcon(transfer.status)}
                          <span className="capitalize">{transfer.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <p className="text-sm text-gray-600">
                          {new Date(transfer.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transfer.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleViewDetails(transfer)}
                            className="inline-flex items-center space-x-1 text-brand-primary hover:text-brand-primary-dark text-sm font-medium px-2 py-1 rounded-lg hover:bg-brand-primary/10 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                          <button 
                            onClick={() => handleDownloadReport(transfer)}
                            className="inline-flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span>Report</span>
                          </button>
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
        )}
      </div>

      {/* Stock Transfer Modal */}
      <StockTransferModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSubmit={handleCreateTransfer}
      />

      {/* Stock Transfer Details Modal */}
      {showDetailsModal && selectedTransfer && (
        <StockTransferDetailsModal
          viewing={selectedTransfer}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedTransfer(null)
          }}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={() => {
            // Refresh the transfers list if needed
            // This could trigger a re-fetch from the API
          }}
          userRole={user?.role}
        />
      )}

      {/* Stock Transfer Report Modal */}
      {showReportModal && selectedTransfer && (
        <StockTransferReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false)
            setSelectedTransfer(null)
          }}
          transferData={selectedTransfer}
        />
      )}
    </AdminLayout>
  )
}
