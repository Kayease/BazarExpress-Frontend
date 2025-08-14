"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import AdminLayout from "../../../components/AdminLayout"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import toast from "react-hot-toast"
import {
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  BadgePercent,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Percent,
  DollarSign,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client"
import StatsCards from "@/components/StatsCards"

// --- Types ---
type PromoType = "percentage" | "fixed"
type AppliesTo = "all" | "categories" | "brands" | "products"

type Promo = {
  _id: string
  code: string
  type: PromoType
  discount: number
  maxDiscount?: number
  minOrderAmount?: number
  usageLimit?: number
  usageType?: 'single_use' | 'multiple_use'
  startDate?: string
  endDate?: string
  appliesTo: AppliesTo
  categories?: string[]
  products?: string[]
  status: boolean
  description?: string
  brands?: string[]
}

type Category = { _id: string; name: string; parentId?: string }
type Product = { _id: string; name: string }

// --- Form State Type ---
type PromoForm = {
  code: string
  type: PromoType
  discount: number | ""
  maxDiscount: number | ""
  minOrderAmount: number | ""
  usageLimit: number | ""
  usageType: 'single_use' | 'multiple_use'
  startDate: string
  endDate: string
  appliesTo: AppliesTo
  categories: string[]
  products: string[]
  status: boolean
  description: string
  brands: string[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API = `${API_URL}/promocodes`;
const CATEGORY_API = `${API_URL}/categories`;
const PRODUCT_API = `${API_URL}/products`;
const BRAND_API = `${API_URL}/brands`;

// --- Main Page ---
export default function PromoCodesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState<Promo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editPromo, setEditPromo] = useState<Promo | null>(null)
  const [showDelete, setShowDelete] = useState<null | Promo>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [fetchingCats, setFetchingCats] = useState(false)
  const [fetchingProds, setFetchingProds] = useState(false)
  const [brands, setBrands] = useState<{ _id: string; name: string }[]>([])
  const [fetchingBrands, setFetchingBrands] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [brandSearch, setBrandSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1);
  const PROMOS_PER_PAGE = 10;
  const totalPages = Math.ceil(promos.length / PROMOS_PER_PAGE);
  const paginatedPromos = promos.slice((currentPage - 1) * PROMOS_PER_PAGE, currentPage * PROMOS_PER_PAGE);

  // Stats state
  const [promoStats, setPromoStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    scheduled: 0,
    expired: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // --- Fetch Promos ---
  useEffect(() => {
    const fetchPromos = async () => {
      setLoading(true)
      try {
        const data = await apiGet(API)
        if (Array.isArray(data)) {
          setPromos(data)
        } else {
          setPromos([])
          toast.error(data?.error || "Failed to load promocodes")
        }
      } catch (error: any) {
        setPromos([])
        toast.error(error.message || "Failed to load promocodes")
      } finally {
        setLoading(false)
      }
    }
    fetchPromos()
  }, [])

  // --- Fetch Promo Stats ---
  useEffect(() => {
    const fetchPromoStats = async () => {
      setStatsLoading(true)
      try {
        const data = await apiGet(`${API}/stats`)
        setPromoStats(data.stats || {
          total: 0,
          active: 0,
          inactive: 0,
          scheduled: 0,
          expired: 0
        })
      } catch (error: any) {
        console.error('Error fetching promo stats:', error)
        // Don't show error toast for stats as it's not critical
      } finally {
        setStatsLoading(false)
      }
    }
    fetchPromoStats()
  }, [])

  // --- Fetch Categories/Products for Multiselect ---
  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      setFetchingCats(true)
      try {
        const categoryData = await apiGet(CATEGORY_API)
        setCategories(categoryData)
      } catch (error) {
        toast.error("Failed to load categories")
      } finally {
        setFetchingCats(false)
      }

      // Fetch products
      setFetchingProds(true)
      try {
        const productData = await apiGet(PRODUCT_API)
        setProducts(productData)
      } catch (error) {
        toast.error("Failed to load products")
      } finally {
        setFetchingProds(false)
      }

      // Fetch brands
      setFetchingBrands(true)
      try {
        const brandData = await apiGet(BRAND_API)
        setBrands(brandData)
      } catch (error) {
        toast.error("Failed to load brands")
      } finally {
        setFetchingBrands(false)
      }
    }
    fetchData()
  }, [])

  // --- Form State ---
  const initialForm: PromoForm = {
    code: "",
    type: "percentage",
    discount: "",
    maxDiscount: "",
    minOrderAmount: "",
    usageLimit: "",
    usageType: "multiple_use",
    startDate: "",
    endDate: "",
    appliesTo: "all",
    categories: [],
    products: [],
    status: true,
    description: "",
    brands: [],
  }
  const [form, setForm] = useState<PromoForm>(initialForm)
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  // --- Open Add/Edit Modal ---
  const openAdd = () => {
    setEditPromo(null)
    setForm(initialForm)
    setFormErrors({})
    setShowForm(true)
  }
  const openEdit = (promo: Promo) => {
    setEditPromo(promo)
    setForm({
      code: promo.code,
      type: promo.type,
      discount: promo.discount ?? "",
      maxDiscount: promo.maxDiscount ?? "",
      minOrderAmount: promo.minOrderAmount ?? "",
      usageLimit: promo.usageLimit ?? "",
      usageType: promo.usageType ?? "multiple_use",
      startDate: promo.startDate ? promo.startDate.slice(0, 10) : "",
      endDate: promo.endDate ? promo.endDate.slice(0, 10) : "",
      appliesTo: promo.appliesTo,
      categories: promo.categories ?? [],
      products: promo.products ?? [],
      status: !!promo.status,
      description: promo.description ?? "",
      brands: promo.brands ?? [],
    })
    setFormErrors({})
    setShowForm(true)
  }

  // --- Form Validation ---
  function validateForm() {
    const errors: { [k: string]: string } = {}
    if (!form.code.trim()) errors.code = "Code is required"
    if (!form.discount || Number(form.discount) <= 0) errors.discount = "Discount required"
    if (!form.type) errors.type = "Type required"
    if (form.type === "percentage" && (!form.maxDiscount || Number(form.maxDiscount) <= 0)) errors.maxDiscount = "Max discount required for percentage"
    if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = "End date must be after start date"
    if (form.appliesTo === "categories" && (!form.categories || form.categories.length === 0)) errors.categories = "Select at least one category"
    if (form.appliesTo === "brands" && (!form.brands || form.brands.length === 0)) errors.brands = "Select at least one brand"
    if (form.appliesTo === "products" && (!form.products || form.products.length === 0)) errors.products = "Select at least one product"
    return errors
  }

  // --- Handle Form Submit ---
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateForm()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    setFormLoading(true)
    const payload = {
      ...form,
      discount: Number(form.discount),
      maxDiscount: form.maxDiscount === "" ? undefined : Number(form.maxDiscount),
      minOrderAmount: form.minOrderAmount === "" ? undefined : Number(form.minOrderAmount),
      usageLimit: form.usageLimit === "" ? undefined : Number(form.usageLimit),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: !!form.status,
      brands: form.appliesTo === "brands" ? form.brands : [],
      categories: form.appliesTo === "categories" ? form.categories : [],
      products: form.appliesTo === "products" ? form.products : [],
    }
    try {
      if (editPromo) {
        await apiPut(`${API}/${editPromo._id}`, payload)
      } else {
        await apiPost(API, payload)
      }
      toast.success(editPromo ? "Promocode updated" : "Promocode added")
      setShowForm(false)
      setEditPromo(null)
      setForm(initialForm)
      // Refresh list and stats
      setLoading(true)
      try {
        const data = await apiGet(API)
        if (Array.isArray(data)) {
          setPromos(data)
        } else {
          setPromos([])
          toast.error(data?.error || "Failed to load promocodes")
        }
        // Refresh stats
        const statsData = await apiGet(`${API}/stats`)
        setPromoStats(statsData.stats || {
          total: 0,
          active: 0,
          inactive: 0,
          scheduled: 0,
          expired: 0
        })
      } catch (error) {
        setPromos([])
        toast.error("Failed to load promocodes")
      } finally {
        setLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save promocode")
    } finally {
      setFormLoading(false)
    }
  }

  // --- Handle Delete ---
  async function handleDelete() {
    if (!showDelete) return
    setFormLoading(true)
    try {
      await apiDelete(`${API}/${showDelete._id}`)
      toast.success("Promocode deleted")
      setShowDelete(null)
      setPromos((prev) => prev.filter((p) => p._id !== showDelete._id))
      // Refresh list and stats
      setLoading(true)
      try {
        const data = await apiGet(API)
        if (Array.isArray(data)) {
          setPromos(data)
        } else {
          setPromos([])
          toast.error(data?.error || "Failed to load promocodes")
        }
        // Refresh stats
        const statsData = await apiGet(`${API}/stats`)
        setPromoStats(statsData.stats || {
          total: 0,
          active: 0,
          inactive: 0,
          scheduled: 0,
          expired: 0
        })
      } catch (error) {
        setPromos([])
        toast.error("Failed to load promocodes")
      } finally {
        setLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete promocode")
    } finally {
      setFormLoading(false)
    }
  }

  // --- Async Product Search State ---
  const [productSearch, setProductSearch] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [productPage, setProductPage] = useState(1)
  const [productTotalPages, setProductTotalPages] = useState(1)
  const productSearchTimeout = useRef<NodeJS.Timeout | null>(null)

  // --- Async Product Search Effect ---
  useEffect(() => {
    if (form.appliesTo !== "products") return;
    setFetchingProds(true)
    if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current)
    productSearchTimeout.current = setTimeout(async () => {
      try {
        const data = await apiGet(`${PRODUCT_API}/paginated?search=${encodeURIComponent(productSearch)}&page=${productPage}&limit=20`)
        setProductResults(data.products || [])
        setProductTotalPages(data.totalPages || 1)
      } catch (error) {
        toast.error("Failed to load products")
      } finally {
        setFetchingProds(false)
      }
    }, 300)
    return () => {
      if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current)
    }
  }, [productSearch, productPage, form.appliesTo])

  // --- Reset product page on new search ---
  useEffect(() => {
    setProductPage(1)
  }, [productSearch])

  // --- Async Category Search State ---
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const categorySearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Async Brand Search State ---
  const [brandResults, setBrandResults] = useState<{ _id: string; name: string }[]>([]);
  const [brandPage, setBrandPage] = useState(1);
  const [brandTotalPages, setBrandTotalPages] = useState(1);
  const brandSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Async Category Search Effect ---
  useEffect(() => {
    if (form.appliesTo !== "categories") return;
    setFetchingCats(true);
    if (categorySearchTimeout.current) clearTimeout(categorySearchTimeout.current);
    categorySearchTimeout.current = setTimeout(async () => {
      try {
        const data = await apiGet(`${CATEGORY_API}/paginated?search=${encodeURIComponent(categorySearch)}&page=${categoryPage}&limit=20`)
        setCategoryResults(data.items || []);
        setCategoryTotalPages(data.totalPages || 1);
      } catch (error) {
        toast.error("Failed to load categories")
      } finally {
        setFetchingCats(false)
      }
    }, 300);
    return () => {
      if (categorySearchTimeout.current) clearTimeout(categorySearchTimeout.current)
    }
  }, [categorySearch, categoryPage, form.appliesTo]);

  // --- Reset category page on new search ---
  useEffect(() => {
    setCategoryPage(1);
  }, [categorySearch]);

  // --- Async Brand Search Effect ---
  useEffect(() => {
    if (form.appliesTo !== "brands") return;
    setFetchingBrands(true);
    if (brandSearchTimeout.current) clearTimeout(brandSearchTimeout.current);
    brandSearchTimeout.current = setTimeout(async () => {
      try {
        const data = await apiGet(`${BRAND_API}/paginated?search=${encodeURIComponent(brandSearch)}&page=${brandPage}&limit=20`)
        setBrandResults(data.items || []);
        setBrandTotalPages(data.totalPages || 1);
      } catch (error) {
        toast.error("Failed to load brands")
      } finally {
        setFetchingBrands(false)
      }
    }, 300);
    return () => {
      if (brandSearchTimeout.current) clearTimeout(brandSearchTimeout.current)
    }
  }, [brandSearch, brandPage, form.appliesTo]);

  // --- Reset brand page on new search ---
  useEffect(() => {
    setBrandPage(1);
  }, [brandSearch]);

  // --- Render ---
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Promo Code Management</h2>
          <button
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            onClick={openAdd}
          >
            <Plus className="h-5 w-5" />
            <span>Add Promo</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="space-y-4">
          {/* First row - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="text-blue-600">
                    <Tag className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Promocodes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statsLoading ? "..." : promoStats.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statsLoading ? "..." : promoStats.active}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="text-purple-600">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {statsLoading ? "..." : promoStats.scheduled}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Second row - 2 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <div className="text-gray-600">
                    <XCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {statsLoading ? "..." : promoStats.inactive}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="text-red-600">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-600">
                    {statsLoading ? "..." : promoStats.expired}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedPromos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 w-full min-h-[120px] bg-brand-primary/5 rounded-xl">
                  <span className="text-brand-primary mb-2"><BadgePercent className="h-5 w-5" /></span>
                  <div className="text-base font-bold text-codGray mb-1">No Promocodes Yet</div>
                  <div className="text-gray-500 mb-4 text-center max-w-xs text-xs">You haven't created any promocodes for your store.</div>
                  <button
                    onClick={openAdd}
                    className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-md flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Your First Promocode
                  </button>
                </div>
              ) : (
                paginatedPromos.map((promo) => {
                  // Determine if expired
                  const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
                  return (
                    <div
                      key={promo._id}
                      className="bg-white rounded-xl shadow-md p-2 flex flex-col sm:flex-row sm:items-center gap-2 border border-gray-100 relative group hover:shadow-lg transition-all mt-6"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-50 border flex items-center justify-center overflow-hidden">
                          <BadgePercent className="h-5 w-5 text-brand-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base text-codGray flex items-center gap-2 truncate">
                            {promo.code}
                            {isExpired && (
                              <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold border border-red-200">Expired</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2 min-h-[18px]">
                            {promo.description || 'No description'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 items-center text-xs">
                        <span className="bg-gray-100 rounded px-2 py-0.5 font-semibold capitalize">{promo.type}</span>
                        <span className="bg-gray-100 rounded px-2 py-0.5 font-semibold">{promo.type === "percentage" ? `${promo.discount}%${promo.maxDiscount ? ` (Max ₹${promo.maxDiscount})` : ""}` : `₹${promo.discount}`}</span>
                        <span className="bg-gray-100 rounded px-2 py-0.5 font-semibold">{promo.startDate && promo.endDate ? `${format(parseISO(promo.startDate), "dd MMM yyyy")} → ${format(parseISO(promo.endDate), "dd MMM yyyy")}` : "-"}</span>
                        <span className={`rounded px-2 py-0.5 font-semibold ${(!isExpired && promo.status) ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-400"}`}>{isExpired ? "Inactive" : (promo.status ? "Active" : "Inactive")}</span>
                      </div>
                      <div className="flex gap-1 sm:ml-2">
                        <button
                          className="p-1 rounded-full hover:bg-brand-primary/10 focus:bg-brand-primary/10 transition-colors"
                          title="Edit"
                          onClick={() => openEdit(promo)}
                        >
                          <Pencil className="h-4 w-4 text-brand-primary" />
                        </button>
                        <button className="p-1 rounded-full hover:bg-red-100 focus:bg-red-100 transition-colors" onClick={() => setShowDelete(promo)} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
        

        {/* Add/Edit Promo Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[9999]">
            <DialogHeader>
              <DialogTitle>{editPromo ? "Edit Promo" : "Add Promo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code<span className="text-red-500">*</span></label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Code"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  required
                  disabled={formLoading}
                />
                {formErrors.code && <div className="text-xs text-red-500 mt-1">{formErrors.code}</div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Type<span className="text-red-500">*</span></label>
                  <Select
                    value={form.type}
                    onValueChange={v => setForm({ ...form, type: v as PromoType })}
                    disabled={formLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.type && <div className="text-xs text-red-500 mt-1">{formErrors.type}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount<span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Discount"
                    value={form.discount}
                    onChange={e => setForm({ ...form, discount: e.target.value === "" ? "" : +e.target.value })}
                    required
                    min={1}
                    disabled={formLoading}
                  />
                  {formErrors.discount && <div className="text-xs text-red-500 mt-1">{formErrors.discount}</div>}
                </div>
              </div>
              {form.type === "percentage" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Max Discount (₹)<span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Max Discount"
                    value={form.maxDiscount}
                    onChange={e => setForm({ ...form, maxDiscount: e.target.value === "" ? "" : +e.target.value })}
                    min={1}
                    required
                    disabled={formLoading}
                  />
                  {formErrors.maxDiscount && <div className="text-xs text-red-500 mt-1">{formErrors.maxDiscount}</div>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Min Order Amount"
                    value={form.minOrderAmount}
                    onChange={e => setForm({ ...form, minOrderAmount: e.target.value === "" ? "" : +e.target.value })}
                    min={0}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usage Limit</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Usage Limit"
                    value={form.usageLimit}
                    onChange={e => setForm({ ...form, usageLimit: e.target.value === "" ? "" : +e.target.value })}
                    min={0}
                    disabled={formLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usage Type<span className="text-red-500">*</span></label>
                <Select
                  value={form.usageType}
                  onValueChange={(value: 'single_use' | 'multiple_use') => setForm({ ...form, usageType: value })}
                  disabled={formLoading}
                >
                  <SelectTrigger className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                    <SelectValue placeholder="Select usage type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                    <SelectItem value="multiple_use">Multiple Use - Can be used multiple times</SelectItem>
                    <SelectItem value="single_use">Single Use - One time per user</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    required
                    min={form.startDate || new Date().toISOString().split('T')[0]}
                  />
                  {formErrors.endDate && <div className="text-xs text-red-500 mt-1">{formErrors.endDate}</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Applies To<span className="text-red-500">*</span></label>
                <Select
                  value={form.appliesTo}
                  onValueChange={v => setForm({ ...form, appliesTo: v as AppliesTo })}
                  disabled={formLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select applies to" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="categories">Category</SelectItem>
                    <SelectItem value="brands">Brand</SelectItem>
                    <SelectItem value="products">Advance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.appliesTo === "categories" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Categories<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    disabled={fetchingCats}
                  />
                  <div className="flex flex-col gap-2 border rounded bg-gray-50 p-2 max-h-56 overflow-y-auto">
                    {fetchingCats ? (
                      <Skeleton className="h-8 w-32 rounded" />
                    ) : (
                      <>
                        {/* Show selected categories even if not in current search results */}
                        {form.categories
                          .filter(cid => !categoryResults.some(c => c._id === cid))
                          .map(cid => (
                            <label key={cid} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 bg-yellow-50 rounded">
                              <input
                                type="checkbox"
                                checked={form.categories.includes(cid)}
                                onChange={e => {
                                  setForm({
                                    ...form,
                                    categories: e.target.checked
                                      ? [...form.categories, cid]
                                      : form.categories.filter((id) => id !== cid),
                                  })
                                }}
                                disabled={formLoading}
                              />
                              {cid}
                              <span className="text-xs text-gray-400">(selected)</span>
                            </label>
                          ))}
                        {/* Show current search results */}
                        {categoryResults.length === 0 && form.categories.length === 0 ? (
                          <span className="text-gray-400">No categories</span>
                        ) : (
                          categoryResults.map((cat) => (
                            <label key={cat._id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 hover:bg-gray-100 rounded">
                              <input
                                type="checkbox"
                                checked={form.categories.includes(cat._id)}
                                onChange={e => {
                                  setForm({
                                    ...form,
                                    categories: e.target.checked
                                      ? [...form.categories, cat._id]
                                      : form.categories.filter((id) => id !== cat._id),
                                  })
                                }}
                                disabled={formLoading}
                              />
                              {cat.name}
                            </label>
                          ))
                        )}
                        {/* Load More button for pagination */}
                        {categoryPage < categoryTotalPages && (
                          <button
                            type="button"
                            className="mt-2 px-3 py-1 rounded bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-dark"
                            onClick={() => setCategoryPage(categoryPage + 1)}
                            disabled={fetchingCats}
                          >
                            Load More
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {formErrors.categories && <div className="text-xs text-red-500 mt-1">{formErrors.categories}</div>}
                </div>
              )}
              {form.appliesTo === "brands" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Brands<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Search brands..."
                    value={brandSearch}
                    onChange={e => setBrandSearch(e.target.value)}
                    disabled={fetchingBrands}
                  />
                  <div className="flex flex-col gap-2 border rounded bg-gray-50 p-2 max-h-56 overflow-y-auto">
                    {fetchingBrands ? (
                      <Skeleton className="h-8 w-32 rounded" />
                    ) : (
                      <>
                        {/* Show selected brands even if not in current search results */}
                        {form.brands
                          .filter(bid => !brandResults.some(b => b._id === bid))
                          .map(bid => (
                            <label key={bid} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 bg-yellow-50 rounded">
                              <input
                                type="checkbox"
                                checked={form.brands.includes(bid)}
                                onChange={e => {
                                  setForm({
                                    ...form,
                                    brands: e.target.checked
                                      ? [...form.brands, bid]
                                      : form.brands.filter((id) => id !== bid),
                                  })
                                }}
                                disabled={formLoading}
                              />
                              {bid}
                              <span className="text-xs text-gray-400">(selected)</span>
                            </label>
                          ))}
                        {/* Show current search results */}
                        {brandResults.length === 0 && form.brands.length === 0 ? (
                          <span className="text-gray-400">No brands</span>
                        ) : (
                          brandResults.map((brand) => (
                            <label key={brand._id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 hover:bg-gray-100 rounded">
                              <input
                                type="checkbox"
                                checked={form.brands.includes(brand._id)}
                                onChange={e => {
                                  setForm({
                                    ...form,
                                    brands: e.target.checked
                                      ? [...form.brands, brand._id]
                                      : form.brands.filter((id) => id !== brand._id),
                                  })
                                }}
                                disabled={formLoading}
                              />
                              {brand.name}
                            </label>
                          ))
                        )}
                        {/* Load More button for pagination */}
                        {brandPage < brandTotalPages && (
                          <button
                            type="button"
                            className="mt-2 px-3 py-1 rounded bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-dark"
                            onClick={() => setBrandPage(brandPage + 1)}
                            disabled={fetchingBrands}
                          >
                            Load More
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {formErrors.brands && <div className="text-xs text-red-500 mt-1">{formErrors.brands}</div>}
                </div>
              )}
              {form.appliesTo === "products" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Products<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    disabled={fetchingProds}
                  />
                  <div className="flex flex-col gap-2 border rounded bg-gray-50 p-2 max-h-56 overflow-y-auto">
                    {fetchingProds ? (
                      <Skeleton className="h-8 w-32 rounded" />
                    ) : (
                      <>
                        {/* Show selected products even if not in current search results */}
                        {form.products
                          .filter(pid => !productResults.some(p => p._id === pid))
                          .map(pid => (
                            <label key={pid} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 bg-yellow-50 rounded">
                              <input
                                type="checkbox"
                                checked={form.products.includes(pid)}
                                onChange={e => {
                                  setForm({
                                    ...form,
                                    products: e.target.checked
                                      ? [...form.products, pid]
                                      : form.products.filter((id) => id !== pid),
                                  })
                                }}
                                disabled={formLoading}
                              />
                              {pid}
                              <span className="text-xs text-gray-400">(selected)</span>
                            </label>
                          ))}
                        {/* Show current search results */}
                        {productResults.length === 0 && form.products.length === 0 ? (
                          <span className="text-gray-400">No products</span>
                        ) : (
                          productResults.map((prod) => (
                            <label key={prod._id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 hover:bg-gray-100 rounded">
                              <input
                                type="checkbox"
                                checked={form.products.includes(prod._id)}
                                onChange={e => {
                                  setForm({
                                    ...form,
                                    products: e.target.checked
                                      ? [...form.products, prod._id]
                                      : form.products.filter((id) => id !== prod._id),
                                  })
                                }}
                                disabled={formLoading}
                              />
                              {prod.name}
                            </label>
                          ))
                        )}
                        {/* Load More button for pagination */}
                        {productPage < productTotalPages && (
                          <button
                            type="button"
                            className="mt-2 px-3 py-1 rounded bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-dark"
                            onClick={() => setProductPage(productPage + 1)}
                            disabled={fetchingProds}
                          >
                            Load More
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {formErrors.products && <div className="text-xs text-red-500 mt-1">{formErrors.products}</div>}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                {/* Expiry logic for edit/add modal */}
                {form.endDate && new Date(form.endDate) < new Date() ? (
                  <>
                    <Switch
                      checked={false}
                      disabled
                      className="data-[state=unchecked]:bg-gray-300"
                      id="promo-status-switch"
                    />
                    <label htmlFor="promo-status-switch" className="text-sm font-medium cursor-not-allowed select-none text-gray-400">
                      Inactive (Expired)
                    </label>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-200">Expired</span>
                  </>
                ) : (
                  <>
                    <Switch
                      checked={form.status}
                      onCheckedChange={v => setForm({ ...form, status: v })}
                      disabled={formLoading}
                      className={form.status ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-gray-300"}
                      id="promo-status-switch"
                    />
                    <label htmlFor="promo-status-switch" className="text-sm font-medium cursor-pointer select-none">
                      {form.status ? "Active" : "Inactive"}
                    </label>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold transition-colors duration-200 ${form.status
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 text-gray-400 border border-gray-200"
                        }`}
                    >
                      {form.status ? "Promo is enabled" : "Promo is disabled"}
                    </span>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[60px]"
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  disabled={formLoading}
                />
              </div>
              <DialogFooter>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  disabled={formLoading}
                >
                  {formLoading ? "Saving..." : "Save"}
                </button>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          open={!!showDelete}
          title="Delete Promo?"
          description={<span>Are you sure you want to delete promo <b>{showDelete?.code}</b>? This action cannot be undone.</span>}
          confirmText={formLoading ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          loading={formLoading}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(null)}
        />
      </div>
    </AdminLayout>
  )
}