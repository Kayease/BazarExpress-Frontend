"use client"

import { useState, useEffect } from "react"
import Footer from "@/components/footer"
import { Calendar, User, ArrowRight, Search, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface BlogPost {
  _id: string
  title: string
  excerpt: string
  author: string
  createdAt: string
  category: string
  image: string
  readTime: string
  slug: string
  views: number
  likes: number
}

export default function BlogPage() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const isLoggedIn = true
  const user = { name: "John Doe", email: "user@BazarXpress.com" }

  // Fetch blog posts from API
  const fetchBlogPosts = async (page = 1, category = selectedCategory, search = searchQuery) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "9"
      })
      
      if (category && category !== "All") {
        params.append("category", category)
      }
      
      if (search) {
        params.append("search", search)
      }

      const response = await fetch(`${API_URL}/blogs/published?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch blog posts")
      }

      const data = await response.json()
      
      if (page === 1) {
        setBlogPosts(data.blogs)
      } else {
        setBlogPosts(prev => [...prev, ...data.blogs])
      }
      
      setTotalPages(data.totalPages)
      setCurrentPage(data.currentPage)
      setHasMore(data.currentPage < data.totalPages)
    } catch (error) {
      console.error("Error fetching blog posts:", error)
      toast.error("Failed to load blog posts")
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/blogs/categories`)
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      const data = await response.json()
      setCategories(["All", ...data])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchBlogPosts()
  }, [])

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1)
    fetchBlogPosts(1, selectedCategory, searchQuery)
  }

  // Handle category filter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    fetchBlogPosts(1, category, searchQuery)
  }

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchBlogPosts(currentPage + 1, selectedCategory, searchQuery)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">BazarXpress Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest news, tips, and insights from the world of instant grocery delivery
          </p>
        </div>

        {/* Search and Categories */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    selectedCategory === category
                      ? "bg-green-600 text-white"
                      : "bg-white border border-gray-300 hover:bg-green-50 hover:border-green-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && blogPosts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading blog posts...</span>
          </div>
        )}

        {/* Blog Posts */}
        {blogPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                <img 
                  src={post.image || "/placeholder.svg"} 
                  alt={post.title} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h2>

                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User size={16} />
                      <span>{post.author}</span>
                      <span>•</span>
                      <Calendar size={16} />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <button 
                      onClick={() => window.location.href = `/blog/${post.slug}`}
                      className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
                    >
                      <span>Read More</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* No Posts Found */}
        {!loading && blogPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No blog posts found</div>
            <p className="text-gray-400">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && blogPosts.length > 0 && (
          <div className="text-center mt-12">
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center mx-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Load More Articles"
              )}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
