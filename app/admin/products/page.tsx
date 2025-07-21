"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { Search, Filter, MoreHorizontal, Edit, Trash2, Plus, Eye, Package, IndianRupee } from "lucide-react"
import Image from "next/image"
import { useAppSelector } from '../../../lib/store'
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

// Define Product type to match backend
interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  brand: string | { _id: string; name: string };
  category: string | { _id: string; name: string };
  warehouse: string;
  sku: string;
  inStock?: boolean;
  stockCount?: number;
  originalPrice?: number;
}

export default function AdminProducts() {
  const user = useAppSelector((state) => state.auth.user)
  const [productList, setProductList] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/products`)
      .then(res => res.json())
      .then(data => {
        setProductList(data.map((p: any) => ({
          ...p,
          inStock: p.stock > 0,
          stockCount: p.stock,
        })));
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Deduplicate categories by ID or value
  const categoryMap = new Map();
  productList.forEach((p) => {
    const cat = p.category;
    if (typeof cat === "object" && cat && "_id" in cat) {
      categoryMap.set(cat._id, cat);
    } else if (cat) {
      categoryMap.set(cat, cat);
    }
  });
  const categories = ["all", ...Array.from(categoryMap.values())];

  const filteredProducts: Product[] = productList.filter((product) => {
    const name = typeof product.name === 'string' ? product.name : '';
    const brand = typeof product.brand === 'object' && 'name' in product.brand ? product.brand.name : product.brand;
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brand && typeof brand === 'string' && brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const category = typeof product.category === 'object' && '_id' in product.category ? product.category._id : product.category;
    const matchesCategory = filterCategory === "all" || category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "in-stock" && product.inStock) ||
      (filterStatus === "out-of-stock" && !product.inStock);
    return matchesSearch && matchesCategory && matchesStatus;
  })

  const searchSuggestions = productList
    .filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      const name = typeof product.name === 'string' ? product.name : '';
      const brand = typeof product.brand === 'object' && 'name' in product.brand ? product.brand.name : product.brand;
      return (
        name.toLowerCase().includes(searchLower) ||
        (brand && typeof brand === 'string' && brand.toLowerCase().includes(searchLower))
      );
    })
    .slice(0, 5); // Limit to 5 suggestions

  async function deleteProduct(id: string) {
    setConfirmDeleteId(id);
  }
  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    await fetch(`${API}/products/${confirmDeleteId}`, { method: 'DELETE' });
    setProductList((prev) => prev.filter((p) => p._id !== confirmDeleteId));
    setDeleting(false);
    setConfirmDeleteId(null);
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
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
            <h2 className="text-2xl font-bold text-codGray">Products Management</h2>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <button
            className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            onClick={() => router.push('/admin/products/add')}
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-codGray">{productList.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-brand-primary">{productList.filter((p) => p.inStock).length}</p>
              </div>
              <Package className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{productList.filter((p) => !p.inStock).length}</p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{categories.length - 1}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              {showSuggestions && searchTerm && searchSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {searchSuggestions.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => {
                        setSearchTerm(product.name)
                        setShowSuggestions(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-codGray truncate">{product.name}</p>
                        <p className="text-sm text-gray-500 truncate">{typeof product.brand === 'object' && 'name' in product.brand ? product.brand.name : product.brand}</p>
                      </div>
                      <div className="text-sm text-brand-primary font-medium flex items-center gap-1">
                        <IndianRupee className="inline h-4 w-4" />{product.price}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {categories.map((category) => (
                <option key={typeof category === 'object' && '_id' in category ? category._id : category} value={typeof category === 'object' && '_id' in category ? category._id : category}>
                  {category === "all" ? "All Categories" : typeof category === 'object' && 'name' in category ? category.name : category}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Table or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-brand-primary mb-4" />
            <div className="text-lg text-gray-500 mb-2">No products yet.</div>
            <div className="text-sm text-gray-400 mb-6">Click the button below to add your first product.</div>
            <button
              className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              onClick={() => router.push('/admin/products/add')}
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Product<span className="text-red-500">*</span></th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Category<span className="text-red-500">*</span></th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Price<span className="text-red-500">*</span></th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Stock</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-codGray">{product.name}</p>
                            <p className="text-sm text-gray-500">{typeof product.brand === 'object' && 'name' in product.brand ? product.brand.name : product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {typeof product.category === 'object' && '_id' in product.category ? product.category.name : product.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-codGray flex items-center gap-1"><IndianRupee className="inline h-4 w-4" />{product.price}</p>
                          {product.originalPrice && (
                            <p className="text-sm text-gray-500 line-through flex items-center gap-1"><IndianRupee className="inline h-3 w-3" />{product.originalPrice}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-600">{product.stockCount} units</p>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${product.inStock ? "bg-brand-primary/10 text-brand-primary" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-text-tertiary hover:text-brand-primary transition-colors" onClick={() => router.push(`/admin/products/${product._id}`)}>
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-text-tertiary hover:text-brand-primary transition-colors" onClick={() => router.push(`/admin/products/${product._id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-text-tertiary hover:text-brand-error transition-colors" onClick={() => deleteProduct(product._id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {productList.length} products
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
      <ConfirmDeleteModal
        open={!!confirmDeleteId}
        title="Delete Product?"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AdminLayout>
  )
}
