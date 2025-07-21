"use client"

import React, { useEffect, useState, useMemo } from "react"
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
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal"

// --- Types ---
type PromoType = "percentage" | "fixed"
type AppliesTo = "all" | "categories" | "products"

type Promo = {
  _id: string
  code: string
  type: PromoType
  discount: number
  maxDiscount?: number
  minOrderAmount?: number
  usageLimit?: number
  startDate?: string
  endDate?: string
  appliesTo: AppliesTo
  categories?: string[]
  products?: string[]
  status: boolean
  description?: string
}

type Category = { _id: string; name: string }
type Product = { _id: string; name: string }

// --- Form State Type ---
type PromoForm = {
  code: string
  type: PromoType
  discount: number | ""
  maxDiscount: number | ""
  minOrderAmount: number | ""
  usageLimit: number | ""
  startDate: string
  endDate: string
  appliesTo: AppliesTo
  categories: string[]
  products: string[]
  status: boolean
  description: string
}

const API = process.env.NEXT_PUBLIC_API_URL + "/promocodes"
const CATEGORY_API = process.env.NEXT_PUBLIC_API_URL + "/categories"
const PRODUCT_API = process.env.NEXT_PUBLIC_API_URL + "/products"

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

  // --- Fetch Promos ---
  useEffect(() => {
    setLoading(true)
    fetch(API)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPromos(data)
        } else {
          setPromos([])
          toast.error(data?.error || "Failed to load promocodes")
        }
      })
      .catch(() => {
        setPromos([])
        toast.error("Failed to load promocodes")
      })
      .finally(() => setLoading(false))
  }, [])

  // --- Fetch Categories/Products for Multiselect ---
  useEffect(() => {
    setFetchingCats(true)
    fetch(CATEGORY_API)
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setFetchingCats(false))
    setFetchingProds(true)
    fetch(PRODUCT_API)
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setFetchingProds(false))
  }, [])

  // --- Form State ---
  const initialForm: PromoForm = {
    code: "",
    type: "percentage",
    discount: "",
    maxDiscount: "",
    minOrderAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    appliesTo: "all",
    categories: [],
    products: [],
    status: true,
    description: "",
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
      startDate: promo.startDate ? promo.startDate.slice(0, 10) : "",
      endDate: promo.endDate ? promo.endDate.slice(0, 10) : "",
      appliesTo: promo.appliesTo,
      categories: promo.categories ?? [],
      products: promo.products ?? [],
      status: !!promo.status,
      description: promo.description ?? "",
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
      categories: form.appliesTo === "categories" ? form.categories : [],
      products: form.appliesTo === "products" ? form.products : [],
    }
    try {
      let res
      if (editPromo) {
        res = await fetch(`${API}/${editPromo._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) throw new Error("Failed to save promocode")
      toast.success(editPromo ? "Promocode updated" : "Promocode added")
      setShowForm(false)
      setEditPromo(null)
      setForm(initialForm)
      // Refresh list
      setLoading(true)
      fetch(API)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPromos(data)
          } else {
            setPromos([])
            toast.error(data?.error || "Failed to load promocodes")
          }
        })
        .catch(() => {
          setPromos([])
          toast.error("Failed to load promocodes")
        })
        .finally(() => setLoading(false))
    } catch (err) {
      toast.error("Failed to save promocode")
    } finally {
      setFormLoading(false)
    }
  }

  // --- Handle Delete ---
  async function handleDelete() {
    if (!showDelete) return
    setFormLoading(true)
    try {
      const res = await fetch(`${API}/${showDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Promocode deleted")
      setShowDelete(null)
      setPromos((prev) => prev.filter((p) => p._id !== showDelete._id))
      // Refresh list
      setLoading(true)
      fetch(API)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPromos(data)
          } else {
            setPromos([])
            toast.error(data?.error || "Failed to load promocodes")
          }
        })
        .catch(() => {
          setPromos([])
          toast.error("Failed to load promocodes")
        })
        .finally(() => setLoading(false))
    } catch {
      toast.error("Failed to delete promocode")
    } finally {
      setFormLoading(false)
    }
  }

  // --- Table Columns ---
  const columns = [
    { label: "Code", key: "code" },
    { label: "Type", key: "type" },
    { label: "Discount", key: "discount" },
    { label: "Validity", key: "validity" },
    { label: "Status", key: "status" },
    { label: "Actions", key: "actions" },
  ]

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
        <div className="bg-white rounded-lg shadow p-0 md:p-6">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : promos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H8a1 1 0 01-1-1V7zm0 0l10 10" />
              </svg>
              <div className="text-lg text-gray-500 mb-2">No promocodes yet.</div>
              <div className="text-sm text-gray-400 mb-6">Click the + button or the button below to add your first promocode.</div>
              <button
                className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                onClick={openAdd}
              >
                Add Promocode
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo) => (
                  <TableRow key={promo._id}>
                    <TableCell>{promo.code}</TableCell>
                    <TableCell className="capitalize">{promo.type}</TableCell>
                    <TableCell>
                      {promo.type === "percentage"
                        ? `${promo.discount}%${promo.maxDiscount ? ` (Max ₹${promo.maxDiscount})` : ""}`
                        : `₹${promo.discount}`}
                    </TableCell>
                    <TableCell>
                      {promo.startDate && promo.endDate
                        ? `${format(parseISO(promo.startDate), "dd MMM yyyy")} → ${format(parseISO(promo.endDate), "dd MMM yyyy")}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.status ? "default" : "destructive"}>
                        {promo.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-dark text-white rounded p-2"
                          onClick={() => openEdit(promo)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          className="inline-flex items-center justify-center bg-brand-error hover:bg-brand-error-dark text-white rounded p-2"
                          onClick={() => setShowDelete(promo)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Add/Edit Promo Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg w-full">
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full flex items-center justify-between border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white",
                          !form.startDate && "text-gray-400"
                        )}
                        aria-label="Pick start date"
                      >
                        {form.startDate
                          ? format(new Date(form.startDate), "dd-MM-yyyy")
                          : "dd-mm-yyyy"}
                        <CalendarIcon className="h-5 w-5 text-gray-400 ml-2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border rounded-lg shadow-lg">
                      <Calendar
                        mode="single"
                        selected={form.startDate ? new Date(form.startDate) : undefined}
                        onSelect={date => setForm({ ...form, startDate: date ? format(date, "yyyy-MM-dd") : "" })}
                        initialFocus
                      />
                      <div className="flex justify-between px-3 pb-2 pt-1">
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-brand-primary"
                          onClick={() => setForm({ ...form, startDate: "" })}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-brand-primary"
                          onClick={() => setForm({ ...form, startDate: format(new Date(), "yyyy-MM-dd") })}
                        >
                          Today
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full flex items-center justify-between border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white",
                          !form.endDate && "text-gray-400"
                        )}
                        aria-label="Pick end date"
                      >
                        {form.endDate
                          ? format(new Date(form.endDate), "dd-MM-yyyy")
                          : "dd-mm-yyyy"}
                        <CalendarIcon className="h-5 w-5 text-gray-400 ml-2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border rounded-lg shadow-lg">
                      <Calendar
                        mode="single"
                        selected={form.endDate ? new Date(form.endDate) : undefined}
                        onSelect={date => setForm({ ...form, endDate: date ? format(date, "yyyy-MM-dd") : "" })}
                        initialFocus
                      />
                      <div className="flex justify-between px-3 pb-2 pt-1">
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-brand-primary"
                          onClick={() => setForm({ ...form, endDate: "" })}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-brand-primary"
                          onClick={() => setForm({ ...form, endDate: format(new Date(), "yyyy-MM-dd") })}
                        >
                          Today
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                    <SelectItem value="categories">Categories</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.appliesTo === "categories" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Categories<span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {fetchingCats ? (
                      <Skeleton className="h-8 w-32 rounded" />
                    ) : categories.length === 0 ? (
                      <span className="text-gray-400">No categories</span>
                    ) : (
                      categories.map((cat) => (
                        <label key={cat._id} className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded cursor-pointer">
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
                  </div>
                  {formErrors.categories && <div className="text-xs text-red-500 mt-1">{formErrors.categories}</div>}
                </div>
              )}
              {form.appliesTo === "products" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Products<span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {fetchingProds ? (
                      <Skeleton className="h-8 w-32 rounded" />
                    ) : products.length === 0 ? (
                      <span className="text-gray-400">No products</span>
                    ) : (
                      products.map((prod) => (
                        <label key={prod._id} className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded cursor-pointer">
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
                  </div>
                  {formErrors.products && <div className="text-xs text-red-500 mt-1">{formErrors.products}</div>}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
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