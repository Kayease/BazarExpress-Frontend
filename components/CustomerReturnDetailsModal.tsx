"use client";

import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import { X, Package, Calendar, MapPin, Phone, RefreshCw, CheckCircle, XCircle, Truck, UserCheck, CreditCard } from "lucide-react";

interface ReturnItem {
  _id?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string;
  variantId?: string;
  selectedVariant?: any;
}

interface ReturnRequest {
  _id: string;
  returnId: string;
  orderId: string;
  customerInfo: { name: string; email?: string; phone?: string };
  pickupInfo: { address: any; pickupInstructions?: string };
  items: ReturnItem[];
  status: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{ status: string; timestamp: any; updatedBy?: any; note?: string }>;
  refundPreference?: { method?: 'upi' | 'bank'; upiId?: string; bankDetails?: { accountHolderName?: string; accountNumber?: string; ifsc?: string; bankName?: string } };
}

interface CustomerReturnDetailsModalProps {
  open: boolean;
  onClose: () => void;
  data: ReturnRequest;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  requested: { label: 'Return Requested', color: 'text-blue-600', bg: 'bg-blue-100', icon: Calendar },
  approved: { label: 'Return Approved', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
  pickup_assigned: { label: 'Pickup Scheduled', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: UserCheck },
  pickup_rejected: { label: 'Pick-up Rejected', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  picked_up: { label: 'Return Picked Up', color: 'text-violet-600', bg: 'bg-violet-100', icon: Truck },
  received: { label: 'Return Received', color: 'text-amber-700', bg: 'bg-amber-100', icon: Package },
  partially_refunded: { label: 'Partially Refunded', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: RefreshCw },
  refunded: { label: 'Refunded', color: 'text-green-700', bg: 'bg-green-100', icon: CreditCard },
  rejected: { label: 'Return Rejected', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

function normalizeTimestamp(ts: any, fallback: string): Date {
  try {
    if (!ts) return new Date(fallback);
    if (typeof ts === 'string') return new Date(ts);
    if (ts instanceof Date) return ts as Date;
    if (typeof ts === 'object' && ts.$date) return new Date(ts.$date);
    return new Date(fallback);
  } catch {
    return new Date(fallback);
  }
}

function formatDateTime(ts: any, fallback: string) {
  const d = normalizeTimestamp(ts, fallback);
  return `${d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function CustomerReturnDetailsModal({ open, onClose, data }: CustomerReturnDetailsModalProps) {
  const timeline = useMemo(() => {
    const hist = Array.isArray(data.statusHistory) ? data.statusHistory : [];
    const sorted = [...hist].sort((a, b) => normalizeTimestamp(a.timestamp, data.createdAt).getTime() - normalizeTimestamp(b.timestamp, data.createdAt).getTime());
    const collapsed: typeof sorted = [];
    for (const entry of sorted) {
      const last = collapsed[collapsed.length - 1];
      if (!last || last.status !== entry.status) collapsed.push(entry); else collapsed[collapsed.length - 1] = entry;
    }
    return collapsed;
  }, [data.statusHistory, data.createdAt]);

  if (!open || !data) return null;

  const StatusIcon = (statusConfig[data.status]?.icon) || RefreshCw;

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prevPosition = style.position;
    const prevTop = style.top;
    const prevWidth = style.width;
    const prevOverflow = style.overflow;
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';
    style.overflow = 'hidden';
    return () => {
      style.position = prevPosition;
      style.top = prevTop;
      style.width = prevWidth;
      style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[1000]">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Return Details</h3>
              <p className="text-white/80">#{data.returnId} • Order {data.orderId}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Top summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <StatusIcon className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Return Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig[data.status]?.bg || 'bg-gray-100'} ${statusConfig[data.status]?.color || 'text-gray-800'}`}>
                {statusConfig[data.status]?.label || data.status}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Created</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{new Date(data.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Refund Method</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{data.refundPreference?.method ? (data.refundPreference.method === 'upi' ? 'UPI' : 'Bank Transfer') : 'Not provided'}</p>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold text-gray-900">Pickup Address</h4>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium">{data.pickupInfo?.address?.name}, {data.pickupInfo?.address?.building}, {data.pickupInfo?.address?.area}</p>
              {data.pickupInfo?.address?.phone && (
                <p className="text-gray-600 inline-flex items-center"><Phone className="w-4 h-4 mr-1" />{data.pickupInfo.address.phone}</p>
              )}
              {data.pickupInfo?.pickupInstructions && (
                <p className="text-gray-500">Instructions: {data.pickupInfo.pickupInstructions}</p>
              )}
            </div>
          </div>

          {/* Return Timeline (after address) */}
          {timeline.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <RefreshCw className="w-5 h-5 text-brand-primary" />
                <h4 className="font-semibold text-gray-900">Return Timeline</h4>
              </div>
              <div className="space-y-4">
                {timeline.map((entry, idx) => {
                  const Icon = (statusConfig[entry.status]?.icon) || Package;
                  return (
                    <div key={`${entry.status}-${idx}`} className="flex items-start">
                      <div className="relative mr-4">
                        <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        {idx !== timeline.length - 1 && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-6 w-[2px] h-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${statusConfig[entry.status]?.color || 'text-gray-800'}`}>{statusConfig[entry.status]?.label || entry.status}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(entry.timestamp, data.createdAt)}</div>
                        {entry.note && <div className="text-xs text-gray-600 mt-1">Note: {entry.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Package className="w-5 h-5 text-brand-primary mr-2" />
              Return Items ({data.items.length})
            </h4>
            <div className="space-y-3 max-h-[40vh] sm:max-h-none overflow-y-auto">
              {data.items.map((item) => (
                <div key={item._id || item.name} className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 ml-4">
                    <h5 className="font-medium text-gray-900 mb-2">{item.name}</h5>
                    
                    {/* Enhanced Variant Display */}
                    {(() => {
                      // Extract variant name with fallback logic
                      let variantName = item.variantName;
                      
                      if (!variantName && item.selectedVariant) {
                        if (typeof item.selectedVariant === 'object' && item.selectedVariant !== null) {
                          variantName = item.selectedVariant.name || item.selectedVariant.variantName || item.selectedVariant.displayName || item.selectedVariant.sku;
                        } else if (typeof item.selectedVariant === 'string') {
                          variantName = item.selectedVariant;
                        }
                      }
                      
                      return variantName ? (
                        <div className="mb-2">
                          <div className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-full shadow-sm">
                            {variantName}
                          </div>
                        </div>
                      ) : null
                    })()}
                    
                    <div className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price} = ₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


