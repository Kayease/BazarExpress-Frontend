"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { Search, TrendingUp, Users, AlertTriangle, Trash2, RefreshCw } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import AdminLoader from '../../../components/ui/AdminLoader'

// Search gap interfaces
interface SearchGap {
  _id: string;
  searchTerm: string;
  searchCount: number;
  lastSearched: string;
  firstSearched: string;
  userCount: number;
  status: 'new' | 'investigating' | 'planned' | 'added' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  searchedBy: Array<{
    userId?: string;
    guestId?: string;
    searchedAt: string;
    pincode?: string;
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AdminSearchGaps() {
  const user = useAppSelector((state: any) => state.auth.user)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTime, setFilterTime] = useState("all")
  const [searchGaps, setSearchGaps] = useState<SearchGap[]>([])
  const [stats, setStats] = useState({
    totalGaps: 0,
    newGaps: 0,
    totalSearches: 0
  })
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    searchGap: SearchGap | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    searchGap: null,
    isDeleting: false
  })
  const router = useRouter()

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'search-gaps')) {
      router.push("/")
      return
    }
    
    fetchSearchGaps()
    fetchStats()
  }, [user, router])

  const fetchSearchGaps = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/search-gaps?search=${searchTerm}&timeFilter=${filterTime}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchGaps(data.searchGaps || [])
      }
    } catch (error) {
      console.error('Error fetching search gaps:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/search-gaps/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const openDeleteModal = (searchGap: SearchGap) => {
    setDeleteModal({
      isOpen: true,
      searchGap,
      isDeleting: false
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      searchGap: null,
      isDeleting: false
    })
  }

  const confirmDeleteSearchGap = async () => {
    if (!deleteModal.searchGap) return

    setDeleteModal(prev => ({ ...prev, isDeleting: true }))

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/search-gaps/${deleteModal.searchGap._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setSearchGaps(searchGaps.filter(gap => gap._id !== deleteModal.searchGap!._id))
        fetchStats() // Refresh stats
        closeDeleteModal()
      }
    } catch (error) {
      console.error('Error deleting search gap:', error)
    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleRefresh = () => {
    fetchSearchGaps()
    fetchStats()
  }

  // Refresh data when filters change
  useEffect(() => {
    if (!loading) {
      fetchSearchGaps()
    }
  }, [searchTerm, filterTime])

  // Data is already filtered on the server side based on searchTerm and filterTime
  const filteredGaps = searchGaps

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'search-gaps')) {
    return <AdminLoader message="Checking permissions..." fullScreen />
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-codGray">Search Gaps Analysis</h2>
              <p className="text-gray-600">Track items customers searched for but weren't available</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
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
            <h2 className="text-2xl font-bold text-codGray">Search Gaps Analysis</h2>
            <p className="text-gray-600">Track items customers searched for but weren't available</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gaps</p>
                <p className="text-2xl font-bold text-codGray">{stats.totalGaps}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-brand-primary">{stats.totalSearches}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Gaps</p>
                <p className="text-2xl font-bold text-orange-600">{stats.newGaps}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search gaps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Search Term</th>
                  <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Search Count</th>
                  <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Users</th>
                  <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Last Searched</th>
                  <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGaps.map((gap) => (
                  <tr key={gap._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-900">{gap.searchTerm}</p>
                      {gap.notes && (
                        <p className="text-xs text-gray-500 mt-1">{gap.notes}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <p className="font-medium text-gray-900">{gap.searchCount}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <p className="text-sm text-gray-600">{gap.userCount}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <p className="text-sm text-gray-600">
                        {new Date(gap.lastSearched).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(gap.lastSearched).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openDeleteModal(gap)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete search gap"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredGaps.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No search gaps found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Search Gap
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete the search gap for "{deleteModal.searchGap?.searchTerm}"? 
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSearchGap}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleteModal.isDeleting && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  <span>{deleteModal.isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
