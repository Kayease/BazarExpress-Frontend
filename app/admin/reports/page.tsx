"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { BarChart3, TrendingUp, TrendingDown, IndianRupee, Users, ShoppingCart, Calendar } from "lucide-react"
import jsPDF from 'jspdf'
import DateRangePicker from '../../../components/ui/DateRangePicker'
import { format as formatDate } from 'date-fns'

export default function AdminReports() {
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const router = useRouter()

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'reports')) {
      router.push("/")
      return
    }
  }, [user]);

  const numberFmt = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 }), [])

  // Filters
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [warehouseId, setWarehouseId] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [paymentMethod, setPaymentMethod] = useState<string>('all')
  const [categoryId, setCategoryId] = useState<string>('')
  const [brandId, setBrandId] = useState<string>('')
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)

  // Data
  const [loading, setLoading] = useState<boolean>(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({ cards: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }, revenueByDay: [], ordersByDay: [], topCategories: [], interval: 'daily' })
  const [orders, setOrders] = useState<any[]>([])
  const [interval, setInterval] = useState<string>('monthly')
  const [page, setPage] = useState<number>(1)
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const ORDERS_PER_PAGE = 100

  const apiBase = process.env.NEXT_PUBLIC_API_URL

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (warehouseId && warehouseId !== 'all') params.set('warehouseId', warehouseId)
    if (status && status !== 'all') params.set('status', status)
    if (paymentMethod && paymentMethod !== 'all') params.set('paymentMethod', paymentMethod)
    if (categoryId) params.set('categoryId', categoryId)
    if (brandId) params.set('brandId', brandId)
    if (interval) params.set('interval', interval)
    return params.toString()
  }, [startDate, endDate, warehouseId, status, paymentMethod, categoryId, brandId, interval])

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/warehouses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const list = data.warehouses || data || []
        setWarehouses(list)
      }
    } catch {}
  }, [apiBase, token])

  const fetchSummary = useCallback(async () => {
    if (!apiBase) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/reports/summary?${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load summary')
      const data = await res.json()
      setSummary(data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }, [apiBase, token, queryString])

  const fetchOrders = useCallback(async () => {
    if (!apiBase) return
    try {
      const params = new URLSearchParams(queryString)
      params.set('page', String(page))
      params.set('limit', String(ORDERS_PER_PAGE))
      const res = await fetch(`${apiBase}/reports/orders?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load orders')
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalOrders(data.total || 0)
    } catch (e) {
    }
  }, [apiBase, token, queryString, page])

  useEffect(() => {
    if (token) {
      fetchWarehouses()
    }
  }, [token, fetchWarehouses])

  useEffect(() => {
    if (token) {
      fetchSummary()
      fetchOrders()
    }
  }, [token, fetchSummary, fetchOrders])

  // Auto-refresh when filters change (no Apply button)
  useEffect(() => {
    if (token) {
      setPage(1)
      fetchSummary()
      fetchOrders()
    }
  }, [queryString])

  const exportCsv = useCallback(async () => {
    if (!apiBase) return
    const res = await fetch(`${apiBase}/reports/export/csv?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reports.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [apiBase, token, queryString])

  const exportTally = useCallback(async () => {
    if (!apiBase) return
    const res = await fetch(`${apiBase}/reports/export/tally?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tally.xml'
    a.click()
    URL.revokeObjectURL(url)
  }, [apiBase, token, queryString])

  const exportPdf = useCallback(() => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    let y = 40
    doc.setFontSize(16)
    doc.text('Reports Summary', 40, y)
    y += 24
    doc.setFontSize(12)
    const cards = summary.cards || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }
    const lines = [
      `Total Orders: ${cards.totalOrders}`,
      `Total Revenue: ${numberFmt.format(cards.totalRevenue)}`,
      `Avg Order Value: ${numberFmt.format(cards.avgOrderValue)}`,
      `Filters: ${[startDate && `from ${startDate}`, endDate && `to ${endDate}`, warehouseId !== 'all' && `WH ${warehouseId}`, status !== 'all' && `status ${status}`, paymentMethod !== 'all' && `pay ${paymentMethod}`].filter(Boolean).join(', ')}`
    ]
    lines.forEach((t) => { doc.text(t, 40, y); y += 18 })
    y += 10
    doc.text('Recent Orders', 40, y); y += 20
    const head = ['InvoiceID', 'Date', 'Warehouse', 'Total']
    doc.setFontSize(10)
    doc.text(head.join('    '), 40, y); y += 14
    orders.slice(0, 25).forEach((o) => {
      const row = [o.invoiceNumber || o.orderId, new Date(o.createdAt).toLocaleString(), o.warehouseInfo?.warehouseName || '', String(o.pricing?.total || '')]
      doc.text(row.join('    '), 40, y)
      y += 14
      if (y > 780) { doc.addPage(); y = 40 }
    })
    doc.save('reports.pdf')
  }, [summary, orders, numberFmt, startDate, endDate, warehouseId, status, paymentMethod])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-codGray">Reports & Analytics</h2>
            <p className="text-gray-600">Track your business performance</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportPdf} className="bg-white border hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">Export PDF</button>
            <button onClick={exportCsv} className="bg-white border hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">Export CSV</button>
            <button onClick={exportTally} className="bg-white border hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">Export Tally XML</button>
            <button onClick={() => { fetchSummary(); fetchOrders(); }} className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg transition-colors">Generate</button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-codGray">Filters</h3>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Date Range</label>
              <DateRangePicker
                startDate={rangeStart}
                endDate={rangeEnd}
                onDateRangeChange={(s, e) => {
                  setRangeStart(s)
                  setRangeEnd(e)
                  const toStr = (d: Date | null) => (d ? formatDate(d, 'yyyy-MM-dd') : '')
                  setStartDate(toStr(s))
                  setEndDate(toStr(e))
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Warehouse</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full border rounded px-3 h-10 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary">
                <option value="all">All</option>
                {warehouses.map((w) => (
                  <option key={w._id || w.id} value={(w._id || w.id)}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 h-10 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary">
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Payment</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border rounded px-3 h-10 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary">
                <option value="all">All</option>
                <option value="cod">COD</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRangeStart(null); setRangeEnd(null); setStartDate(''); setEndDate(''); setWarehouseId('all'); setStatus('all'); setPaymentMethod('all'); setCategoryId(''); setBrandId(''); setPage(1); }} className="px-3 h-10 rounded-lg border border-brand-primary text-brand-primary bg-white hover:bg-brand-primary hover:text-white transition-colors text-sm">Reset</button>
              <button onClick={() => { fetchSummary(); fetchOrders(); }} className="px-3 h-10 rounded-lg bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors text-sm">Refresh</button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-codGray">₹{numberFmt.format(summary.cards?.totalRevenue || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-codGray">{numberFmt.format(summary.cards?.totalOrders || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-codGray">
                  ₹{numberFmt.format(summary.cards?.avgOrderValue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Return Orders</p>
                <p className="text-2xl font-bold text-codGray">{numberFmt.format(summary.cards?.returnOrders || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Top Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-codGray">Sales Overview</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Interval</label>
                <select value={interval} onChange={(e) => setInterval(e.target.value)} className="border rounded px-2 h-9">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-gray-50 rounded-lg p-4 overflow-auto border">
                <div className="text-sm font-medium text-gray-700">Revenue ({summary.interval.charAt(0).toUpperCase() + summary.interval.slice(1) || interval})</div>
                <div className="mt-2 text-xs text-gray-800 space-y-1 max-h-56 overflow-auto">
                  {summary.revenueByDay?.map((d: any) => (
                    <div key={d._id} className="flex justify-between">
                      <span>{d._id}</span>
                      <span>₹{numberFmt.format(d.total)}</span>
                    </div>
                  ))}
                    </div>
                  </div>
              <div className="h-64 bg-gray-50 rounded-lg p-4 overflow-auto border">
                <div className="text-sm font-medium text-gray-700">Orders ({summary.interval.charAt(0).toUpperCase() + summary.interval.slice(1) || interval})</div>
                <div className="mt-2 text-xs text-gray-800 space-y-1 max-h-56 overflow-auto">
                  {summary.ordersByDay?.map((d: any) => (
                    <div key={d._id} className="flex justify-between">
                      <span>{d._id}</span>
                      <span>{numberFmt.format(d.total)}</span>
                </div>
              ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-codGray">Top Categories</h3>
              <div className="flex items-center gap-1 text-sm">
                {typeof summary.cards?.growthPct === 'number' && (
                  <span className={`inline-flex items-center px-2 py-1 rounded ${summary.cards.growthPct >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {summary.cards.growthPct >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />} 
                    {`${summary.cards.growthPct >= 0 ? '+' : ''}${Number(summary.cards.growthPct).toFixed(1)}%`}
                  </span>
                )}
              </div>
            </div>
            <div className="max-h-64 overflow-auto pr-1 space-y-3">
              {(summary.topCategories || []).map((category: any, index: number) => {
                const topRevenue = (summary.topCategories?.[0]?.revenue || 1);
                const pct = Math.max(2, Math.round((category.revenue / topRevenue) * 100));
                const isGrowth = summary.cards?.growthPct >= 0;
                return (
                  <div key={index} className="">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-codGray truncate pr-3">{category.name || 'Category'}</span>
                      <span className="text-sm text-gray-500 whitespace-nowrap">₹{numberFmt.format(category.revenue || 0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className={`${isGrowth ? 'bg-green-500' : 'bg-red-500'} h-2 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-codGray">Orders</h3>
            <span className="text-sm text-gray-500">{numberFmt.format(totalOrders)} results</span>
          </div>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-gray-700">
                  <th className="text-left py-2 px-3">Invoice ID</th>
                  <th className="text-left py-2 px-3">Customer</th>
                  <th className="text-center py-2 px-3">Payment</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Warehouse</th>
                  <th className="text-center py-2 px-3">CGST</th>
                  <th className="text-center py-2 px-3">SGST</th>
                  <th className="text-center py-2 px-3">IGST</th>
                  <th className="text-center py-2 px-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const cgst = o.taxCalculation?.taxBreakdown?.cgst?.amount
                  const sgst = o.taxCalculation?.taxBreakdown?.sgst?.amount
                  const igst = o.taxCalculation?.taxBreakdown?.igst?.amount
                  return (
                    <tr key={o.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <div className="text-xs font-semibold text-codGray">{o.invoiceNumber || o.orderId}</div>
                        <div className="text-[11px] text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                        <div className="text-[11px] text-gray-500">{o.items?.length || 0} items</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-xs font-medium text-codGray truncate" title={o.customerInfo?.name}>{o.customerInfo?.name || '-'}</div>
                        <div className="text-[11px] text-gray-500 truncate" title={o.customerInfo?.email}>{o.customerInfo?.email || '-'}</div>
                        <div className="text-[11px] text-gray-500 truncate" title={o.customerInfo?.phone}>{o.customerInfo?.phone || '-'}</div>
                      </td>
                      <td className="py-2 px-3 text-center uppercase">{o.paymentInfo?.method || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border capitalize ${
                          o.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          o.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          o.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          o.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          o.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          o.status === 'refunded' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">{o.warehouseInfo?.warehouseName || '-'}</td>
                      <td className="py-2 px-3 text-center">{typeof cgst === 'number' && cgst > 0 ? `₹${numberFmt.format(cgst)}` : '-'}</td>
                      <td className="py-2 px-3 text-center">{typeof sgst === 'number' && sgst > 0 ? `₹${numberFmt.format(sgst)}` : '-'}</td>
                      <td className="py-2 px-3 text-center">{typeof igst === 'number' && igst > 0 ? `₹${numberFmt.format(igst)}` : '-'}</td>
                      <td className="py-2 text-center px-3">₹{numberFmt.format(o.pricing?.total || 0)}</td>
                </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalOrders > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * ORDERS_PER_PAGE + 1} to {Math.min(page * ORDERS_PER_PAGE, totalOrders)} of {numberFmt.format(totalOrders)} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">Page {page} of {Math.max(1, Math.ceil(totalOrders / ORDERS_PER_PAGE))}</span>
                <button
                  className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(Math.ceil(totalOrders / ORDERS_PER_PAGE), p + 1))}
                  disabled={page >= Math.ceil(totalOrders / ORDERS_PER_PAGE)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
