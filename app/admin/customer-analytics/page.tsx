"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { 
  Search, 
  Eye, 
  Package, 
  Phone, 
  Truck, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Loader2, 
  Calendar, 
  CreditCard, 
  MapPin, 
  User, 
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Star,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import toast from 'react-hot-toast'
import { useDebounce } from '../../../hooks/use-debounce'

interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: string
  firstOrderDate: string
  orderStatuses: {
    new: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    refunded: number
  }
  favoriteCategories: Array<{
    category: string
    count: number
  }>
  favoriteBrands: Array<{
    brand: string
    count: number
  }>
  customerSegment: 'new' | 'regular' | 'vip' | 'at_risk'
  lifetimeValue: number
  orderFrequency: number // orders per month
}

interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  averageOrderValue: number
  totalRevenue: number
  topCustomers: Customer[]
  customerSegments: {
    new: number
    regular: number
    vip: number
    at_risk: number
  }
  monthlyGrowth: number
  repeatPurchaseRate: number
}

export default function CustomerAnalyticsPage() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const router = useRouter()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSegment, setFilterSegment] = useState("all")
  const [filterSortBy, setFilterSortBy] = useState("totalSpent")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const CUSTOMERS_PER_PAGE = 20

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const isSearching = searchTerm !== debouncedSearchTerm

  // Fetch customer analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customer-analytics/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch customer analytics')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      console.error('Error fetching customer analytics:', err)
      toast.error('Failed to load customer analytics')
    }
  }, [token])

  // Fetch customers with pagination and filters
  const fetchCustomers = useCallback(async (page = 1) => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: CUSTOMERS_PER_PAGE.toString()
      })

      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (filterSegment !== 'all') params.append('segment', filterSegment)
      if (filterSortBy) params.append('sortBy', filterSortBy)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customer-analytics/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data = await response.json()
      setCustomers(data.customers || [])
      
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages)
        setTotalCustomers(data.pagination.totalCustomers)
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [token, debouncedSearchTerm, filterSegment, filterSortBy, CUSTOMERS_PER_PAGE])

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'customer_analytics')) {
      router.push("/")
      return
    }
    
    fetchAnalytics()
    fetchCustomers(1)
  }, [user, router, fetchAnalytics, fetchCustomers])

  // Fetch customers when filters change
  useEffect(() => {
    setCurrentPage(1)
    fetchCustomers(1)
  }, [debouncedSearchTerm, filterSegment, filterSortBy, fetchCustomers])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchCustomers(newPage)
  }

  // Handle customer details modal
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
  }

  // Handle export functionality
  const handleExport = async () => {
    try {
      // Dynamically import exceljs for browser
      const ExcelJS = await import('exceljs').then(m => m.default || m)

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Customer Analytics')

      // Define column widths
      const widths = [25, 30, 15, 12, 15, 15, 12, 15]
      sheet.columns = widths.map((w) => ({ width: w })) as any

      // Headers
      const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Avg Order Value', 'Segment', 'Last Order Date']

      // Title and metadata rows
      const brandColor = 'FF2563EB' // Blue color for customer analytics
      const titleRow = sheet.addRow(['Customer Analytics Report'])
      sheet.mergeCells(1, 1, 1, headers.length)
      
      // Apply style to all cells in merged range
      for (let c = 1; c <= headers.length; c++) {
        const cell = titleRow.getCell(c)
        cell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        }
      }
      titleRow.height = 28

      // Metadata rows
      const meta1 = sheet.addRow([`Total Customers: ${totalCustomers}`])
      sheet.mergeCells(2, 1, 2, headers.length)
      meta1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }

      const meta2 = sheet.addRow([`Filters: ${filterSegment !== 'all' ? `Segment=${formatSegment(filterSegment)}` : 'All Segments'} | Sort by: ${filterSortBy}`])
      sheet.mergeCells(3, 1, 3, headers.length)
      meta2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }

      const meta3 = sheet.addRow([`Generated At: ${new Date().toLocaleString()}`])
      sheet.mergeCells(4, 1, 4, headers.length)
      meta3.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }

      sheet.addRow([]) // blank separator

      // Header row starts at 6
      const headerRowIndex = sheet.rowCount + 1
      const headerRow = sheet.addRow(headers)
      headerRow.height = 22
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        }
      })

      // Data rows
      const rows = customers.map(customer => [
        customer.name,
        customer.email,
        customer.phone,
        customer.totalOrders,
        customer.totalSpent,
        customer.averageOrderValue,
        formatSegment(customer.customerSegment),
        customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'
      ])

      rows.forEach((row) => sheet.addRow(row))

      // Freeze panes below header
      sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }]

      // Style data cells and zebra striping
      for (let r = headerRowIndex + 1; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r)
        const isZebra = (r - headerRowIndex) % 2 === 0
        for (let c = 1; c <= headers.length; c++) {
          const cell = row.getCell(c)
          const sourceRow = rows[r - headerRowIndex - 1] || []
          
          // Format numeric columns (Total Orders, Total Spent, Avg Order Value)
          const numericCols = [4, 5, 6] // 1-based indexing
          const isNumeric = numericCols.includes(c) && typeof sourceRow[c - 1] === 'number'
          
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: c === 1 || c === 2 } // Name and Email can wrap
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFF0F0F0' } },
            left: { style: 'thin', color: { argb: 'FFF0F0F0' } },
            bottom: { style: 'thin', color: { argb: 'FFF0F0F0' } },
            right: { style: 'thin', color: { argb: 'FFF0F0F0' } },
          }
          
          if (isNumeric) {
            if (c === 4) { // Total Orders - whole number
              cell.numFmt = '0'
            } else { // Total Spent and Avg Order Value - currency
              cell.numFmt = '#,##0.00'
            }
          }
          
          if (isZebra) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
          }
        }
      }

      // Auto filter
      sheet.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: { row: sheet.rowCount, column: headers.length }
      }

      // Download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `customer-analytics-${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Customer analytics exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export customer analytics')
    }
  }

  // Get customer segment color
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'regular': return 'bg-green-100 text-green-800'
      case 'vip': return 'bg-purple-100 text-purple-800'
      case 'at_risk': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format segment display
  const formatSegment = (segment: string) => {
    switch (segment) {
      case 'new': return 'New'
      case 'regular': return 'Regular'
      case 'vip': return 'VIP'
      case 'at_risk': return 'At Risk'
      case 'inactive': return 'Inactive'
      default: return segment
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'customer_analytics')) {
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

  if (loading && !analytics) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading customer analytics...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="space-y-6">
          {/* Header */}
          <div className="hidden">
            <h1 className="hidden">Customer Analytics</h1>
            <p className="page-subtitle">Comprehensive customer insights and purchase behavior analysis</p>
          </div>

          {/* Analytics Overview Cards */}
          {analytics && (
            <div className="space-y-4">
              {/* First Row - Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.totalCustomers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">New Customers</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.newCustomers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.totalRevenue)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ShoppingBag className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.averageOrderValue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row - Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                      <p className="text-2xl font-bold text-indigo-600">{analytics.monthlyGrowth}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Activity className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Repeat Purchase Rate</p>
                      <p className="text-2xl font-bold text-teal-600">{analytics.repeatPurchaseRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <Users className="h-6 w-6 text-rose-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Returning Customers</p>
                      <p className="text-2xl font-bold text-rose-600">{analytics.returningCustomers}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Segments */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.customerSegments.new}</div>
                    <div className="text-sm text-gray-600">New Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.customerSegments.regular}</div>
                    <div className="text-sm text-gray-600">Regular Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.customerSegments.vip}</div>
                    <div className="text-sm text-gray-600">VIP Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analytics.customerSegments.at_risk}</div>
                    <div className="text-sm text-gray-600">At Risk</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Management Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
                  <p className="text-sm text-gray-600">Manage and analyze customer data</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchCustomers(currentPage)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                  
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterSegment}
                    onChange={(e) => setFilterSegment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="all">All Segments</option>
                    <option value="new">New</option>
                    <option value="regular">Regular</option>
                    <option value="vip">VIP</option>
                    <option value="at_risk">At Risk</option>
                  </select>
                  
                  <select
                    value={filterSortBy}
                    onChange={(e) => setFilterSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="totalSpent">Sort by Total Spent</option>
                    <option value="totalOrders">Sort by Total Orders</option>
                    <option value="averageOrderValue">Sort by Avg Order Value</option>
                    <option value="lastOrderDate">Sort by Last Order</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Segment
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Order
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap  text-center">
                          <div className="text-sm text-gray-900">{customer.totalOrders}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap  text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap  text-center">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(customer.averageOrderValue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap  text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSegmentColor(customer.customerSegment)}`}>
                            {formatSegment(customer.customerSegment)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap  text-center">
                          <div className="text-sm text-gray-900">
                            {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="text-brand-primary hover:text-brand-primary/80"
                            title="View customer details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * CUSTOMERS_PER_PAGE) + 1} to {Math.min(currentPage * CUSTOMERS_PER_PAGE, totalCustomers)} of {totalCustomers} customers
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-brand-primary text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details Modal */}
        {showCustomerModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Customer Details</h3>
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Customer Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 mr-4">Customer Segment</label>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getSegmentColor(selectedCustomer.customerSegment)}`}>
                        {formatSegment(selectedCustomer.customerSegment)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Orders</label>
                      <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Spent</label>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Average Order Value</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedCustomer.averageOrderValue)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">First Order</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedCustomer.firstOrderDate ? formatDate(selectedCustomer.firstOrderDate) : 'No orders'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Last Order</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedCustomer.lastOrderDate ? formatDate(selectedCustomer.lastOrderDate) : 'No orders'}
                    </div>
                  </div>
                </div>

                {/* Order Status Breakdown */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-800">New</span>
                      <span className="text-lg font-bold text-blue-900">{selectedCustomer.orderStatuses?.new || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">Processing</span>
                      <span className="text-lg font-bold text-yellow-900">{selectedCustomer.orderStatuses?.processing || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-purple-800">Shipped</span>
                      <span className="text-lg font-bold text-purple-900">{selectedCustomer.orderStatuses?.shipped || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Delivered</span>
                      <span className="text-lg font-bold text-green-900">{selectedCustomer.orderStatuses?.delivered || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-red-800">Cancelled</span>
                      <span className="text-lg font-bold text-red-900">{selectedCustomer.orderStatuses?.cancelled || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">Refunded</span>
                      <span className="text-lg font-bold text-gray-900">{selectedCustomer.orderStatuses?.refunded || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
