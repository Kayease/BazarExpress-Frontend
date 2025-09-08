"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/AdminLayout"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth'
import { BarChart3, TrendingUp, TrendingDown, IndianRupee, Users, ShoppingCart, Calendar, RotateCcw } from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import DateRangePicker from '../../../components/ui/DateRangePicker'
import { format as formatDate } from 'date-fns'
import { calculateCartTax, ProductTaxInfo } from '../../../lib/tax-calculation'

// Helper function to extract state from address (same as ReturnDetailsModal)
function extractStateFromAddress(address: string): string {
  if (!address) return '';
  
  // Common state patterns in Indian addresses
  const statePatterns = [
    /\b(Andhra Pradesh|AP)\b/i,
    /\b(Arunachal Pradesh|AR)\b/i,
    /\b(Assam|AS)\b/i,
    /\b(Bihar|BR)\b/i,
    /\b(Chhattisgarh|CG)\b/i,
    /\b(Goa|GA)\b/i,
    /\b(Gujarat|GJ)\b/i,
    /\b(Haryana|HR)\b/i,
    /\b(Himachal Pradesh|HP)\b/i,
    /\b(Jharkhand|JH)\b/i,
    /\b(Karnataka|KA)\b/i,
    /\b(Kerala|KL)\b/i,
    /\b(Madhya Pradesh|MP)\b/i,
    /\b(Maharashtra|MH)\b/i,
    /\b(Manipur|MN)\b/i,
    /\b(Meghalaya|ML)\b/i,
    /\b(Mizoram|MZ)\b/i,
    /\b(Nagaland|NL)\b/i,
    /\b(Odisha|OR)\b/i,
    /\b(Punjab|PB)\b/i,
    /\b(Rajasthan|RJ)\b/i,
    /\b(Sikkim|SK)\b/i,
    /\b(Tamil Nadu|TN)\b/i,
    /\b(Telangana|TS)\b/i,
    /\b(Tripura|TR)\b/i,
    /\b(Uttar Pradesh|UP)\b/i,
    /\b(Uttarakhand|UK)\b/i,
    /\b(West Bengal|WB)\b/i,
    /\b(Delhi|DL)\b/i,
    /\b(Jammu and Kashmir|JK)\b/i,
    /\b(Ladakh|LA)\b/i,
    /\b(Chandigarh|CH)\b/i,
    /\b(Puducherry|PY)\b/i,
    /\b(Andaman and Nicobar Islands|AN)\b/i,
    /\b(Dadra and Nagar Haveli and Daman and Diu|DN)\b/i,
    /\b(Lakshadweep|LD)\b/i
  ];
  
  for (const pattern of statePatterns) {
    const match = address.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return '';
}

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

  // Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders')

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

  // Return-specific filters
  const [returnStartDate, setReturnStartDate] = useState<string>('')
  const [returnEndDate, setReturnEndDate] = useState<string>('')
  const [returnWarehouseId, setReturnWarehouseId] = useState<string>('all')
  const [returnStatus, setReturnStatus] = useState<string>('all')
  const [returnRangeStart, setReturnRangeStart] = useState<Date | null>(null)
  const [returnRangeEnd, setReturnRangeEnd] = useState<Date | null>(null)

  // Data
  const [loading, setLoading] = useState<boolean>(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({ cards: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }, revenueByDay: [], ordersByDay: [], topCategories: [], interval: 'daily' })
  const [orders, setOrders] = useState<any[]>([])
  const [interval, setInterval] = useState<string>('monthly')
  const [page, setPage] = useState<number>(1)
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const ORDERS_PER_PAGE = 100

  // Return data
  const [returnSummary, setReturnSummary] = useState<any>({ cards: { totalReturns: 0, totalReturnValue: 0, avgReturnValue: 0 }, returnsByDay: [], topReturnCategories: [], interval: 'daily' })
  const [returns, setReturns] = useState<any[]>([])
  const [returnPage, setReturnPage] = useState<number>(1)
  const [totalReturns, setTotalReturns] = useState<number>(0)

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

  const returnQueryString = useMemo(() => {
    const params = new URLSearchParams()
    if (returnStartDate) params.set('startDate', returnStartDate)
    if (returnEndDate) params.set('endDate', returnEndDate)
    if (returnWarehouseId && returnWarehouseId !== 'all') params.set('warehouseId', returnWarehouseId)
    if (returnStatus && returnStatus !== 'all') params.set('status', returnStatus)
    if (interval) params.set('interval', interval)
    return params.toString()
  }, [returnStartDate, returnEndDate, returnWarehouseId, returnStatus, interval])

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

  const fetchReturnSummary = useCallback(async () => {
    if (!apiBase) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/reports/returns/summary?${returnQueryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load return summary')
      const data = await res.json()
      setReturnSummary(data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }, [apiBase, token, returnQueryString])

  const fetchReturns = useCallback(async () => {
    if (!apiBase) return
    try {
      const params = new URLSearchParams(returnQueryString)
      params.set('page', String(returnPage))
      params.set('limit', String(ORDERS_PER_PAGE))
      const res = await fetch(`${apiBase}/reports/returns?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load returns')
      const data = await res.json()
      setReturns(data.returns || [])
      setTotalReturns(data.total || 0)
    } catch (e) {
    }
  }, [apiBase, token, returnQueryString, returnPage])

  useEffect(() => {
    if (token) {
      fetchWarehouses()
    }
  }, [token, fetchWarehouses])

  useEffect(() => {
    if (token) {
      if (activeTab === 'orders') {
        fetchSummary()
        fetchOrders()
      } else {
        fetchReturnSummary()
        fetchReturns()
      }
    }
  }, [token, fetchSummary, fetchOrders, fetchReturnSummary, fetchReturns, activeTab])

  // Auto-refresh when filters change (no Apply button)
  useEffect(() => {
    if (token) {
      if (activeTab === 'orders') {
        setPage(1)
        fetchSummary()
        fetchOrders()
      } else {
        setReturnPage(1)
        fetchReturnSummary()
        fetchReturns()
      }
    }
  }, [queryString, returnQueryString, activeTab])

  

  const exportTally = useCallback(async () => {
    if (!apiBase) return
    const endpoint = activeTab === 'orders' ? 'reports/export/tally' : 'reports/returns/export/tally'
    const query = activeTab === 'orders' ? queryString : returnQueryString
    const res = await fetch(`${apiBase}/${endpoint}?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fmt = (d: Date) => `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const s = activeTab === 'orders' ? startDate : returnStartDate
    const e = activeTab === 'orders' ? endDate : returnEndDate
    const today = new Date()
    const start = s ? new Date(s) : today
    const end = e ? new Date(e) : start
    const range = `${fmt(start)}-${fmt(end)}`
    const prefix = activeTab === 'orders' ? 'Order Report' : 'Return Report'
    a.download = `${prefix} ${range}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }, [apiBase, token, queryString, returnQueryString, activeTab])

  const exportXlsx = useCallback(async () => {
    // Dynamically import exceljs for browser
    const ExcelJS = await import('exceljs').then(m => m.default || m)

    // Build data arrays
    const amt = (n: any) => Number(n || 0)
    const fmtISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const getRefundMethod = (ret: any, ordOverride?: any, explicitPref?: any) => {
      const order = ordOverride || ret?.orderObjectId || {}
      const pref = explicitPref || ret?.refundPreference || order?.refundPreference || ret?.refundInfo || order?.refundInfo || {}
      const method = (pref?.method || pref?.type || pref?.mode || ret?.refundMethod || '').toString().toLowerCase()
      if (method === 'upi' || pref?.upiId) {
        const upi = pref?.upiId ? String(pref.upiId) : ''
        return upi ? `UPI: ${upi}` : 'UPI'
      }
      if (method === 'bank' || pref?.bankDetails) {
        const bank = pref?.bankDetails || {}
        const mask = (acc: any) => acc ? `XXXX${String(acc).slice(-4)}` : ''
        const parts = [ 'Bank', bank.bankName || '', mask(bank.accountNumber), bank.ifsc || '' ].filter(Boolean)
        return parts.join(' ')
      }
      return 'N/A'
    }

    // When exporting, enrich data to accurately derive missing fields (PIN, refund preference)
    const orderDetailById = new Map<string, any>()
    const returnDetailById = new Map<string, any>()
    const returnListById = new Map<string, any>()
    const tryParseReturn = (json: any) => (json?.return || json?.data || json?.result || json || null)
    if (activeTab === 'returns') {
      try {
        const ids = Array.from(new Set((returns || []).map((ret: any) => ret?.orderObjectId?.orderId || ret?.orderId).filter(Boolean))) as string[]
        const retIds = Array.from(new Set((returns || []).map((ret: any) => ret?.returnId || ret?._id).filter(Boolean))) as string[]
        if (ids.length && apiBase) {
          const fetched = await Promise.all(ids.map(async (oid) => {
            try {
              const res = await fetch(`${apiBase}/orders/order/${oid}`, { headers: { 'Authorization': `Bearer ${token}` } })
              if (res.ok) {
                const json = await res.json()
                return [oid, json?.order || null] as const
              }
            } catch {}
            return [oid, null] as const
          }))
          fetched.forEach(([oid, ord]) => { if (ord) orderDetailById.set(oid, ord) })
        }
        if (retIds.length && apiBase) {
          const fetchedReturns = await Promise.all(retIds.map(async (rid) => {
            const headers = { 'Authorization': `Bearer ${token}` }
            const paths = [
              `${apiBase}/returns/${rid}`,
              `${apiBase}/returns/return/${rid}`,
              `${apiBase}/returns/details/${rid}`
            ]
            for (const url of paths) {
              try {
                const res = await fetch(url, { headers })
                if (res.ok) {
                  const json = await res.json()
                  const ret = tryParseReturn(json)
                  if (ret) return [rid, ret] as const
                }
              } catch {}
            }
            return [rid, null] as const
          }))
          fetchedReturns.forEach(([rid, ret]) => { if (ret) returnDetailById.set(rid, ret) })
          // Also enrich via by-order endpoints
          const orderIdsForMissing = Array.from(new Set(
            (returns || [])
              .filter((ret: any) => !returnDetailById.has(ret?.returnId || ret?._id))
              .map((ret: any) => ret?.orderObjectId?.orderId || ret?.orderId)
              .filter(Boolean)
          )) as string[]
          if (orderIdsForMissing.length) {
            await Promise.all(orderIdsForMissing.map(async (oid) => {
              const paths = [
                `${apiBase}/returns/by-order/${oid}`,
                `${apiBase}/orders/${oid}/returns`
              ]
              for (const url of paths) {
                try {
                  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                  if (res.ok) {
                    const json = await res.json()
                    const list = (json?.returns || json?.data || json) as any[]
                    if (Array.isArray(list)) {
                      list.forEach((ret: any) => {
                        const key = ret?.returnId || ret?._id
                        if (key && ret && !returnDetailById.has(key)) returnDetailById.set(key, ret)
                      })
                    }
                  }
                } catch {}
              }
            }))
          }
        }
        // Admin returns list for explicit refundPreference
        try {
          const resList = await fetch(`${apiBase}/returns/admin/all?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } })
          if (resList.ok) {
            const json = await resList.json().catch(() => ({} as any))
            const list = json?.returns || json?.data || []
            if (Array.isArray(list)) {
              list.forEach((ret: any) => {
                const key = ret?.returnId || ret?._id
                if (key) returnListById.set(key, ret)
              })
            }
          }
        } catch {}
      } catch {}
    }
    // Enrich Orders too, to ensure delivery address is present for Delivery PIN
    if (activeTab === 'orders') {
      try {
        const ids = Array.from(new Set((orders || []).map((o: any) => o?.orderId).filter(Boolean))) as string[]
        if (ids.length && apiBase) {
          const fetched = await Promise.all(ids.map(async (oid) => {
            try {
              const res = await fetch(`${apiBase}/orders/order/${oid}`, { headers: { 'Authorization': `Bearer ${token}` } })
              if (res.ok) {
                const json = await res.json()
                return [oid, json?.order || null] as const
              }
            } catch {}
            return [oid, null] as const
          }))
          fetched.forEach(([oid, ord]) => { if (ord) orderDetailById.set(oid, ord) })
        }
      } catch {}
    }
    const getPinFromObject = (obj: any): string => {
      if (!obj) return ''
      const a = obj?.address || obj
      const direct = (
        a?.pincode || a?.pinCode || a?.postalCode || a?.zip || a?.zipcode || a?.zipCode
      )
      if (direct) return String(direct)
      // Try common address string fields
      const candidates: string[] = [a?.area, a?.address, a?.building, a?.landmark, a?.city, a?.state, a?.warehouseAddress]
        .filter(Boolean)
        .map(String)
      const joined = candidates.join(' ')
      const m = joined.match(/\b\d{6}\b/)
      return m ? m[0] : ''
    }
    const buildOrders = () => {
      const headers = ['Date','InvoiceID','OrderID','Warehouse','Customer','Phone','Delivery PIN','Payment','Status','Subtotal','CGST','SGST','IGST','Discount','Delivery','Items','Total','Products']
      const rows = orders.map((o: any) => {
        const created = new Date(o.createdAt)
        const dateStr = fmtISODate(created)
        const subtotal = (typeof o?.pricing?.subtotal === 'number' ? o.pricing.subtotal : (o.items || []).reduce((s: number, it: any) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)) || 0
        const discount = (o?.pricing?.discount ?? o?.pricing?.discountAmount ?? 0) || 0
        const delivery = (o?.pricing?.delivery ?? o?.pricing?.shipping ?? o?.pricing?.deliveryCharge ?? 0) || 0
        const total = (o?.pricing?.total ?? 0) || 0
        const cgst = o?.taxCalculation?.taxBreakdown?.cgst?.amount ?? 0
        const sgst = o?.taxCalculation?.taxBreakdown?.sgst?.amount ?? 0
        const igst = o?.taxCalculation?.taxBreakdown?.igst?.amount ?? 0
        const itemsCount = (o.items?.length || 0)
        const enrichedOrder = orderDetailById.get(o?.orderId) || o
        const deliveryPin = getPinFromObject(enrichedOrder?.deliveryInfo) || getPinFromObject(enrichedOrder?.warehouseInfo) || getPinFromObject(o?.deliveryInfo) || getPinFromObject(o?.warehouseInfo)
        const productsTextRaw = (o.items || []).map((it: any) => {
          const pct = it?.tax?.percentage ?? 0
          const inc = it?.priceIncludesTax ? 'Inc.' : 'Excl.'
          return `${it?.name || ''} - ${pct}%(${inc})`
        }).join('\n')
        return [
          dateStr,
          o.invoiceNumber || '',
          o.orderId || '',
          o.warehouseInfo?.warehouseName || '-',
          o.customerInfo?.name || '-',
          o.customerInfo?.phone || '-',
          deliveryPin,
          (o.paymentInfo?.method || '-').toUpperCase(),
          (o.status || '-').toString(),
          amt(subtotal),
          amt(cgst),
          amt(sgst),
          amt(igst),
          amt(discount),
          amt(delivery),
          itemsCount,
          amt(total),
          productsTextRaw
        ]
      })
      return { headers, rows }
    }
    const buildReturns = () => {
      const headers = ['Date','InvoiceID','ReturnID','Warehouse','Customer','Phone','Pickup PIN','Payment Preference','Status','Subtotal','CGST','SGST','IGST','Discount','Items','Refund Amount','Products']
      const rows = returns.map((r: any) => {
        const order = orderDetailById.get(r?.orderObjectId?.orderId || r?.orderId) || r.orderObjectId
        const returnIdKey = r?.returnId || r?._id
        const orderIdKey = r?.orderObjectId?.orderId || r?.orderId
        const fullReturn = returnDetailById.get(returnIdKey) || r
        const fullOrder = orderDetailById.get(orderIdKey) || order
        const explicitPref = returnListById.get(returnIdKey)?.refundPreference
        const customerState = order?.deliveryInfo?.address?.state || ''
        const warehouseState = order?.warehouseInfo?.warehouseId?.address ? 
          extractStateFromAddress(order.warehouseInfo.warehouseId.address) : 
          (order?.warehouseInfo?.warehouseId?.state || '')
        const isInterstate = !!(customerState && warehouseState && customerState.toLowerCase().trim() !== warehouseState.toLowerCase().trim()) || order?.taxCalculation?.isInterState === true
        let cgst = 0, sgst = 0, igst = 0, taxSubtotal = 0, totalTax = 0, finalTotal = 0
        if (r.items && r.items.length > 0) {
          const itemsForTax: ProductTaxInfo[] = r.items.map((item: any) => ({
            price: item.price,
            priceIncludesTax: item.priceIncludesTax || false,
            tax: item.tax ? { id: item.tax._id, name: item.tax.name, percentage: item.tax.percentage, description: item.tax.description } : null,
            quantity: item.quantity
          }))
          const taxCalculation = calculateCartTax(itemsForTax, isInterstate, warehouseState, customerState)
          cgst = taxCalculation.totalCGST
          sgst = taxCalculation.totalSGST
          igst = taxCalculation.totalIGST
          taxSubtotal = taxCalculation.subtotal
          totalTax = taxCalculation.totalTax
          finalTotal = taxCalculation.finalTotal
        }
        const created = new Date(r.createdAt)
        const dateStr = fmtISODate(created)
        const subtotal = taxSubtotal
        const orderForDiscount = fullOrder || order
        let totalDiscountFromOrder = (
          orderForDiscount?.promoCode?.discountAmount ??
          orderForDiscount?.promoCode?.discount ??
          orderForDiscount?.pricing?.discountAmount ??
          orderForDiscount?.pricing?.discountTotal ??
          orderForDiscount?.pricing?.discount ??
          orderForDiscount?.orderSummary?.totalDiscount ??
          orderForDiscount?.appliedPromocode?.discountValue ??
          orderForDiscount?.coupon?.discountAmount ??
          orderForDiscount?.discount ??
          0
        ) as number
        if (!totalDiscountFromOrder) {
          const delivery = (orderForDiscount?.pricing?.delivery ?? orderForDiscount?.pricing?.shipping ?? orderForDiscount?.pricing?.deliveryCharge ?? 0) || 0
          const ocgst = orderForDiscount?.taxCalculation?.taxBreakdown?.cgst?.amount ?? 0
          const osgst = orderForDiscount?.taxCalculation?.taxBreakdown?.sgst?.amount ?? 0
          const oigst = orderForDiscount?.taxCalculation?.taxBreakdown?.igst?.amount ?? 0
          const ototal = (orderForDiscount?.pricing?.total ?? 0) || 0
          const osub = (orderForDiscount?.pricing?.subtotal ?? 0) || 0
          const derived = osub + delivery + ocgst + osgst + oigst - ototal
          totalDiscountFromOrder = derived > 0 ? derived : 0
        }
        const denom = taxSubtotal + totalTax
        const discountRatio = denom > 0 ? totalDiscountFromOrder / denom : 0
        const discount = finalTotal * discountRatio
        const total = (typeof r.refundedAmount === 'number' ? r.refundedAmount : Math.max(0, finalTotal - discount))
        const itemsCount = r.items?.length || 0
        const productsTextRaw = (r.items || []).map((it: any) => {
          const pct = it?.tax?.percentage ?? 0
          const inc = it?.priceIncludesTax ? 'Inc.' : 'Excl.'
          return `${it?.name || ''} - ${pct}%(${inc})`
        }).join('\n')
        const refundMethod = getRefundMethod(fullReturn, fullOrder, explicitPref)
        // Prefer explicit pickup address; fallback to order delivery address
        const pickupPin = getPinFromObject(fullReturn?.pickupInfo) || getPinFromObject(fullOrder?.deliveryInfo)
        return [
          dateStr,
          r.orderObjectId?.invoiceNumber || r.orderObjectId?.orderId || r.orderId || '-',
          r.returnId || r._id || '-',
          r.warehouseInfo?.warehouseName || '-',
          r.customerInfo?.name || '-',
          r.customerInfo?.phone || '-',
          pickupPin,
          refundMethod,
          r.status.replace('_', ' '),
          amt(subtotal),
          amt(cgst),
          amt(sgst),
          amt(igst),
          amt(discount),
          itemsCount,
          amt(total),
          productsTextRaw
        ]
      })
      return { headers, rows }
    }

    const { headers, rows } = activeTab === 'orders' ? buildOrders() : buildReturns()

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(activeTab === 'orders' ? 'Orders' : 'Returns')

    // Define only widths (no headers) to avoid ExcelJS auto-inserting a header row at A1
    // Added PIN column after Phone, so insert a width for it
    const baseWidths = [16, 22, 22, 24, 22, 16, 12, 18, 16, 14, 12, 12, 12, 14]
    const allWidths = activeTab === 'orders' ? [...baseWidths, 14, 10, 16, 100] : [...baseWidths, 10, 16, 100]
    sheet.columns = allWidths.map((w) => ({ width: w })) as any

    // Title and metadata rows
    const brandColor = activeTab === 'orders' ? 'FF2563EB' : 'FFDC2626'
    const titleRow = sheet.addRow([`${activeTab === 'orders' ? 'Order Report' : 'Return Report'}`])
    sheet.mergeCells(1, 1, 1, headers.length)
    // Apply style to all cells in merged range to ensure background color shows
    for (let c = 1; c <= headers.length; c++) {
      const cell = titleRow.getCell(c)
      cell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      }
    }
    titleRow.height = 28

    const fmt = (d: Date) => `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const sRaw = activeTab === 'orders' ? startDate : returnStartDate
    const eRaw = activeTab === 'orders' ? endDate : returnEndDate
    const today = new Date()
    const startD = sRaw ? new Date(sRaw) : today
    const endD = eRaw ? new Date(eRaw) : startD
    const hasDateRange = Boolean(sRaw || eRaw)
    const rangeHuman = hasDateRange ? `${fmtISODate(startD)} to ${fmtISODate(endD)}` : 'All dates'
    const getWarehouseLabel = (id?: string) => {
      if (!id || id === 'all') return 'All'
      const w = warehouses.find((wh) => (wh._id || wh.id) === id)
      return w?.name || id
    }
    const filtersText = (activeTab === 'orders'
      ? [
          (warehouseId !== 'all' && `Warehouse=${getWarehouseLabel(warehouseId)}`) || '',
          (status !== 'all' && `Status=${status}`) || '',
          (paymentMethod !== 'all' && `Payment=${paymentMethod}`) || '',
        ].filter(Boolean)
      : [
          (returnWarehouseId !== 'all' && `Warehouse=${getWarehouseLabel(returnWarehouseId)}`) || '',
          (returnStatus !== 'all' && `ReturnStatus=${returnStatus}`) || '',
        ].filter(Boolean)
    ).join(' | ') || 'None'

    const meta1 = sheet.addRow([`Date Range: ${rangeHuman}`])
    sheet.mergeCells(2, 1, 2, headers.length)
    meta1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
    const meta2 = sheet.addRow([`Filters: ${filtersText}`])
    sheet.mergeCells(3, 1, 3, headers.length)
    meta2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
    const meta3 = sheet.addRow([`Generated At: ${new Date().toLocaleString()}`])
    sheet.mergeCells(4, 1, 4, headers.length)
    meta3.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }

    sheet.addRow([]) // blank separator

    // Header row starts at 6
    const headerRowIndex = sheet.rowCount + 1
    const headerRow = sheet.addRow(headers)
    headerRow.height = 22
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      }
    })

    // Data rows start after header
    rows.forEach((r) => sheet.addRow(r))

    // Freeze panes below header
    sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }]

    // Style data cells and zebra striping
    const lastColIndex = headers.length
    for (let r = headerRowIndex + 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      const isZebra = (r - headerRowIndex) % 2 === 0
      for (let c = 1; c <= headers.length; c++) {
        const cell = row.getCell(c)
        const sourceRow = rows[r - headerRowIndex - 1] || []
        // Exclude Items column from numeric formatting to avoid decimals
        const numericCols = activeTab === 'orders' ? [10,11,12,13,14,15,17] : [10,11,12,13,14,16]
        const isNumeric = numericCols.includes(c) && typeof sourceRow[c - 1] === 'number'
        // Center align all table cells; keep wrap where needed
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: c === lastColIndex || c === 4 || c === 5 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFF0F0F0' } },
          left: { style: 'thin', color: { argb: 'FFF0F0F0' } },
          bottom: { style: 'thin', color: { argb: 'FFF0F0F0' } },
          right: { style: 'thin', color: { argb: 'FFF0F0F0' } },
        }
        if (isNumeric) cell.numFmt = '#,##0.00'
        // Force Items column to show whole numbers (no decimals)
        const itemsColIndex = activeTab === 'orders' ? 16 : 15
        if (c === itemsColIndex) {
          cell.numFmt = '0'
        }
        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
        }
      }
      // Dynamic row height based on products cell lines (approx)
      const productsText = (rows[r - headerRowIndex - 1] || [])[lastColIndex - 1] as string
      if (productsText) {
        const lines = String(productsText).split('\n').length
        row.height = Math.min(120, Math.max(16, lines * 14))
      }
    }

    // Auto filter
    sheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: sheet.rowCount, column: headers.length }
    }

    // Download
    const range = hasDateRange ? `${fmt(startD)}-${fmt(endD)}` : 'All'
    const prefix = activeTab === 'orders' ? 'Order Report' : 'Return Report'

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prefix} ${range}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeTab, orders, returns, startDate, endDate, returnStartDate, returnEndDate])

  const exportPdf = useCallback(async () => {
    const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' })

    // Common helpers (kept local to avoid side effects)
    const fmtISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const fmtYYMMDD = (d: Date) => `${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const getPinFromObject = (obj: any): string => {
      if (!obj) return ''
      const a = obj?.address || obj
      const direct = (
        a?.pincode || a?.pinCode || a?.postalCode || a?.zip || a?.zipcode || a?.zipCode
      )
      if (direct) return String(direct)
      const candidates: string[] = [a?.area, a?.address, a?.building, a?.landmark, a?.city, a?.state, a?.warehouseAddress]
        .filter(Boolean).map(String)
      const joined = candidates.join(' ')
      const m = joined.match(/\b\d{6}\b/)
      return m ? m[0] : ''
    }
    const getRefundMethod = (ret: any, ord?: any) => {
      const pref = ret?.refundPreference || ret?.refundInfo || ord?.refundPreference || ord?.refundInfo || {}
      const method = (pref?.method || pref?.type || pref?.mode || ret?.refundMethod || '').toString().toLowerCase()
      if (method === 'upi' || pref?.upiId) return pref?.upiId ? `UPI: ${String(pref.upiId)}` : 'UPI'
      if (method === 'bank' || pref?.bankDetails) {
        const bank = pref?.bankDetails || {}
        const mask = (acc: any) => acc ? `XXXX${String(acc).slice(-4)}` : ''
        return ['Bank', bank.bankName || '', mask(bank.accountNumber), bank.ifsc || ''].filter(Boolean).join(' ')
      }
      return 'N/A'
    }

    // Header/metadata
    const isOrders = activeTab === 'orders'
    const brandColor = isOrders ? '#2563EB' : '#DC2626'
    const sRaw = isOrders ? startDate : returnStartDate
    const eRaw = isOrders ? endDate : returnEndDate
    const hasDateRange = Boolean(sRaw || eRaw)
    const today = new Date()
    const startD = sRaw ? new Date(sRaw) : today
    const endD = eRaw ? new Date(eRaw) : startD

    doc.setFontSize(14)
    doc.setTextColor(255,255,255)
    // Colored title band aligned to content width (same margins as table)
    doc.setFillColor(brandColor)
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 30
    const contentWidth = pageWidth - margin * 2
    doc.rect(margin, 28, contentWidth, 24, 'F')
    doc.text(isOrders ? 'Order Report' : 'Return Report', margin + 10, 46)
    doc.setTextColor(0,0,0)

    doc.setFontSize(9)
    const metaY = 70
    doc.text(`Date Range: ${hasDateRange ? `${fmtISODate(startD)} to ${fmtISODate(endD)}` : 'All dates'}`, margin, metaY)
    const getWarehouseLabel = (id?: string) => {
      if (!id || id === 'all') return 'All'
      const w = warehouses.find((wh) => (wh._id || wh.id) === id)
      return w?.name || id
    }
    const filtersText = (isOrders
      ? [
          (warehouseId !== 'all' && `Warehouse=${getWarehouseLabel(warehouseId)}`) || '',
          (status !== 'all' && `Status=${status}`) || '',
          (paymentMethod !== 'all' && `Payment=${paymentMethod}`) || '',
        ].filter(Boolean)
      : [
          (returnWarehouseId !== 'all' && `Warehouse=${getWarehouseLabel(returnWarehouseId)}`) || '',
          (returnStatus !== 'all' && `ReturnStatus=${returnStatus}`) || '',
        ].filter(Boolean)
    ).join(' | ') || 'None'
    doc.text(`Filters: ${filtersText}`, margin, metaY + 18)
    doc.text(`Generated At: ${new Date().toLocaleString()}`, margin, metaY + 36)

    // Build table
    const headers = isOrders
      ? ['Date','InvoiceID','OrderID','Warehouse','Customer','Phone','Delivery PIN','Payment','Status','Subtotal','CGST','SGST','IGST','Discount','Delivery','Items','Total','Products']
      : ['Date','InvoiceID','ReturnID','Warehouse','Customer','Phone','Pickup PIN','Payment Preference','Status','Subtotal','CGST','SGST','IGST','Discount','Items','Refund Amount','Products']

    // Enrich details similar to Excel export to improve PIN/refund preference/discount accuracy
    const orderDetailById = new Map<string, any>()
    const returnListById = new Map<string, any>()
    try {
      if (isOrders) {
        const ids = Array.from(new Set((orders || []).map((o: any) => o?.orderId).filter(Boolean))) as string[]
        if (ids.length && apiBase) {
          const fetched = await Promise.all(ids.map(async (oid) => {
            try {
              const res = await fetch(`${apiBase}/orders/order/${oid}`, { headers: { 'Authorization': `Bearer ${token}` } })
              if (res.ok) {
                const json = await res.json()
                return [oid, json?.order || null] as const
              }
            } catch {}
            return [oid, null] as const
          }))
          fetched.forEach(([oid, ord]) => { if (ord) orderDetailById.set(oid, ord) })
        }
      } else {
        // Returns admin list (for explicit refundPreference)
        if (apiBase) {
          try {
            const resList = await fetch(`${apiBase}/returns/admin/all?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } })
            if (resList.ok) {
              const json = await resList.json().catch(() => ({} as any))
              const list = json?.returns || json?.data || []
              if (Array.isArray(list)) {
                list.forEach((ret: any) => {
                  const key = ret?.returnId || ret?._id
                  if (key) returnListById.set(key, ret)
                })
              }
            }
          } catch {}
        }
        // Related orders for returns rows
        const ids = Array.from(new Set((returns || []).map((r: any) => r?.orderObjectId?.orderId || r?.orderId).filter(Boolean))) as string[]
        if (ids.length && apiBase) {
          const fetched = await Promise.all(ids.map(async (oid) => {
            try {
              const res = await fetch(`${apiBase}/orders/order/${oid}`, { headers: { 'Authorization': `Bearer ${token}` } })
              if (res.ok) {
                const json = await res.json()
                return [oid, json?.order || null] as const
              }
            } catch {}
            return [oid, null] as const
          }))
          fetched.forEach(([oid, ord]) => { if (ord) orderDetailById.set(oid, ord) })
        }
      }
    } catch {}

    const body = (isOrders ? orders : returns).map((obj: any) => {
      if (isOrders) {
        const o = obj
        const created = new Date(o.createdAt)
        const dateStr = fmtISODate(created)
        const subtotal = (typeof o?.pricing?.subtotal === 'number' ? o.pricing.subtotal : (o.items || []).reduce((s: number, it: any) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)) || 0
        const discount = (o?.pricing?.discount ?? o?.pricing?.discountAmount ?? 0) || 0
        const delivery = (o?.pricing?.delivery ?? o?.pricing?.shipping ?? o?.pricing?.deliveryCharge ?? 0) || 0
        const total = (o?.pricing?.total ?? 0) || 0
        const cgst = o?.taxCalculation?.taxBreakdown?.cgst?.amount ?? 0
        const sgst = o?.taxCalculation?.taxBreakdown?.sgst?.amount ?? 0
        const igst = o?.taxCalculation?.taxBreakdown?.igst?.amount ?? 0
        const itemsCount = (o.items?.length || 0)
        const enrichedOrder = orderDetailById.get(o?.orderId) || o
        const deliveryPin = getPinFromObject(enrichedOrder?.deliveryInfo) || getPinFromObject(enrichedOrder?.warehouseInfo) || getPinFromObject(o?.deliveryInfo) || getPinFromObject(o?.warehouseInfo)
        const productsTextRaw = (o.items || []).map((it: any) => {
          const pct = it?.tax?.percentage ?? 0
          const inc = it?.priceIncludesTax ? 'Inc.' : 'Excl.'
          return `${it?.name || ''} - ${pct}%(${inc})`
        }).join('\n')
        return [
          dateStr,
          o.invoiceNumber || '',
          o.orderId || '',
          o.warehouseInfo?.warehouseName || '-',
          o.customerInfo?.name || '-',
          o.customerInfo?.phone || '-',
          deliveryPin,
          (o.paymentInfo?.method || '-').toUpperCase(),
          (o.status || '-').toString(),
          numberFmt.format(subtotal),
          cgst ? numberFmt.format(cgst) : '-',
          sgst ? numberFmt.format(sgst) : '-',
          igst ? numberFmt.format(igst) : '-',
          numberFmt.format(discount),
          numberFmt.format(delivery),
          String(itemsCount),
          numberFmt.format(total),
          productsTextRaw
        ]
      }
      // returns
      const r = obj
      const order = orderDetailById.get(r?.orderObjectId?.orderId || r?.orderId) || r.orderObjectId
      const customerState = order?.deliveryInfo?.address?.state || ''
      const warehouseState = order?.warehouseInfo?.warehouseId?.address ? extractStateFromAddress(order.warehouseInfo.warehouseId.address) : (order?.warehouseInfo?.warehouseId?.state || '')
      const isInterstate = !!(customerState && warehouseState && customerState.toLowerCase().trim() !== warehouseState.toLowerCase().trim()) || order?.taxCalculation?.isInterState === true
      let cgst = 0, sgst = 0, igst = 0, taxSubtotal = 0, totalTax = 0, finalTotal = 0
        if (r.items && r.items.length > 0) {
          const itemsForTax: ProductTaxInfo[] = r.items.map((item: any) => ({
            price: item.price,
            priceIncludesTax: item.priceIncludesTax || false,
          tax: item.tax ? { id: item.tax._id, name: item.tax.name, percentage: item.tax.percentage, description: item.tax.description } : null,
            quantity: item.quantity
        }))
        const taxCalculation = calculateCartTax(itemsForTax, isInterstate, warehouseState, customerState)
        cgst = taxCalculation.totalCGST
        sgst = taxCalculation.totalSGST
        igst = taxCalculation.totalIGST
        taxSubtotal = taxCalculation.subtotal
        totalTax = taxCalculation.totalTax
        finalTotal = taxCalculation.finalTotal
      }
        const created = new Date(r.createdAt)
      const dateStr = fmtISODate(created)
      const subtotal = taxSubtotal
      const orderForDiscount = order
      let totalDiscountFromOrder = (
        orderForDiscount?.promoCode?.discountAmount ??
        orderForDiscount?.promoCode?.discount ??
        orderForDiscount?.pricing?.discountAmount ??
        orderForDiscount?.pricing?.discountTotal ??
        orderForDiscount?.pricing?.discount ??
        orderForDiscount?.orderSummary?.totalDiscount ??
        orderForDiscount?.appliedPromocode?.discountValue ??
        orderForDiscount?.coupon?.discountAmount ??
        orderForDiscount?.discount ??
        0
      ) as number
      if (!totalDiscountFromOrder) {
        const delivery = (orderForDiscount?.pricing?.delivery ?? orderForDiscount?.pricing?.shipping ?? orderForDiscount?.pricing?.deliveryCharge ?? 0) || 0
        const ocgst = orderForDiscount?.taxCalculation?.taxBreakdown?.cgst?.amount ?? 0
        const osgst = orderForDiscount?.taxCalculation?.taxBreakdown?.sgst?.amount ?? 0
        const oigst = orderForDiscount?.taxCalculation?.taxBreakdown?.igst?.amount ?? 0
        const ototal = (orderForDiscount?.pricing?.total ?? 0) || 0
        const osub = (orderForDiscount?.pricing?.subtotal ?? 0) || 0
        const derived = osub + delivery + ocgst + osgst + oigst - ototal
        totalDiscountFromOrder = derived > 0 ? derived : 0
      }
      const denom = taxSubtotal + totalTax
      const discount = denom > 0 ? finalTotal * ((totalDiscountFromOrder || 0) / denom) : 0
      const total = (typeof r.refundedAmount === 'number' ? r.refundedAmount : Math.max(0, finalTotal - discount))
        const itemsCount = r.items?.length || 0
      const explicitPref = returnListById.get(r?.returnId || r?._id)?.refundPreference
      const refundMethod = getRefundMethod({ ...r, refundPreference: explicitPref }, order)
      const pickupPin = getPinFromObject(r?.pickupInfo) || getPinFromObject(order?.deliveryInfo)
        const productsTextRaw = (r.items || []).map((it: any) => {
          const pct = it?.tax?.percentage ?? 0
          const inc = it?.priceIncludesTax ? 'Inc.' : 'Excl.'
          return `${it?.name || ''} - ${pct}%(${inc})`
      }).join('\n')
      return [
          dateStr,
          r.orderObjectId?.invoiceNumber || r.orderObjectId?.orderId || r.orderId || '-',
          r.returnId || r._id || '-',
          r.warehouseInfo?.warehouseName || '-',
          r.customerInfo?.name || '-',
          r.customerInfo?.phone || '-',
        pickupPin,
          refundMethod,
          r.status.replace('_', ' '),
        numberFmt.format(subtotal),
        numberFmt.format(cgst),
        numberFmt.format(sgst),
        numberFmt.format(igst),
        numberFmt.format(discount),
          String(itemsCount),
        numberFmt.format(total),
        productsTextRaw
      ]
    })

    // Let autotable calculate widths to perfectly fill the available content width
    // while we just specify alignment for text-heavy columns
    const columnStyles: Record<number, any> = {}
    columnStyles[3] = { halign: 'left' }
    columnStyles[4] = { halign: 'left' }
    columnStyles[headers.length - 1] = { halign: 'left' }

    // Compute startY just below metadata to avoid overlap and keep consistent alignment
    const tableStartY = metaY + 50
    autoTable(doc, {
      head: [headers],
      body,
      startY: tableStartY,
      styles: { fontSize: 6, cellPadding: 2, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: isOrders ? [37, 99, 235] : [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles,
      bodyStyles: { lineColor: [240,240,240], lineWidth: 0.5 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      tableWidth: 'auto',
      margin: { left: margin, right: margin },
    })

    // Filename like Excel
    const rangeLabel = hasDateRange ? `${fmtYYMMDD(startD)}-${fmtYYMMDD(endD)}` : 'All'
    const prefix = isOrders ? 'Order Report' : 'Return Report'
    doc.save(`${prefix} ${rangeLabel}.pdf`)
  }, [activeTab, orders, returns, startDate, endDate, returnStartDate, returnEndDate, warehouses, warehouseId, status, paymentMethod, returnWarehouseId, returnStatus, numberFmt, summary, returnSummary])

  // Lightweight inline SVG Pie Chart with hover tooltip
  const PieChart: React.FC<{ data: Array<{ name: string; value: number }>; size?: number }> = ({ data, size = 200 }) => {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null)
    const total = Math.max(1, data.reduce((s, d) => s + (Number(d.value) || 0), 0))
    const radius = size / 2 - 6
    const cx = size / 2
    const cy = size / 2
    // pleasant color palette
    const colors = [
      '#22c55e', // green-500
      '#3b82f6', // blue-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#a855f7', // purple-500
      '#06b6d4', // cyan-500
      '#84cc16', // lime-500
      '#f97316', // orange-500
    ]
    let startAngle = -90 // start at top
    const arcs = data.map((d, i) => {
      const slice = (Number(d.value) || 0) / total
      const endAngle = startAngle + slice * 360
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
      const toRad = (deg: number) => (deg * Math.PI) / 180
      const x1 = cx + radius * Math.cos(toRad(startAngle))
      const y1 = cy + radius * Math.sin(toRad(startAngle))
      const x2 = cx + radius * Math.cos(toRad(endAngle))
      const y2 = cy + radius * Math.sin(toRad(endAngle))
      const dPath = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
      const fill = colors[i % colors.length]
      const idx = i
      startAngle = endAngle
      return { dPath, fill, idx }
    })
    const tooltip = hoverIdx !== null ? data[hoverIdx] : null
    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((a) => (
            <path
              key={a.idx}
              d={a.dPath}
              fill={a.fill}
              className="cursor-pointer transition-opacity"
              opacity={hoverIdx === null || hoverIdx === a.idx ? 1 : 0.5}
              onMouseEnter={() => setHoverIdx(a.idx)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
          {/* white inner circle to make it a donut */}
          <circle cx={cx} cy={cy} r={radius * 0.5} fill="#ffffff" />
        </svg>
        {tooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 px-2 py-1 text-xs rounded bg-black text-white shadow">
            {tooltip.name}
          </div>
        )}
      </div>
    )
  }

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
            <button onClick={exportTally} className="bg-white border hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">Export Tally XML</button>
            <button onClick={exportXlsx} className="bg-brand-primary text-white hover:bg-brand-primary-dark px-4 py-2 rounded-lg transition-colors">Export Excel</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Orders
                </div>
              </button>
              <button
                onClick={() => setActiveTab('returns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'returns'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Returns
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-codGray">Filters</h3>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
          
          {activeTab === 'orders' ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Date Range</label>
                <DateRangePicker
                  startDate={returnRangeStart}
                  endDate={returnRangeEnd}
                  onDateRangeChange={(s, e) => {
                    setReturnRangeStart(s)
                    setReturnRangeEnd(e)
                    const toStr = (d: Date | null) => (d ? formatDate(d, 'yyyy-MM-dd') : '')
                    setReturnStartDate(toStr(s))
                    setReturnEndDate(toStr(e))
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Warehouse</label>
                <select value={returnWarehouseId} onChange={(e) => setReturnWarehouseId(e.target.value)} className="w-full border rounded px-3 h-10 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary">
                  <option value="all">All</option>
                  {warehouses.map((w) => (
                    <option key={w._id || w.id} value={(w._id || w.id)}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Return Status</label>
                <select value={returnStatus} onChange={(e) => setReturnStatus(e.target.value)} className="w-full border rounded px-3 h-10 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary">
                  <option value="all">All</option>
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="pickup_assigned">Pickup Assigned</option>
                  <option value="pickup_rejected">Pickup Rejected</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="received">Received</option>
                  <option value="partially_refunded">Partially Refunded</option>
                  <option value="refunded">Refunded</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setReturnRangeStart(null); setReturnRangeEnd(null); setReturnStartDate(''); setReturnEndDate(''); setReturnWarehouseId('all'); setReturnStatus('all'); setReturnPage(1); }} className="px-3 h-10 rounded-lg border border-brand-primary text-brand-primary bg-white hover:bg-brand-primary hover:text-white transition-colors text-sm">Reset</button>
                <button onClick={() => { fetchReturnSummary(); fetchReturns(); }} className="px-3 h-10 rounded-lg bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors text-sm">Refresh</button>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeTab === 'orders' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Return Value</p>
                    <p className="text-2xl font-bold text-codGray">₹{numberFmt.format(returnSummary.cards?.totalReturnValue || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Returns</p>
                    <p className="text-2xl font-bold text-codGray">{numberFmt.format(returnSummary.cards?.totalReturns || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <RotateCcw className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Return Value</p>
                    <p className="text-2xl font-bold text-codGray">
                      ₹{numberFmt.format(returnSummary.cards?.avgReturnValue || 0)}
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
                    <p className="text-sm font-medium text-gray-600">Pending Returns</p>
                    <p className="text-2xl font-bold text-codGray">{numberFmt.format(returnSummary.cards?.pendingReturns || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts and Top Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-codGray">{activeTab === 'orders' ? 'Sales Overview' : 'Returns Overview'}</h3>
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
              {activeTab === 'orders' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="h-64 bg-gray-50 rounded-lg p-4 overflow-auto border">
                    <div className="text-sm font-medium text-gray-700">Return Value ({returnSummary.interval.charAt(0).toUpperCase() + returnSummary.interval.slice(1) || interval})</div>
                    <div className="mt-2 text-xs text-gray-800 space-y-1 max-h-56 overflow-auto">
                      {returnSummary.returnsByDay?.map((d: any) => (
                        <div key={d._id} className="flex justify-between">
                          <span>{d._id}</span>
                          <span>₹{numberFmt.format(d.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-64 bg-gray-50 rounded-lg p-4 overflow-auto border">
                    <div className="text-sm font-medium text-gray-700">Returns ({returnSummary.interval.charAt(0).toUpperCase() + returnSummary.interval.slice(1) || interval})</div>
                    <div className="mt-2 text-xs text-gray-800 space-y-1 max-h-56 overflow-auto">
                      {returnSummary.returnsByDay?.map((d: any) => (
                        <div key={d._id} className="flex justify-between">
                          <span>{d._id}</span>
                          <span>{numberFmt.format(d.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-codGray">{activeTab === 'orders' ? 'Top Categories' : 'Top Return Categories'}</h3>
            </div>
            <div className="mb-4 h-60 flex items-center justify-center">
              <PieChart
                size={250}
                data={(
                  activeTab === 'orders' ? (summary.topCategories || []) : (returnSummary.topReturnCategories || [])
                ).map((c: any) => ({ name: c.name || 'Category', value: Number(c.revenue) || 0 }))}
              />
            </div>
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-codGray">{activeTab === 'orders' ? 'Orders' : 'Returns'}</h3>
            <span className="text-sm text-gray-500">{numberFmt.format(activeTab === 'orders' ? totalOrders : totalReturns)} results</span>
          </div>
          <div className="overflow-x-auto rounded border">
            {activeTab === 'orders' ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200 text-gray-700">
                    <th className="text-left py-2 px-3">Invoice ID</th>
                    <th className="text-left py-2 px-3">Customer</th>
                    <th className="text-center py-2 px-3">Items</th>
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
                          <div className="text-[11px] text-gray-500">{o.orderId}</div>
                          <div className="text-[11px] text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-xs font-medium text-codGray truncate" title={o.customerInfo?.name}>{o.customerInfo?.name || '-'}</div>
                          <div className="text-[11px] text-gray-500 truncate" title={o.customerInfo?.email}>{o.customerInfo?.email || '-'}</div>
                          <div className="text-[11px] text-gray-500 truncate" title={o.customerInfo?.phone}>{o.customerInfo?.phone || '-'}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-codGray">{o.items?.length || 0}</p>
                            <p className="text-xs text-gray-500">Item{(o.items?.length || 0) !== 1 ? 's' : ''}</p>
                          </div>
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
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200 text-gray-700">
                    <th className="text-left py-2 px-3">Invoice ID</th>
                    <th className="text-left py-2 px-3">Customer</th>
                    <th className="text-center py-2 px-3">Items</th>
                    <th className="text-center py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Warehouse</th>
                    <th className="text-center py-2 px-3">CGST</th>
                    <th className="text-center py-2 px-3">SGST</th>
                    <th className="text-center py-2 px-3">IGST</th>
                    <th className="text-center py-2 px-3">Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((r) => {
                    // Determine if order is interstate or intrastate (same logic as ReturnDetailsModal)
                    const order = r.orderObjectId
                    
                    // Get customer and warehouse states for interstate determination
                    const customerState = order?.deliveryInfo?.address?.state || '';
                    const warehouseState = order?.warehouseInfo?.warehouseId?.address ? 
                      extractStateFromAddress(order.warehouseInfo.warehouseId.address) : 
                      (order?.warehouseInfo?.warehouseId?.state || '');
                    
                    // Determine if this is interstate delivery
                    // Also check if the order details already have interstate information
                    const isInterstate = !!(customerState && warehouseState &&
                      customerState.toLowerCase().trim() !== warehouseState.toLowerCase().trim()) ||
                      order?.taxCalculation?.isInterState === true;
                    
                    // Calculate tax amounts using the same logic as ReturnDetailsModal
                    let cgst = 0;
                    let sgst = 0;
                    let igst = 0;
                    
                    if (r.items && r.items.length > 0) {
                      // Prepare items for tax calculation (same as ReturnDetailsModal)
                      const itemsForTax: ProductTaxInfo[] = r.items.map((item: any) => ({
                        price: item.price,
                        priceIncludesTax: item.priceIncludesTax || false,
                        tax: item.tax ? {
                          id: item.tax._id,
                          name: item.tax.name,
                          percentage: item.tax.percentage,
                          description: item.tax.description
                        } : null,
                        quantity: item.quantity
                      }));
                      
                      // Calculate tax using the proper tax calculation logic
                      const taxCalculation = calculateCartTax(itemsForTax, isInterstate, warehouseState, customerState);
                      
                      cgst = taxCalculation.totalCGST;
                      sgst = taxCalculation.totalSGST;
                      igst = taxCalculation.totalIGST;
                    }

                    return (
                      <tr key={r.returnId || r._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <div className="text-xs font-semibold text-codGray">{r.orderObjectId?.invoiceNumber || r.orderObjectId?.orderId || r.orderId || '-'}</div>
                          <div className="text-[10px] text-gray-500">{r.returnId || r._id}</div>
                          <div className="text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-xs font-medium text-codGray truncate" title={r.customerInfo?.name}>{r.customerInfo?.name || '-'}</div>
                          <div className="text-[11px] text-gray-500 truncate" title={r.customerInfo?.email}>{r.customerInfo?.email || '-'}</div>
                          <div className="text-[11px] text-gray-500 truncate" title={r.customerInfo?.phone}>{r.customerInfo?.phone || '-'}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-codGray">{r.items?.length || 0}</p>
                            <p className="text-xs text-gray-500">Item{(r.items?.length || 0) !== 1 ? 's' : ''}</p>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border capitalize ${
                            r.status === 'requested' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            r.status === 'pickup_assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            r.status === 'pickup_rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            r.status === 'picked_up' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            r.status === 'received' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            r.status === 'partially_refunded' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            r.status === 'refunded' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                            r.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3">{r.warehouseInfo?.warehouseName || '-'}</td>
                        <td className="py-2 px-3 text-center">{cgst > 0 ? `₹${numberFmt.format(cgst)}` : '-'}</td>
                        <td className="py-2 px-3 text-center">{sgst > 0 ? `₹${numberFmt.format(sgst)}` : '-'}</td>
                        <td className="py-2 px-3 text-center">{igst > 0 ? `₹${numberFmt.format(igst)}` : '-'}</td>
                        <td className="py-2 px-3 text-center">₹{numberFmt.format(r.refundedAmount || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {(activeTab === 'orders' ? totalOrders : totalReturns) > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <p className="text-sm text-gray-600">
                Showing {((activeTab === 'orders' ? page : returnPage) - 1) * ORDERS_PER_PAGE + 1} to {Math.min((activeTab === 'orders' ? page : returnPage) * ORDERS_PER_PAGE, activeTab === 'orders' ? totalOrders : totalReturns)} of {numberFmt.format(activeTab === 'orders' ? totalOrders : totalReturns)} {activeTab}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => activeTab === 'orders' ? setPage((p) => Math.max(1, p - 1)) : setReturnPage((p) => Math.max(1, p - 1))}
                  disabled={activeTab === 'orders' ? page === 1 : returnPage === 1}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">Page {activeTab === 'orders' ? page : returnPage} of {Math.max(1, Math.ceil((activeTab === 'orders' ? totalOrders : totalReturns) / ORDERS_PER_PAGE))}</span>
                <button
                  className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => activeTab === 'orders' ? setPage((p) => Math.min(Math.ceil(totalOrders / ORDERS_PER_PAGE), p + 1)) : setReturnPage((p) => Math.min(Math.ceil(totalReturns / ORDERS_PER_PAGE), p + 1))}
                  disabled={activeTab === 'orders' ? page >= Math.ceil(totalOrders / ORDERS_PER_PAGE) : returnPage >= Math.ceil(totalReturns / ORDERS_PER_PAGE)}
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
