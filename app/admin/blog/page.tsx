"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { useRouter } from 'next/navigation'
import toast from "react-hot-toast"
import { uploadToCloudinary } from "../../../lib/uploadToCloudinary"
import dynamic from 'next/dynamic'
import { Editor } from '@tinymce/tinymce-react';
import { apiPost, apiPut, apiDelete, apiGet } from "../../../lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Blog {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  image: string
  readTime: string
  status: 'draft' | 'published'
  featured: boolean
  tags: string[]
  views: number
  likes: number
  createdAt: string
  updatedAt: string
}

export default function AdminBlog() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editing, setEditing] = useState<Blog | null>(null)
  const [deletingBlog, setDeletingBlog] = useState<Blog | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    author: "BazarXpress Team",
    category: "Technology",
    image: "",
    readTime: "5 min read",
    status: "draft" as 'draft' | 'published',
    featured: false,
    tags: [] as string[]
  })
  const [showPreview, setShowPreview] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDeleting, setImageDeleting] = useState(false);
  // --- Add state for image to delete ---
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const BLOGS_PER_PAGE = 10;
  const totalPages = Math.ceil(blogs.length / BLOGS_PER_PAGE);
  const paginatedBlogs = blogs.slice((currentPage - 1) * BLOGS_PER_PAGE, currentPage * BLOGS_PER_PAGE);

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'blog')) {
      router.push("/")
      return
    }
    fetchBlogs();
  }, [user]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await apiGet(`${process.env.NEXT_PUBLIC_API_URL}/blogs`);
      // The API returns { blogs: [...], totalPages: X, currentPage: Y, total: Z }
      // We need to extract just the blogs array
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null)
    setForm({
      title: "",
      excerpt: "",
      content: "",
      author: "BazarXpress Team",
      category: "Technology",
      image: "",
      readTime: "5 min read",
      status: "draft",
      featured: false,
      tags: []
    })
    setImagePreview(null)
    setSelectedImageFile(null)
    setShowModal(true)
  }

  const openEdit = (blog: Blog) => {
    setEditing(blog)
    setForm({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      image: blog.image,
      readTime: blog.readTime,
      status: blog.status,
      featured: blog.featured,
      tags: blog.tags
    })
    setImagePreview(blog.image)
    setSelectedImageFile(null)
    setShowModal(true)
  }

  const openDelete = (blog: Blog) => {
    setDeletingBlog(blog)
    setShowDeleteModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setForm({ ...form, image: "" }) // Clear image URL until upload
    }
  }

  const createBlog = async (imageUrl: string) => {
    const toastId = toast.loading("Creating blog...")
    try {
      await apiPost(`${API_URL}/blogs`, { ...form, image: imageUrl });
      toast.success("Blog created successfully!", { id: toastId })
    } catch (err: any) {
      toast.error(err.message || "Failed to create blog", { id: toastId })
      throw err;
    }
  }

  const editBlog = async (imageUrl: string) => {
    const toastId = toast.loading("Updating blog...")
    try {
      await apiPut(`${API_URL}/blogs/${editing?._id}`, { ...form, image: imageUrl });
      toast.success("Blog updated successfully!", { id: toastId })
    } catch (err: any) {
      toast.error(err.message || "Failed to update blog", { id: toastId })
      throw err;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.title || !form.excerpt || !form.content || !form.category || (!imagePreview && !imageFile)) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      let imageUrl = form.image
      if (imageFile) {
        try {
          imageUrl = await uploadToCloudinary(imageFile, "blogs")
        } catch (err) {
          toast.error("Could not upload image to Cloudinary.")
          setLoading(false)
          return
        }
      }
      
      if (editing) {
        await editBlog(imageUrl)
      } else {
        await createBlog(imageUrl)
      }
      
      setShowModal(false)
      setImageFile(null)
      setImagePreview(null)
      await fetchBlogs()
      // --- On form submit, after DB update, delete the marked image from Cloudinary ---
      if (imageToDelete) {
        await deleteImageFromCloudinary(imageToDelete);
      }
      // After deletion, clear the toDelete state:
      setImageToDelete(null);
    } catch (error) {
      console.error("Error saving blog:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save blog")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingBlog) return

    setDeleteLoading(true)
    const toastId = toast.loading("Deleting blog...")

    try {
      await apiDelete(`${API_URL}/blogs/${deletingBlog._id}`);

      toast.success("Blog deleted successfully!", { id: toastId })
      setShowDeleteModal(false)
      setDeletingBlog(null)
      fetchBlogs()
    } catch (error) {
      console.error("Error deleting blog:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete blog", { id: toastId })
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  // Helper to delete image from Cloudinary
  async function deleteImageFromCloudinary(imageUrl: string) {
    if (!imageUrl) return true;
    try {
      const res = await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      return false;
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg">Blogs</div>
          <button
            className="bg-surface-primary hover:bg-brand-primary hover:text-text-inverse text-text-primary rounded p-2 transition-colors"
            onClick={openAdd}
            aria-label="Add Blog"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading blogs...</span>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 font-semibold">Image</th>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Views</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                        </svg>
                        <div className="text-lg text-gray-500 mb-2">No blogs yet.</div>
                        <div className="text-sm text-gray-400 mb-6">Click the + button to add your first blog post.</div>
                        <button
                          className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                          onClick={openAdd}
                        >
                          Add Blog
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {paginatedBlogs.map((blog) => (
                  <tr key={blog._id} className="bg-white border-b">
                    <td className="py-3 px-4 align-top">
                      <img 
                        src={blog.image} 
                        alt="Blog" 
                        className="h-12 w-20 object-cover rounded shadow"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </td>
                    <td className="py-3 px-4 align-middle font-medium text-text-primary max-w-xs truncate">
                      {blog.title}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {blog.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        blog.status === "published" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle text-sm text-gray-600">
                      {formatDate(blog.createdAt)}
                    </td>
                    <td className="py-3 px-4 align-middle text-sm text-gray-600">
                      {blog.views}
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      <button
                        className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-dark text-white rounded p-1 mr-1"
                        onClick={() => openEdit(blog)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center bg-brand-error hover:bg-brand-error-dark text-white rounded p-1"
                        onClick={() => openDelete(blog)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center space-x-2 mt-6 mb-2 pr-2">
            <button
              className="px-2 py-1 rounded border text-xs font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-2 py-1 rounded text-xs font-medium border mx-0.5 ${currentPage === page ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="px-2 py-1 rounded border text-xs font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Blog Form Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-8 relative border-4 border-brand-primary max-h-[90vh] overflow-y-auto">
              {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                </div>
              )}
              <div className="text-2xl font-bold mb-4 text-brand-primary">
                {editing ? "Edit" : "Add"} Blog
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium mb-1">Title *</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                      value={form.title} 
                      onChange={e => setForm({ ...form, title: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Author</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                      value={form.author} 
                      onChange={e => setForm({ ...form, author: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Excerpt *</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                    value={form.excerpt} 
                    onChange={e => setForm({ ...form, excerpt: e.target.value })} 
                    rows={3}
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block font-medium mb-1">Category *</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                      value={form.category} 
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      <option value="Technology">Technology</option>
                      <option value="Health & Nutrition">Health & Nutrition</option>
                      <option value="Sustainability">Sustainability</option>
                      <option value="Company News">Company News</option>
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Recipes">Recipes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Status</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                      value={form.status} 
                      onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Read Time</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                      value={form.readTime} 
                      onChange={e => setForm({ ...form, readTime: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Featured</label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={form.featured} 
                      onChange={e => setForm({ ...form, featured: e.target.checked })}
                      className="mr-2"
                    />
                    Mark as featured
                  </label>
                </div>

                <div>
                  <label className="block font-medium mb-1">Image *</label>
                  <div 
                    className="border-2 border-dashed border-brand-primary rounded-lg flex flex-col items-center justify-center py-8 cursor-pointer hover:border-brand-primary transition-colors" 
                    onClick={() => document.getElementById('blog-image-input')?.click()}
                  >
                    {imagePreview ? (
                      <div className="flex items-center gap-2">
                        <img src={imagePreview} alt="Preview" className="h-32 object-contain mb-2 rounded shadow" />
                        <button type="button" className="text-red-500 text-xs" onClick={() => {
                          if (imagePreview && !imageFile) {
                            setImageToDelete(imagePreview);
                            setImagePreview(null);
                            setForm({ ...form, image: "" });
                            setImageFile(null);
                          } else {
                            setImagePreview(null);
                            setForm({ ...form, image: "" });
                            setImageFile(null);
                          }
                        }} disabled={imageDeleting}>Remove</button>
                      </div>
                    ) : (
                      <>
                        <svg width="40" height="40" fill="none" stroke="currentColor" className="text-brand-primary" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
                          <rect x="8" y="2" width="8" height="8" rx="2" />
                          <line x1="12" y1="12" x2="12" y2="16" />
                          <line x1="10" y1="14" x2="14" y2="14" />
                        </svg>
                        <div className="font-medium text-text-primary mt-2">Upload Blog Image</div>
                        <div className="text-text-secondary text-sm">Upload jpg, png images</div>
                      </>
                    )}
                    <input
                      id="blog-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium">Content *</label>
                  </div>
                  <div>
                    <Editor
                      apiKey="yapzaxocernrvcfg37vobqi7uk31wza7hii4fhsgi6j2838d"
                      value={form.content}
                      onEditorChange={(val: string) => setForm({ ...form, content: val ?? "" })}
                      init={{
                        height: 300,
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                          'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'help', 'wordcount'
                        ],
                        toolbar:
                          'undo redo | formatselect | bold italic underline | ' +
                          'alignleft aligncenter alignright alignjustify | ' +
                          'bullist numlist outdent indent | removeformat | help'
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Use the toolbar above to format your content with headings, lists, links, and more!
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    type="submit" 
                    className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-lg flex items-center justify-center"
                    disabled={loading || imageDeleting}
                  >
                    {(loading || imageDeleting) && (
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    )}
                    {imageDeleting ? 'Deleting...' : loading ? (editing ? 'Update' : 'Save') : (editing ? 'Update' : 'Save')}
                  </button>
                  <button 
                    type="button" 
                    className="bg-surface-tertiary hover:bg-surface-tertiary-dark text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors" 
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              <button 
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl" 
                onClick={() => setShowModal(false)} 
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Updated to match banner style */}
        {showDeleteModal && deletingBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative border-4 border-brand-error/20">
              {deleteLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-error"></div>
                </div>
              )}
              <div className="text-xl font-bold mb-4 text-brand-error">Delete Blog Post?</div>
              <div className="mb-6 text-gray-700">
                Are you sure you want to delete "<strong>{deletingBlog.title}</strong>"? This will also delete the image from Cloudinary. This action cannot be undone.
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingBlog(null)
                  }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="bg-brand-error hover:bg-brand-error-dark text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-transform"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
} 