"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { Search, Plus, Edit, Trash2, MoreHorizontal, Grid3X3 } from "lucide-react"
import * as LucideIcons from "lucide-react"
import toast from "react-hot-toast"

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
  sortOrder?: number
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
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [newCategory, setNewCategory] = useState<Category>({
    name: "",
    parentId: "",
    icon: "Box",
    hide: false,
    popular: false,
    showOnHome: false,
  })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'parent' | 'sub'>('all')
  const router = useRouter()
  console.log(categories);


  const BackedUrl = process.env.NEXT_PUBLIC_API_URL

  const fetchCategories = () => {
    fetch(`${BackedUrl}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data));
  };

  // Fetch categories from backend
  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
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
    
    // Then sort by sortOrder
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  // // Add category via API
  // const handleAddCategory = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   const payload = {
  //     name: newCategory.name,
  //     parentId: newCategory.parentId,
  //     icon: sanitizeIconInput(newCategory.icon || "Box"),
  //     hide: newCategory.hide,
  //     popular: newCategory.popular,
  //   }
  //   try {
  //     const res = await fetch(`${BackedUrl}/categories`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     })
  //     if (res.ok) {
  //       const created = await res.json()
  //       setCategories([created, ...categories])
  //       setShowModal(false)
  //       setNewCategory({ name: "", parentId: "", icon: "Box", hide: false, popular: false })
  //       toast.success(`Category ${created.name} was created successfully.`)
  //     } else {
  //       const error = await res.json()
  //       toast.error("Failed to create category.")
  //     }
  //   } catch (err) {
  //     toast.error("Network error. Could not create category.")
  //   }
  // }

  // Edit category via API
  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || "",
      icon: category.icon || "Box",
      hide: category.hide || false,
      popular: category.popular || false,
      showOnHome: category.showOnHome || false,
      slug: category.slug || "",
      sortOrder: category.sortOrder || 0,
      thumbnail: category.thumbnail || "",
    })
    setShowModal(true)
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !editingCategory._id) return
    const payload = {
      name: newCategory.name,
      description: newCategory.description,
      parentId: newCategory.parentId,
      icon: sanitizeIconInput(newCategory.icon || "Box"),
      hide: newCategory.hide,
      popular: newCategory.popular,
      showOnHome: newCategory.showOnHome,
      slug: newCategory.slug,
      sortOrder: newCategory.sortOrder,
      thumbnail: newCategory.thumbnail,
    }
    try {
      const res = await fetch(`${BackedUrl}/categories/${editingCategory._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        // Refetch all categories to get updated productCount
        fetchCategories();
        setShowModal(false)
        setEditingCategory(null)
        setNewCategory({ name: "", parentId: "", icon: "Box", hide: false, popular: false })
        toast.success("Category updated successfully.")
      } else {
        const error = await res.json()
        toast.error("Failed to update category.")
      }
    } catch (err) {
      toast.error("Network error. Could not update category.")
    }
  }

  // Delete category via API
  const handleDeleteCategory = async (id?: string) => {
    if (!id) return
    setDeleting(true)
    try {
      const res = await fetch(`${BackedUrl}/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCategories(categories.filter(cat => cat._id !== id))
        toast.success("Category was deleted successfully.")
        setConfirmDeleteCategory(null) // Close modal after successful deletion
      } else {
        const error = await res.json()
        toast.error(error.error || error.message || "Failed to delete category.")
        setConfirmDeleteCategory(null) // Also close modal on error
      }
    } catch (err) {
      toast.error("Network error. Could not delete category.")
      setConfirmDeleteCategory(null) // Also close modal on error
    } finally {
      setDeleting(false)
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
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
            <h2 className="text-2xl font-bold text-text-primary">Categories Management</h2>
            <p className="text-text-secondary">Organize your products into categories</p>
          </div>
          <button
            className="bg-brand-primary hover:bg-brand-primary-dark text-text-inverse px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            onClick={() => router.push('/admin/categories/add')}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={stat.label} className="bg-surface-primary rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</p>
                    </div>
                    <Grid3X3 className={`h-8 w-8 ${stat.iconClass}`} />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Search and Filter */}
        <div className="bg-surface-primary rounded-lg p-6 shadow-md">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative max-w-md flex-grow">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary h-10"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'parent' | 'sub')}
                className="w-full border border-border-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary h-10"
              >
                <option value="all">All Categories</option>
                <option value="parent">Parent Categories Only</option>
                <option value="sub">Subcategories Only</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-text-secondary">
            Showing {sortedCategories.length} of {categories.length} categories
            {categoryFilter !== 'all' && (
              <span> ({categoryFilter === 'parent' ? 'Parent Categories' : 'Subcategories'} only)</span>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        {sortedCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l1.553-4.66A2 2 0 016.447 4h11.106a2 2 0 011.894 1.34L21 10m-9 4v6m-4 0h8" />
            </svg>
            <div className="text-lg text-gray-500 mb-2">No categories found.</div>
            <div className="text-sm text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search term.' : 'Click the button below to add your first category.'}
            </div>
            <button
              className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              onClick={() => router.push('/admin/categories/add')}
            >
              Add Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCategories.map((category: Category) => {
              const IconComponent = (LucideIcons as any)[category.icon] || LucideIcons["Box"];
              const parentCategory = category.parentId ? categories.find(c => c._id === category.parentId) : null;
              
              return (
                <div key={category._id} className={`bg-surface-primary rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center md:flex-row md:items-start gap-4 w-full max-w-md mx-auto ${category.parentId ? 'border-l-4 border-brand-primary/30' : ''}`}>
                  {category.thumbnail && (
                    <img src={category.thumbnail} alt={category.name} className="w-24 h-24 object-contain rounded border shadow mb-2 md:mb-0 bg-white" />
                  )}
                  <div className="flex-1 w-full flex flex-col items-center md:items-start">
                    <div className="flex flex-col items-center md:items-start w-full mb-2">
                      <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start">
                        <IconComponent className="h-8 w-8 text-brand-primary" />
                        <h3 className="text-lg font-semibold text-text-primary">{category.name}</h3>
                        {/* {category.slug && <span className="ml-2 text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">{category.slug}</span>} */}
                      </div>
                      {parentCategory && (
                        <div className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-1 rounded mb-2">
                          Subcategory of: {parentCategory.name}
                        </div>
                      )}
                      <p className="text-text-secondary text-sm mb-2 text-center md:text-left w-full">{category.description}</p>
                      <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start text-xs mb-2 w-full">
                        <span className={`px-2 py-1 rounded-full font-medium ${category.hide ? 'bg-brand-error/10 text-brand-error' : 'bg-brand-success/10 text-brand-success'}`}>{category.hide ? 'Hidden' : 'Active'}</span>
                        <span className={`px-2 py-1 rounded-full font-medium ${category.popular ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-error/10 text-brand-error'}`}>{category.popular ? 'Popular' : 'Normal'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start text-sm text-text-tertiary w-full">
                        <span>{category.productCount || 0} products</span>
                        <span>•</span>
                        <span>Sort: {typeof category.sortOrder === 'number' ? category.sortOrder : 0}</span>
                      </div>
                    </div>
                    <div className="w-full pt-4 border-t border-border-primary flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
                      <button className="bg-brand-primary hover:bg-brand-primary-dark text-text-inverse py-2 px-6 rounded text-sm transition-colors w-full md:w-auto md:mr-auto">View Products</button>
                      <div className="flex flex-row gap-2 w-full md:w-auto md:ml-4 justify-end">
                        <button
                          className="p-2 text-text-tertiary hover:text-brand-primary transition-colors w-full md:w-auto"
                          onClick={() => openEditCategory(category)}
                        >
                          <Edit className="h-4 w-4 mx-auto" />
                        </button>
                        <button
                          className="p-2 text-text-tertiary hover:text-brand-error transition-colors w-full md:w-auto"
                          onClick={() => setConfirmDeleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-8 relative">
            <div className="text-xl font-semibold mb-4">
              {editingCategory ? "Edit Category" : "Add Category"}
            </div>
            <form onSubmit={editingCategory ? handleEditCategory : undefined} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCategory.description || ""}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={newCategory.parentId || ""}
                  onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">No Parent</option>
                  {categories
                    .filter(cat => cat._id !== editingCategory?._id)
                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: sanitizeIconInput(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="e.g., Box, ShoppingCart, etc."
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCategory.hide || false}
                    onChange={(e) => setNewCategory({ ...newCategory, hide: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Hidden</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCategory.popular || false}
                    onChange={(e) => setNewCategory({ ...newCategory, popular: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Popular</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCategory.showOnHome || false}
                    onChange={(e) => setNewCategory({ ...newCategory, showOnHome: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Show on Home page</span>
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  {editingCategory ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setNewCategory({ name: "", parentId: "", icon: "Box", hide: false, popular: false, showOnHome: false });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl"
              onClick={() => {
                setShowModal(false);
                setEditingCategory(null);
                setNewCategory({ name: "", parentId: "", icon: "Box", hide: false, popular: false, showOnHome: false });
              }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

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
    </AdminLayout>
  )
}

// // --- CATEGORY MODAL COMPONENT ---
// const CategoryModal = ({
//   showModal,
//   setShowModal,
//   editingCategory,
//   setEditingCategory,
//   newCategory,
//   setNewCategory,
//   categories,
//   handleAddCategory,
//   handleEditCategory,
// }: any) => {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // Slug auto-generation and sanitization
//   function slugify(str: string) {
//     return str
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, '-')
//       .replace(/^-+|-+$/g, '')
//       .replace(/--+/g, '-');
//   }

//   // Update slug when name changes (unless user has edited slug manually)
//   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const name = e.target.value;
//     setNewCategory((prev: any) => ({
//       ...prev,
//       name,
//       slug: prev.slugEdited ? prev.slug : slugify(name),
//     }));
//   };
//   const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setNewCategory((prev: any) => ({
//       ...prev,
//       slug: slugify(e.target.value),
//       slugEdited: true,
//     }));
//   };

//   // Handle thumbnail upload
//   const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (ev) => {
//         setNewCategory((prev: any) => ({ ...prev, thumbnail: ev.target?.result }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // Cancel and reset
//   const handleCancel = () => {
//     setShowModal(false);
//     setEditingCategory(null);
//     setNewCategory({ name: "", slug: "", description: "", sortOrder: 0, parentId: "", icon: "Box", hide: false, popular: false, thumbnail: undefined });
//   };

//   // Icon preview
//   const IconComponent = (LucideIcons as any)[newCategory.icon] || LucideIcons["Box"];

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <form
//         className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-6"
//         onSubmit={editingCategory ? handleEditCategory : handleAddCategory}
//       >
//         <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
//           {editingCategory ? "Edit Category" : "Add Category"}
//         </h3>
//         <div className="space-y-4">
//           {/* Name & Slug */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Name<span className="text-red-500">*</span></label>
//             <input
//               type="text"
//               required
//               value={newCategory.name}
//               onChange={handleNameChange}
//               className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Slug<span className="text-red-500">*</span></label>
//             <input
//               type="text"
//               required
//               value={newCategory.slug || slugify(newCategory.name)}
//               onChange={handleSlugChange}
//               className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary lowercase"
//             />
//           </div>
//           {/* Description */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Description</label>
//             <textarea
//               value={newCategory.description || ""}
//               onChange={e => setNewCategory((prev: any) => ({ ...prev, description: e.target.value }))}
//               className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[60px]"
//               placeholder="Category description"
//             />
//           </div>
//           {/* 
//             Sort Order
//             This field lets you set the display order of categories in lists or menus.
//             Lower numbers appear first. For example, a category with sort order 1 will show before a category with sort order 2.
//             This is useful for controlling the sequence in which categories are shown to users.
//           */}
//           <div>
//             <label className="block text-sm font-medium mb-1">
//               Sort Order
//               <span className="text-xs text-gray-400 ml-2">(Lower numbers show first)</span>
//             </label>
//             <input
//               type="number"
//               value={typeof newCategory.sortOrder === 'number' ? newCategory.sortOrder : 0}
//               onChange={e => setNewCategory((prev: any) => ({ ...prev, sortOrder: Number(e.target.value) }))}
//               className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
//               placeholder="0"
//               min={0}
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               Controls the order in which this category appears in lists. Lower numbers appear first.
//             </p>
//           </div>
//           {/* Icon Name & Preview */}
//           <div className="flex items-center gap-3">
//             <div>
//               <label className="block text-sm font-medium mb-1">Icon Name</label>
//               <input
//                 type="text"
//                 value={newCategory.icon}
//                 onChange={e => setNewCategory((prev: any) => ({ ...prev, icon: e.target.value }))}
//                 className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
//                 placeholder="Box"
//               />
//             </div>
//             <div className="flex flex-col items-center justify-center mt-6">
//               <IconComponent className="h-8 w-8 text-brand-primary" />
//               <span className="text-xs text-gray-400 mt-1">Preview</span>
//             </div>
//           </div>
//           <div>
//             <a
//               href="https://lucide.dev/icons/"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-brand-primary hover:underline text-sm inline-block"
//             >
//               Browse Categories Icons
//             </a>
//           </div>
//           {/* Thumbnail Upload */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Thumbnail Image</label>
//             <div className="flex items-center gap-3">
//               <input
//                 type="file"
//                 accept="image/*"
//                 ref={fileInputRef}
//                 onChange={handleThumbnailChange}
//                 className="block"
//               />
//               {newCategory.thumbnail && (
//                 <img src={newCategory.thumbnail} alt="Thumbnail Preview" className="w-16 h-16 object-cover rounded border" />
//               )}
//             </div>
//           </div>
//           {/* Parent Category */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Parent Category (optional)</label>
//             <select
//               value={newCategory.parentId}
//               onChange={e => setNewCategory((prev: any) => ({ ...prev, parentId: e.target.value }))}
//               className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
//             >
//               <option value="">None</option>
//               {categories.filter((cat: any) => !editingCategory || cat._id !== editingCategory._id).map((cat: any) => (
//                 <option key={cat._id} value={cat._id}>{cat.name}</option>
//               ))}
//             </select>
//           </div>
//           {/* Hide & Popular Checkboxes (improved UX) */}
//           <div className="flex items-center gap-6 mt-2">
//             <label className="flex items-center gap-2 cursor-pointer">
//               <span className="text-sm">Hide</span>
//               <input
//                 type="checkbox"
//                 checked={!!newCategory.hide}
//                 onChange={e => setNewCategory((prev: any) => ({ ...prev, hide: e.target.checked }))}
//                 className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary"
//               />
//             </label>
//             <label className="flex items-center gap-2 cursor-pointer">
//               <span className="text-sm">Popular</span>
//               <input
//                 type="checkbox"
//                 checked={!!newCategory.popular}
//                 onChange={e => setNewCategory((prev: any) => ({ ...prev, popular: e.target.checked }))}
//                 className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary"
//               />
//             </label>
//           </div>
//         </div>
//         <div className="flex justify-end gap-2 pt-4">
//           <button
//             type="button"
//             className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
//             onClick={handleCancel}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 rounded bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold"
//           >
//             {editingCategory ? "Update Category" : "Add Category"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };
// // --- END CATEGORY MODAL COMPONENT ---
