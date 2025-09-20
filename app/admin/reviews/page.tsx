"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { Search, Filter, Star, CheckCircle, X, Eye, MoreHorizontal, Trash2, Flag, AlertTriangle } from "lucide-react"
import AdminPagination from "../../../components/ui/AdminPagination"
import AdminLoader from "../../../components/ui/AdminLoader"
import toast from "react-hot-toast"

// Review type definition
type Review = {
  _id: string
  product: {
    _id: string
    name: string
    image?: string
  }
  user: {
    _id: string
    name: string
    email: string
  }
  rating: number
  title?: string
  comment: string
  createdAt: string
  status: "approved" | "pending" | "rejected" | "flagged"
  verified: boolean
  helpful: number
  adminNotes?: string
  approvedBy?: {
    _id: string
    name: string
  }
  approvedAt?: string
}

type ReviewStats = {
  total: number
  approved: number
  pending: number
  rejected: number
  flagged: number
  averageRating: number
}

export default function AdminReviews() {
  const user = useAppSelector((state) => state.auth.user)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    flagged: 0,
    averageRating: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRating, setFilterRating] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const REVIEWS_PER_PAGE = 10
  const router = useRouter()
  const APIURL = process.env.NEXT_PUBLIC_API_URL

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: REVIEWS_PER_PAGE.toString(),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterRating !== 'all' && { rating: filterRating }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      })

      const response = await fetch(`${APIURL}/reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalItems(data.pagination?.totalItems || 0)
      } else {
        console.error('Failed to fetch reviews')
        setReviews([])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    }
  }

  const fetchReviewStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${APIURL}/reviews/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const stats = await response.json()
        setReviewStats(stats)
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
    }
  }

  const updateReviewStatus = async (reviewId: string, status: string, adminNotes?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${APIURL}/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNotes })
      })

      if (response.ok) {
        // Refresh reviews and stats
        await Promise.all([fetchReviews(), fetchReviewStats()])
        return true
      } else {
        console.error('Failed to update review status')
        return false
      }
    } catch (error) {
      console.error('Error updating review status:', error)
      return false
    }
  }

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review)
    setShowDeleteModal(true)
  }

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return

    setDeleteLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${APIURL}/reviews/${reviewToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Refresh reviews and stats
        await Promise.all([fetchReviews(), fetchReviewStats()])
        setShowDeleteModal(false)
        setReviewToDelete(null)
        // Show success message
        toast.success('Review deleted successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
    } finally {
      setDeleteLoading(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setReviewToDelete(null)
    setDeleteLoading(false)
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'reviews')) {
      router.push("/")
      return
    }
    
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchReviews(), fetchReviewStats()])
      setLoading(false)
    }
    
    loadData()
  }, [user, currentPage, filterStatus, filterRating, debouncedSearchTerm])

  // Remove the old reviewStats calculation as it's now fetched from API

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, filterStatus, filterRating])

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'reviews')) {
    return <AdminLoader message="Checking permissions..." fullScreen />
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-codGray">Reviews & Ratings</h2>
              <p className="text-gray-600">Manage customer reviews and feedback</p>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-pulse">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-center space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  <div className="h-8 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          {/* Reviews Skeleton */}
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded"></div>
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
            <h2 className="text-2xl font-bold text-codGray">Reviews & Ratings</h2>
            <p className="text-gray-600">Manage customer reviews and feedback</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-codGray">{reviewStats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{reviewStats.approved}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{reviewStats.pending}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{reviewStats.rejected}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-orange-600">{reviewStats.flagged}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-purple-600">{reviewStats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <input
                type="text"
                placeholder="Search reviews..."
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">Flagged</option>
            </select>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg p-12 shadow-md text-center lg:col-span-2">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No reviews found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "all" || filterRating !== "all" 
                  ? "Try adjusting your search or filters." 
                  : "Customer reviews will appear here once they start reviewing products."
                }
              </p>
            </div>
          ) : (
            reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-bold text-sm text-codGray truncate">{review.product.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        review.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : review.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : review.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </span>
                    {review.verified && (
                      <div className="flex items-center space-x-1 text-green-600 flex-shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                    <span>By {review.user.name}</span>
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{review.helpful} helpful</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-3 w-3 ${star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                    {review.title && (
                      <span className="font-medium text-sm text-codGray">{review.title}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                  {review.adminNotes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <strong>Admin Notes:</strong> {review.adminNotes}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                  {/* View Product button - available for all review statuses */}
                  <button 
                    onClick={() => window.open(`/products/${review.product._id}`, '_blank')}
                    className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                    title="View Product Page"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {review.status === "pending" && (
                    <>
                      <button 
                        onClick={() => updateReviewStatus(review._id, "approved")}
                        className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                        title="Approve Review"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => updateReviewStatus(review._id, "rejected")}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Reject Review"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {review.status === "approved" && (
                    <button 
                      onClick={() => updateReviewStatus(review._id, "flagged")}
                      className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                      title="Flag Review"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  )}
                  {/* Delete button - available for all review statuses */}
                  <button 
                    onClick={() => handleDeleteClick(review)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Review Permanently"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalItems > REVIEWS_PER_PAGE && (
          <div className="bg-white rounded-lg shadow-md">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={REVIEWS_PER_PAGE}
              totalItems={totalItems}
              itemName="reviews"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Review</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete this review?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < reviewToDelete.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{reviewToDelete.user.name}</span>
                </div>
                {reviewToDelete.title && (
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {reviewToDelete.title}
                  </p>
                )}
                <p className="text-sm text-gray-700 line-clamp-2">
                  {reviewToDelete.comment}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReview}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
