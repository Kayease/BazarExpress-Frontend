"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { Search, Filter, Star, CheckCircle, X, Eye, MoreHorizontal } from "lucide-react"
import AdminPagination from "../../../components/ui/AdminPagination"
import AdminLoader from "../../../components/ui/AdminLoader"

// Review type definition
type Review = {
  id: string
  productName: string
  customerName: string
  rating: number
  title: string
  comment: string
  date: string
  status: "approved" | "pending" | "flagged"
  verified: boolean
  helpful: number
}

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: "1",
    productName: "Wireless Bluetooth Headphones",
    customerName: "Sarah M.",
    rating: 5,
    title: "Amazing sound quality!",
    comment:
      "These headphones exceeded my expectations. The noise cancellation is fantastic and the battery life is exactly as advertised.",
    date: "2024-03-10",
    status: "approved" as const,
    verified: true,
    helpful: 12,
  },
  {
    id: "2",
    productName: "Smart Fitness Watch",
    customerName: "Mike R.",
    rating: 4,
    title: "Great value for money",
    comment:
      "Really impressed with the build quality and sound. Only minor complaint is they can get a bit warm during long listening sessions.",
    date: "2024-03-08",
    status: "pending" as const,
    verified: true,
    helpful: 8,
  },
  {
    id: "3",
    productName: "Premium Coffee Maker",
    customerName: "Jennifer L.",
    rating: 1,
    title: "Poor quality",
    comment: "This product broke after just one week of use. Very disappointed with the quality.",
    date: "2024-03-05",
    status: "flagged" as const,
    verified: false,
    helpful: 2,
  },
]

export default function AdminReviews() {
  const user = useAppSelector((state) => state.auth.user)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRating, setFilterRating] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const REVIEWS_PER_PAGE = 5
  const router = useRouter()

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'reviews')) {
      router.push("/")
      return
    }
    // Simulate loading reviews
    setTimeout(() => {
      setReviews(mockReviews)
      setLoading(false)
    }, 1000)
  }, [user])

  const reviewStats = {
    total: reviews.length,
    approved: reviews.filter((r) => r.status === "approved").length,
    pending: reviews.filter((r) => r.status === "pending").length,
    flagged: reviews.filter((r) => r.status === "flagged").length,
    averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  // Filter reviews based on search term, status, and rating
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = searchTerm === "" || 
      review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || review.status === filterStatus
    const matchesRating = filterRating === "all" || review.rating.toString() === filterRating
    
    return matchesSearch && matchesStatus && matchesRating
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE)
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  )

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterRating])

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-red-600">{reviewStats.flagged}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="space-y-4">
          {paginatedReviews.length === 0 ? (
            <div className="bg-white rounded-lg p-12 shadow-md text-center">
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
            paginatedReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-codGray">{review.productName}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : review.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {review.status}
                    </span>
                    {review.verified && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>By {review.customerName}</span>
                    <span>•</span>
                    <span>{new Date(review.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{review.helpful} found helpful</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    {renderStars(review.rating)}
                    <span className="font-medium text-codGray">{review.title}</span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-brand-primary transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-500 transition-colors">
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredReviews.length > REVIEWS_PER_PAGE && (
          <div className="bg-white rounded-lg shadow-md">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={REVIEWS_PER_PAGE}
              totalItems={filteredReviews.length}
              itemName="reviews"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
