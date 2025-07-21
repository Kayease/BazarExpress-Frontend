"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { Search, Filter, Star, CheckCircle, X, Eye, MoreHorizontal } from "lucide-react"

// Mock reviews data
const mockReviews = [
  {
    id: "1",
    productName: "Wireless Bluetooth Headphones",
    customerName: "Sarah M.",
    rating: 5,
    title: "Amazing sound quality!",
    comment:
      "These headphones exceeded my expectations. The noise cancellation is fantastic and the battery life is exactly as advertised.",
    date: "2024-03-10",
    status: "approved",
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
    status: "pending",
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
    status: "flagged",
    verified: false,
    helpful: 2,
  },
]

export default function AdminReviews() {
  const user = useAppSelector((state) => state.auth.user)
  const [reviews, setReviews] = useState(mockReviews)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRating, setFilterRating] = useState("all")
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/")
    }
  }, [user, router])

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || review.status === filterStatus
    const matchesRating = filterRating === "all" || review.rating.toString() === filterRating
    return matchesSearch && matchesStatus && matchesRating
  })

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

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spectra mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
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
          {filteredReviews.map((review) => (
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
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-brand-primary text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
