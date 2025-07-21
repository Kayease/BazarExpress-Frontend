"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Footer from "@/components/footer"
import { Calendar, User, ArrowLeft, Heart, Eye, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import MarkdownPreview from '@uiw/react-markdown-preview';

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  image: string
  readTime: string
  views: number
  likes: number
  createdAt: string
  updatedAt: string
  featured: boolean
  tags: string[]
}

export default function BlogDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchBlog()
    }
  }, [slug])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/blogs/slug/${slug}`)
      if (!response.ok) {
        throw new Error("Blog post not found")
      }
      const data = await response.json()
      setBlog(data)
    } catch (error) {
      console.error("Error fetching blog:", error)
      toast.error("Failed to load blog post")
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!blog || liked) return

    try {
      const response = await fetch(`${API_URL}/blogs/like/${blog.slug}`, {
        method: "POST"
      })
      
      if (response.ok) {
        const data = await response.json()
        setBlog(prev => prev ? { ...prev, likes: data.likes } : null)
        setLiked(true)
        toast.success("Liked!")
      }
    } catch (error) {
      console.error("Error liking blog:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Blog Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {blog.category}
            </span>
            {blog.featured && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                Featured
              </span>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
          
          <p className="text-xl text-gray-600 mb-6">{blog.excerpt}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <User size={16} className="mr-1" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
              <span>•</span>
              <span>{blog.readTime}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-500">
                <Eye size={16} className="mr-1" />
                <span>{blog.views} views</span>
              </div>
              <button
                onClick={handleLike}
                disabled={liked}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full transition ${
                  liked 
                    ? "bg-red-100 text-red-600" 
                    : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                }`}
              >
                <Heart size={16} className={liked ? "fill-current" : ""} />
                <span>{blog.likes + (liked ? 1 : 0)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-8">
          <img 
            src={blog.image} 
            alt={blog.title} 
            className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg"
            }}
          />
        </div>

        {/* Blog Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <MarkdownPreview source={blog.content || ''} />
          </div>
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
} 