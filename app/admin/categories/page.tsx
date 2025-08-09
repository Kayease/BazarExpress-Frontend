"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { Search, Plus, Edit, Trash2, MoreHorizontal, Grid3X3 } from "lucide-react"
import * as LucideIcons from "lucide-react"
import toast from "react-hot-toast"
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import CategoryFormModal from "../../../components/CategoryFormModal"
import AdminPagination from "../../../components/ui/AdminPagination"
import AdminLoader, { AdminCategorySkeleton } from "../../../components/ui/AdminLoader"

type Category = {
  _id?: string
  id?: string
  name: string
  description?: string
  productCount?: number
  status?: string
  createdDate?: string
  icon: string
  parentId?: string
  hide?: boolean
  popular?: boolean
  showOnHome?: boolean
  slug?: string
  thumbnail?: string
}

// Utility to sanitize icon input
function sanitizeIconInput(input: string) {
  // Remove angle brackets and slashes, trim whitespace
  return input.replace(/<|>|\//g, '').trim();
}

export default function AdminCategories() {
  const user = useAppSelector((state) => state.auth.user)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'parent' | 'sub'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const CATEGORIES_PER_PAGE = 12
  const router = useRouter()
  console.log(categories);


  const BackedUrl = process.env.NEXT_PUBLIC_API_URL

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`${BackedUrl}/categories`);
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from backend
  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'categories')) {
      router.push("/")
      return
    }
    fetchCategories();
  }, [user, router]);

  // Filter categories based on search term and category type filter
  const filteredCategories = categories.filter(
    (category) => {
      // First apply text search filter
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      // Then apply category type filter
      if (!matchesSearch) return false;
      
      if (categoryFilter === 'parent') {
        return !category.parentId;
      } else if (categoryFilter === 'sub') {
        return !!category.parentId;
      } else {
        return true; // 'all' filter
      }
    }
  );
  
  // Sort categories - parent categories first, then subcategories by their parent
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    // First sort by parent/sub status
    if (!a.parentId && b.parentId) return -1; // a is parent, b is sub
    if (a.parentId && !b.parentId) return 1; // a is sub, b is parent
    
    // Then sort by name alphabetically
    return a.name.localeCompare(b.name);
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedCategories.length / CATEGORIES_PER_PAGE);
  const paginatedCategories = sortedCategories.slice(
    (currentPage - 1) * CATEGORIES_PER_PAGE,
    currentPage * CATEGORIES_PER_PAGE
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  // Open add category modal
  const openAddCategory = () => {
    setEditingCategory(null)
    setShowModal(true)
  }

  // Open edit category modal
  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setShowModal(true)
  }



  // Delete category via API
  const handleDeleteCategory = async (id?: string) => {
    if (!id) return
    setDeleting(true)
    try {
      await apiDelete(`${BackedUrl}/categories/${id}`);
      setCategories(categories.filter(cat => cat._id !== id))
      toast.success("Category was deleted successfully.")
      setConfirmDeleteCategory(null) // Close modal after successful deletion
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category.");
      setConfirmDeleteCategory(null) // Also close modal on error
    } finally {
      setDeleting(false)
    }
  }

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'categories')) {
    return <AdminLoader message="Checking permissions..." fullScreen />
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Categories Management</h2>
              <p className="text-sm text-text-secondary">Organize your products into categories</p>
            </div>
            <button
              className="bg-brand-primary hover:bg-brand-primary-dark text-text-inverse px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
              disabled
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-surface-primary rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter Skeleton */}
          <div className="bg-surface-primary rounded-lg p-4 shadow-sm animate-pulse">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-grow max-w-md">
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
                <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
                <div className="h-8 w-12 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          </div>

          {/* Categories Grid Skeleton */}
          <AdminCategorySkeleton items={12} />
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
            <h2 className="text-xl font-bold text-text-primary">Categories Management</h2>
            <p className="text-sm text-text-secondary">Organize your products into categories</p>
          </div>
          <button
            className="bg-brand-primary hover:bg-brand-primary-dark text-text-inverse px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            onClick={openAddCategory}
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Stats */}
        {(() => {
          const stats = [
            {
              label: "Total Categories",
              value: categories.length,
              valueClass: "text-text-primary",
              iconClass: "text-brand-info",
            },
            {
              label: "Active Categories",
              value: categories.filter((c) => !c.hide).length,
              valueClass: "text-brand-success",
              iconClass: "text-brand-success",
            },
            {
              label: "Inactive Categories",
              value: categories.filter((c) => c.hide).length,
              valueClass: "text-brand-error",
              iconClass: "text-brand-error",
            },
            {
              label: "Total Products",
              value: categories.reduce((sum, c) => sum + (c.productCount || 0), 0),
              valueClass: "text-brand-primary",
              iconClass: "text-brand-primary",
            },
          ];
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={stat.label} className="bg-surface-primary rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-text-secondary">{stat.label}</p>
                      <p className={`text-lg font-bold ${stat.valueClass}`}>{stat.value}</p>
                    </div>
                    <Grid3X3 className={`h-5 w-5 ${stat.iconClass}`} />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Search and Filter */}
        <div className="bg-surface-primary rounded-lg p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Section */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm"
              />
            </div>
            
            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-primary">Filter Categories:</label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCategoryFilter('parent')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      categoryFilter === 'parent'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Parent
                  </button>
                  <button
                    onClick={() => setCategoryFilter('sub')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      categoryFilter === 'sub'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sub
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-3 pt-3 border-t border-border-primary">
            <p className="text-xs text-text-secondary">
              Showing {paginatedCategories.length} of {sortedCategories.length} categories
              {searchTerm && ` matching "${searchTerm}"`}
              {categoryFilter !== 'all' && ` (${categoryFilter === 'parent' ? 'Parent' : 'Sub'} categories only)`}
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        {paginatedCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l1.553-4.66A2 2 0 016.447 4h11.106a2 2 0 011.894 1.34L21 10m-9 4v6m-4 0h8" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No categories found</div>
            <div className="text-sm text-gray-400 mb-4 text-center max-w-sm">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'Get started by creating your first category to organize your products.'}
            </div>
            <button
              className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm hover:shadow-md text-sm"
              onClick={openAddCategory}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Add Category
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {paginatedCategories.map((category: Category) => {
              const parentCategory = category.parentId ? categories.find(c => c._id === category.parentId) : null;
              
              return (
                <div 
                  key={category._id} 
                  className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border ${
                    category.parentId 
                      ? 'border-l-3 border-l-brand-primary/40 border-gray-200' 
                      : 'border-gray-200'
                  } overflow-hidden group cursor-pointer`}
                >
                  {/* Image Section - Smaller but still prominent */}
                  <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100">
                    {category.thumbnail ? (
                      <img 
                        src={category.thumbnail} 
                        alt={category.name} 
                        className="w-full h-full object-contain p-3"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {/* Fallback when no image or image fails to load */}
                    <div className={`w-full h-full flex items-center justify-center ${category.thumbnail ? 'hidden' : ''}`}>
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Status badges overlay */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${
                        category.hide 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {category.hide ? 'Hidden' : 'Active'}
                      </span>
                      {category.popular && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 shadow-sm">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3">
                    {/* Category Name and Parent Info */}
                    <div className="mb-2">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors mb-1">
                        {category.name}
                      </h3>
                      {parentCategory && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
                          <span>Subcategory of {parentCategory.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {category.description && (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Products</p>
                            <p className="text-xs font-semibold text-gray-900">{category.productCount || 0}</p>
                          </div>
                        </div>

                      </div>
                      
                      {/* Additional Flags */}
                      <div className="flex items-center gap-1">
                        {category.showOnHome && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" title="Shows on home page"></span>
                        )}
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                      <button
                        className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-gray-50 rounded transition-all"
                        onClick={() => openEditCategory(category)}
                        title="Edit category"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded transition-all"
                        onClick={() => setConfirmDeleteCategory(category)}
                        title="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
            
            {/* Pagination */}
            {sortedCategories.length > CATEGORIES_PER_PAGE && (
              <div className="bg-white rounded-lg shadow-sm">
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={CATEGORIES_PER_PAGE}
                  totalItems={sortedCategories.length}
                  itemName="categories"
                />
              </div>
            )}
          </>
        )}
      </div>



      {/* Delete Confirmation Modal */}
      {confirmDeleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-8 relative">
            <div className="text-xl font-semibold mb-4">Confirm Deletion</div>
            <p className="text-text-secondary mb-4">
              Are you sure you want to delete the category "{confirmDeleteCategory.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setConfirmDeleteCategory(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="bg-brand-error hover:bg-brand-error-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={() => handleDeleteCategory(confirmDeleteCategory._id)}
                disabled={deleting}
              >
                {deleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setConfirmDeleteCategory(null)}
              disabled={deleting}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      
      {/* Category Form Modal */}
      <CategoryFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
        }}
        onSuccess={async (category: Category) => {
          setShowModal(false);
          setEditingCategory(null);
          // Refetch categories to get updated list
          await fetchCategories();
        }}
        categories={categories}
        category={editingCategory}
      />
    </AdminLayout>
  )
}


