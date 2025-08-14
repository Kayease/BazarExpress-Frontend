"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { Search, Filter, ShoppingCart, User, Users, Clock, IndianRupee, Mail, Eye, Loader2, AlertCircle } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import AdminLoader from '../../../components/ui/AdminLoader'
import AbandonedCartDetailModal from '../../../components/AbandonedCartDetailModal'

// API interfaces
interface AbandonedCartItem {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  addedAt: string;
}

interface AbandonedCart {
  _id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  phone?: string;
  items: AbandonedCartItem[];
  totalValue: number;
  abandonedAt: string;
  lastActivity: string;
  isRegistered: boolean;
  remindersSent: number;
  lastReminderSent?: string;
  status: string;
}

interface AbandonedCartStats {
  total: number;
  registered: number;
  unregistered: number;
  totalValue: number;
  averageValue: number;
}

interface AbandonedCartResponse {
  carts: AbandonedCart[];
  stats: AbandonedCartStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminAbandonedCart() {
  const user = useAppSelector((state: any) => state.auth.user)
  const token = useAppSelector((state: any) => state.auth.token)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'registered' | 'unregistered'>('registered')
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTime, setFilterTime] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  // API data
  const [abandonedCartsData, setAbandonedCartsData] = useState<AbandonedCartResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !token || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'abandoned-cart')) {
      console.log('Authentication check failed:', { user: !!user, token: !!token, role: user?.role });
      router.push("/")
      return
    }
    
    console.log('Authentication successful, fetching abandoned carts...');
    fetchAbandonedCarts()
  }, [user, token, router, activeTab, searchTerm, filterTime, currentPage])

  const fetchAbandonedCarts = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        isRegistered: activeTab === 'registered' ? 'true' : 'false',
        ...(searchTerm && { search: searchTerm }),
        ...(filterTime !== 'all' && { timeFilter: filterTime })
      })

      const API_URL = process.env.NEXT_PUBLIC_API_URL
      console.log('Making API request to:', `${API_URL}/abandoned-carts/admin?${params}`);
      console.log('Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const response = await fetch(`${API_URL}/abandoned-carts/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch abandoned carts: ${response.statusText} - ${errorText}`)
      }

      const data: AbandonedCartResponse = await response.json()
      console.log('API response data:', data);
      setAbandonedCartsData(data)
    } catch (error) {
      console.error('Error fetching abandoned carts:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch abandoned carts')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async (cartId: string) => {
    const cart = abandonedCartsData?.carts.find(c => c._id === cartId)
    if (!cart) return

    // Check if email is available
    if (!cart.userEmail) {
      return;
    }

    try {
      setSendingReminder(cartId)
      
      const subject = "Complete Your Purchase - Special Discount Inside!";
      const body = `Dear ${cart.userName || 'Valued Customer'},

We noticed you left some amazing items in your cart! Don't miss out on these great products.

Your Cart Summary:
${cart.items.map(item => `• ${item.productName} (Qty: ${item.quantity}) - ₹${item.price}`).join('\n')}

Total Value: ₹${cart.totalValue}

🎉 SPECIAL OFFER: Complete your purchase now and get an extra 10% discount!
Use code: COMEBACK10

Visit our website to complete your order: ${window.location.origin}

This offer is valid for a limited time only. Don't let these items slip away!

Best regards,
Your Shopping Team`;

      // Try multiple methods to open email client
      try {
        // Method 1: Direct mailto link with window.open (most reliable)
        const mailtoLink = `mailto:${cart.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
        
        // Method 2: Fallback - try to trigger email client directly
        setTimeout(() => {
          try {
            // Alternative approach: create a clickable element and trigger it
            const emailButton = document.createElement('button');
            emailButton.onclick = () => {
              window.location.href = mailtoLink;
            };
            emailButton.click();
          } catch (e) {
            console.log('Alternative email opening failed:', e);
          }
        }, 200);
        
      } catch (error) {
        console.error('Error opening email client:', error);
        
        // Method 3: Copy to clipboard as fallback
        const emailContent = `To: ${cart.userEmail}\nSubject: ${subject}\n\n${body}`;
        try {
          await navigator.clipboard.writeText(emailContent);
          console.log('Email content copied to clipboard');
        } catch (clipboardError) {
          console.log('Could not copy to clipboard');
        }
      }
      
    } catch (error) {
      console.error('Error in handleSendReminder:', error)
    } finally {
      // Reset the loading state after a short delay
      setTimeout(() => {
        setSendingReminder(null)
      }, 1000);
    }
  }

  const handleViewDetails = (cartId: string) => {
    const cart = abandonedCartsData?.carts.find(c => c._id === cartId)
    if (cart) {
      setSelectedCart(cart)
      setShowModal(true)
    }
  }

  const handleTabChange = (tab: 'registered' | 'unregistered') => {
    setActiveTab(tab)
    setCurrentPage(1) // Reset to first page when changing tabs
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleTimeFilterChange = (value: string) => {
    setFilterTime(value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const filteredCarts = abandonedCartsData?.carts || []
  const stats = abandonedCartsData?.stats || {
    total: 0,
    registered: 0,
    unregistered: 0,
    totalValue: 0,
    averageValue: 0
  }
  const pagination = abandonedCartsData?.pagination

  if (!user || !token || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'abandoned-cart')) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-codGray">Abandoned Cart Management</h2>
              <p className="text-gray-600">Track and recover abandoned shopping carts</p>
            </div>
          </div>
          
          {/* Debug Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
                <div className="text-sm text-yellow-700 mt-2">
                  <p><strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}</p>
                  <p><strong>Token:</strong> {token ? 'Available' : 'Missing'}</p>
                  <p><strong>Role:</strong> {user?.role || 'Unknown'}</p>
                  <p><strong>Admin Access:</strong> {user && isAdminUser(user.role) ? 'Yes' : 'No'}</p>
                  <p><strong>Section Access:</strong> {user && hasAccessToSection(user.role, 'abandoned-cart') ? 'Yes' : 'No'}</p>
                </div>
                <p className="text-sm text-yellow-600 mt-2">
                  Please log in with an admin account to access this section.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-codGray">Abandoned Cart Management</h2>
              <p className="text-gray-600">Track and recover abandoned shopping carts</p>
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

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-codGray">Abandoned Cart Management</h2>
              <p className="text-gray-600">Track and recover abandoned shopping carts</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Abandoned Carts</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button 
                  onClick={fetchAbandonedCarts}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
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
            <h2 className="text-2xl font-bold text-codGray">Abandoned Cart Management</h2>
            <p className="text-gray-600">Track and recover abandoned shopping carts</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Abandoned</p>
                <p className="text-2xl font-bold text-codGray">{stats.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered Users</p>
                <p className="text-2xl font-bold text-brand-primary">{stats.registered}</p>
              </div>
              <User className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unregistered Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.unregistered}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  <IndianRupee className="inline h-5 w-5" />
                  {stats.totalValue.toLocaleString()}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => handleTabChange('registered')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'registered'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Registered Users ({stats.registered})
              </button>
              <button
                onClick={() => handleTabChange('unregistered')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'unregistered'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Unregistered Users ({stats.unregistered})
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <select
                value={filterTime}
                onChange={(e) => handleTimeFilterChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-separate border-spacing-y-1">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-sm">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Items</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Abandoned</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarts.map((cart) => (
                  <tr key={cart._id} className="bg-white hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-codGray text-sm">{cart.userName || 'Guest'}</p>
                        <p className="text-xs text-gray-500">{cart.userEmail || 'No email'}</p>
                        {cart.phone && (
                          <p className="text-xs text-gray-500">{cart.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-codGray">
                          {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-green-600 text-sm">
                        <IndianRupee className="inline h-3 w-3" />
                        {cart.totalValue.toLocaleString()}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-gray-600">
                        <p>{new Date(cart.abandonedAt).toLocaleDateString()}</p>
                        <p className="text-gray-500">{new Date(cart.abandonedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleSendReminder(cart._id)}
                          disabled={sendingReminder === cart._id || !cart.userEmail}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!cart.userEmail ? 'No email address available' : 'Send reminder email'}
                        >
                          {sendingReminder === cart._id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="h-3 w-3" />
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleViewDetails(cart._id)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                          title="View cart details"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCarts.length === 0 && (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No abandoned carts found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * 10 + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 10, pagination.totalCount)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.totalCount}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        pagination.totalPages - 4,
                        Math.max(1, currentPage - 2)
                      )) + i;
                      
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? 'z-10 bg-brand-primary border-brand-primary text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Abandoned Cart Detail Modal */}
      {selectedCart && (
        <AbandonedCartDetailModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedCart(null)
          }}
          cart={selectedCart}
          onSendReminder={handleSendReminder}
          sendingReminder={sendingReminder === selectedCart._id}
        />
      )}
    </AdminLayout>
  )
}
