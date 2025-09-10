"use client"

import { Calendar, MapPin, Phone, Eye, Warehouse as WarehouseIcon, User as UserIcon, CheckCircle, XCircle, RefreshCw, Package } from "lucide-react"

type ReturnCustomer = { name: string; phone: string; email?: string }
type ReturnAddress = { city?: string; lat?: number; lng?: number }

export interface ReturnCardData {
  _id: string
  returnId: string
  orderId: string
  createdAt: string
  status: string
  items: Array<{ _id?: string }>
  customerInfo: ReturnCustomer
  pickupInfo?: { address?: ReturnAddress }
  warehouseInfo?: { warehouseName?: string }
}

export function formatReturnStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'requested':
    case 'approved':
      return { icon: Package, bg: 'bg-blue-100', color: 'text-blue-600' }
    case 'pickup_assigned':
      return { icon: RefreshCw, bg: 'bg-purple-100', color: 'text-purple-600' }
    case 'picked_up':
      return { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' }
    case 'received':
    case 'partially_refunded':
    case 'refunded':
      return { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' }
    case 'pickup_rejected':
    case 'rejected':
      return { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' }
    default:
      return { icon: Package, bg: 'bg-gray-100', color: 'text-gray-600' }
  }
}

export default function ReturnCard({ data, onView }: { data: ReturnCardData; onView: () => void }) {
  const statusInfo = getStatusIcon(data.status)
  const StatusIcon = statusInfo.icon
  const itemsCount = data.items?.length || 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">{data.returnId}</div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            <span>{new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year:'numeric' })}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {formatReturnStatus(data.status)}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div><span className="font-medium text-gray-900">{data.orderId}</span></div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gray-700">
            <UserIcon className="h-3.5 w-3.5" />
            <span className="truncate" title={data.customerInfo?.name}>{data.customerInfo?.name}</span>
          </div>
          {data.customerInfo?.phone && (
            <div className="text-gray-500 truncate" title={data.customerInfo.phone}>{data.customerInfo.phone}</div>
          )}
        </div>
        <div className="space-y-1 text-right">
          {data.warehouseInfo?.warehouseName && (
            <div className="flex items-center justify-end gap-1 text-gray-700">
              <WarehouseIcon className="h-3.5 w-3.5" />
              <span className="truncate" title={data.warehouseInfo.warehouseName}>{data.warehouseInfo.warehouseName}</span>
            </div>
          )}
          {data.pickupInfo?.address?.city && (
            <div className="flex items-center justify-end gap-1 text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{data.pickupInfo.address.city}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>{`${itemsCount} ${itemsCount === 1 ? 'item' : 'items'}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {data.pickupInfo?.address?.lat && data.pickupInfo?.address?.lng && (
            <a
              href={`https://www.google.com/maps?q=${data.pickupInfo.address.lat},${data.pickupInfo.address.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
              title="Open in Maps"
            >
              <MapPin className="h-3.5 w-3.5" />
            </a>
          )}
          {data.customerInfo?.phone && (
            <a
              href={`tel:${data.customerInfo.phone}`}
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
              title="Call Customer"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}


