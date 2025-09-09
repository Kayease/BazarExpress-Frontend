"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { X, Package, MapPin, CreditCard, Calendar, Truck, CheckCircle, Download } from 'lucide-react';
import InvoiceModal from './InvoiceModal';
import { useAppSelector } from "../lib/store";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  mrp?: number;
  quantity: number;
  image?: string;
  category?: string;
  brand?: string;
  categoryId?: string | { _id: string; name: string };
  brandId?: string | { _id: string; name: string };
  priceIncludesTax?: boolean;
  tax?: {
    _id?: string;
    id?: string;
    name: string;
    percentage: number;
    description?: string;
  };
  taxRate?: number;
  taxAmount?: number;
  hsnCode?: string;
  hsn?: string;
  variantId?: string;
  variantName?: string;
  selectedVariant?: any;
  refundStatus?: string;
  refundedAt?: string;
}

interface Order {
  _id: string;
  orderId: string;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  createdAt: string;
  pricing: {
    total: number;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    deliveryCharge: number;
    codCharge: number;
  };
  items: OrderItem[];
  promoCode?: {
    code: string;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
    discountValue?: number;
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryInfo: {
    address: {
      building: string;
      area: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
      landmark?: string;
      name: string;
    };
    estimatedDelivery?: string;
  };
  paymentInfo: {
    method: string;
    status: string;
    transactionId?: string;
    razorpay_payment_id?: string;
  };
  warehouseInfo?: {
    _id: string;
    name: string;
    address: string;
    state: string;
  };
  taxCalculation?: {
    isInterState: boolean;
    totalTax: number;
    subtotal: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    taxBreakdown: {
      cgst: { percentage: number };
      sgst: { percentage: number };
      igst: { percentage: number };
    };
  };
  statusHistory?: Array<{
    status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    timestamp: string | Date | { $date?: string };
    updatedBy?: string | { $oid?: string };
    note?: string;
    _id?: string | { $oid?: string };
  }>;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'shipped':
      return 'bg-blue-100 text-blue-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="w-4 h-4" />;
    case 'shipped':
      return <Truck className="w-4 h-4" />;
    case 'processing':
      return <Package className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

export default function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrderData, setInvoiceOrderData] = useState<any>(null);
  const token = useAppSelector((state) => state.auth.token);

  // Existing returns mapped by orderItemId for this order
  const [existingReturnsByOrderItem, setExistingReturnsByOrderItem] = useState<Record<string, { status: string; returnId: string }>>({});

  // Friendly status mapping (same semantics as ReturnItemsModal)
  const getReturnBadgeProps = (status?: string): { label: string; className: string } => {
    const key = (status || '').toLowerCase();
    switch (key) {
      case 'requested':
        return { label: 'Return Requested', className: 'bg-blue-600 text-white' };
      case 'approved':
        return { label: 'Return Approved', className: 'bg-emerald-600 text-white' };
      case 'rejected':
        return { label: 'Return Rejected', className: 'bg-red-600 text-white' };
      case 'pickup_assigned':
        return { label: 'Pickup Scheduled', className: 'bg-indigo-600 text-white' };
      case 'pickup_rejected':
        return { label: 'Pick-up Rejected', className: 'bg-red-600 text-white' };
      case 'picked_up':
        return { label: 'Return Picked Up', className: 'bg-violet-600 text-white' };
      case 'received':
        return { label: 'Return Received', className: 'bg-amber-600 text-white' };
      case 'partially_refunded':
        return { label: 'Partially Refunded', className: 'bg-yellow-600 text-white' };
      case 'refunded':
        return { label: 'Refunded', className: 'bg-green-600 text-white' };
      default:
        return { label: 'Return In Progress', className: 'bg-gray-700 text-white' };
    }
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // Fetch user's returns for this order to gray out items already in a return flow
  useEffect(() => {
    if (!isOpen || !order || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/user?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        const returns: any[] = data.returns || [];
        // Only consider returns for this order
        const relevant = returns.filter((r: any) => r.orderId === order.orderId);
        const validOrderItemIds = new Set<string>((order.items || []).map((it: any) => String((it as any)._id || (it as any).id)));
        const map: Record<string, { status: string; returnId: string }> = {};
        relevant.forEach((r: any) => {
          const topStatus = r.status;
          (r.items || []).forEach((it: any) => {
            const rawId = it.orderItemId || it.orderItemID || it.itemId || it._id;
            const orderItemId = rawId ? String(rawId) : '';
            if (orderItemId && validOrderItemIds.has(orderItemId)) {
              // Prefer overall return status to reflect most recent progression
              map[orderItemId] = { status: (topStatus || it.returnStatus || 'requested'), returnId: r.returnId || r._id };
            }
          });
        });
        if (!cancelled) setExistingReturnsByOrderItem(map);
      } catch (e) {
        // ignore errors; UI simply won't gray items
        if (!cancelled) setExistingReturnsByOrderItem({});
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, order, token]);

  if (!isOpen || !order) return null;

  // Handle download invoice
  const handleDownloadInvoice = () => {
    const invoiceData = {
      orderId: order.orderId,
      orderDate: order.createdAt,
      customerInfo: order.customerInfo,
      deliveryAddress: order.deliveryInfo.address,
      items: order.items.map(item => ({
        name: item.name,
        price: item.price,
        mrp: item.mrp,
        quantity: item.quantity,
        priceIncludesTax: item.priceIncludesTax || false,
        tax: item.tax || {
          name: 'GST',
          percentage: item.taxRate || 18,
          description: 'Goods and Services Tax'
        },
        taxRate: item.taxRate || item.tax?.percentage || 18,
        taxAmount: item.taxAmount,
        hsnCode: item.hsnCode || item.hsn || '-',
        variantId: item.variantId,
        variantName: item.variantName,
        selectedVariant: item.selectedVariant
      })),
      pricing: order.pricing,
      taxCalculation: order.taxCalculation,
      warehouseInfo: order.warehouseInfo,
      promoCode: order.promoCode
    };
    
    // Always use the InvoiceModal for consistent behavior across all devices
    setInvoiceOrderData(invoiceData);
    setShowInvoiceModal(true);
  };

  // Helpers for timeline
  const normalizeTimestamp = (ts: any): Date => {
    try {
      if (!ts) return new Date(order.createdAt);
      if (typeof ts === 'string') return new Date(ts);
      if (ts instanceof Date) return ts;
      if (typeof ts === 'object' && ts.$date) return new Date(ts.$date);
      return new Date(order.createdAt);
    } catch {
      return new Date(order.createdAt);
    }
  };

  const formatDateTime = (ts: any) => {
    const d = normalizeTimestamp(ts);
    return `${d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'processing':
        return <Package className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-700';
      case 'shipped':
        return 'text-blue-700';
      case 'processing':
        return 'text-yellow-700';
      case 'cancelled':
        return 'text-red-700';
      case 'refunded':
        return 'text-purple-700';
      default:
        return 'text-gray-700';
    }
  };

  // Build a deduplicated, chronological timeline (collapse consecutive duplicate statuses)
  const timelineEntries = (() => {
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const sorted = [...history].sort(
      (a, b) => normalizeTimestamp(a.timestamp).getTime() - normalizeTimestamp(b.timestamp).getTime()
    );
    const collapsed: typeof sorted = [];
    for (const entry of sorted) {
      const last = collapsed[collapsed.length - 1];
      if (!last || last.status !== entry.status) {
        collapsed.push(entry);
      } else {
        // If same as previous, keep the latest timestamp/note by replacing the last one
        collapsed[collapsed.length - 1] = entry;
      }
    }
    return collapsed;
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Order Details</h3>
              <p className="text-white/80 text-sm sm:text-base">#{order.orderId}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Invoice</span>
                <span className="sm:hidden">Download</span>
              </button>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
          {/* Order Status and Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-gray-50 rounded-xl p-2 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <span className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-2 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-600">Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-2 sm:p-4 col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-600">Payment</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {order.paymentInfo.method === 'cod' ? 'COD' : 'Online'}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 rounded-xl p-2 sm:p-4">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Delivery Address</h4>
            </div>
            <div className="text-xs sm:text-sm text-gray-700 space-y-1">
              <p className="font-medium">{order.deliveryInfo.address.name}</p>
              <p>{order.deliveryInfo.address.building}</p>
              <p>{order.deliveryInfo.address.area}</p>
              <p>{order.deliveryInfo.address.city}, {order.deliveryInfo.address.state} - {order.deliveryInfo.address.pincode}</p>
              {order.deliveryInfo.address.landmark && (
                <p className="text-gray-500">Near {order.deliveryInfo.address.landmark}</p>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          {timelineEntries.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-2 sm:p-4">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Order Timeline</h4>
              </div>
              <div className="relative">
                <div className="space-y-4">
                  {timelineEntries.map((entry, idx) => {
                      const isLast = idx === timelineEntries.length - 1;
                      return (
                        <div key={(typeof entry._id === 'object' && entry._id?.$oid) || (entry._id as string) || `${entry.status}-${idx}`} className="flex items-start">
                          <div className="relative mr-3 sm:mr-4">
                            <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                              {getTimelineIcon(entry.status)}
                            </div>
                            {!isLast && (
                              <div className="absolute left-1/2 -translate-x-1/2 top-6 w-[2px] h-full bg-gray-200" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs sm:text-sm font-semibold ${getStatusTextColor(entry.status)}`}>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </div>
                            <div className="text-[11px] sm:text-xs text-gray-500">
                              {formatDateTime(entry.timestamp)}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-4 flex items-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-brand-primary" />
              Items ({order.items.length})
            </h4>
            <div className="space-y-2 sm:space-y-3 max-h-[40vh] sm:max-h-none overflow-y-auto">
              {order.items.map((item, index) => {
                const anyItem: any = item as any;
                const orderItemId = String(anyItem._id || anyItem.id || anyItem.orderItemId || anyItem.orderItemID || anyItem.itemId || '');
                const existing = orderItemId ? existingReturnsByOrderItem[orderItemId] : undefined;
                const isBlocked = Boolean(existing);
                const badge = existing ? getReturnBadgeProps(existing.status) : undefined;
                
                // Debug logging for variant information
                console.log(`OrderDetailModal - Item ${index}:`, {
                  name: item.name,
                  variantName: item.variantName,
                  variantId: item.variantId,
                  selectedVariant: item.selectedVariant
                });
                
                // Extract variant name with fallback logic
                let displayVariantName = item.variantName;
                if (!displayVariantName && item.selectedVariant) {
                  if (typeof item.selectedVariant === 'object' && item.selectedVariant !== null) {
                    displayVariantName = item.selectedVariant.name || item.selectedVariant.variantName || item.selectedVariant.displayName || item.selectedVariant.sku;
                  } else if (typeof item.selectedVariant === 'string') {
                    displayVariantName = item.selectedVariant;
                  }
                }
                
                return (
                <div key={`${item.productId}-${index}`} className={`relative flex items-center p-2.5 sm:p-3 border rounded-lg sm:rounded-xl hover:shadow-sm transition-shadow ${isBlocked ? 'border-dashed border-gray-300 bg-gray-50 opacity-75' : 'border-gray-200'}`}>
                  {/* Product Image */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 ml-2.5 sm:ml-3 min-w-0">
                    <h5 className="font-medium text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 truncate">
                      {item.name}
                    </h5>
                    
                    {/* Enhanced Variant Display */}
                    {displayVariantName && (
                      <div className="mb-2">
                              <div className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-full shadow-sm">
                                {displayVariantName}
                              </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                      <span>Qty: {item.quantity}</span>
                      {item.tax && (
                        <span className="text-brand-primary">
                          Tax: {item.tax.percentage}% 
                          {item.priceIncludesTax ? ' (Incl.)' : ' (Excl.)'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Price Info */}
                  <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                    <div className="text-base sm:text-lg font-bold text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ₹{item.price.toFixed(2)} × {item.quantity}
                    </div>
                    {item.mrp && item.mrp > item.price && (
                      <div className="text-xs text-gray-500 line-through">
                        MRP: ₹{item.mrp.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {isBlocked && badge && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className={`px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-md ${badge.className}`}>{badge.label}</span>
                    </div>
                  )}
                </div>
              );})}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-3 sm:p-6">
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-4 text-sm sm:text-base">Order Summary</h4>
            <div className="space-y-2 sm:space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">₹{order.pricing.subtotal.toFixed(2)}</span>
              </div>
              
              {/* Discount Applied */}
              {order.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600 font-medium">-₹{order.pricing.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {/* Tax Amount */}
              {order.pricing.taxAmount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">₹{order.pricing.taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              {/* Delivery Charges */}
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className={`font-medium ${order.pricing.deliveryCharge === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {order.pricing.deliveryCharge === 0 ? 'FREE' : `₹${order.pricing.deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              
              {/* COD Charges */}
              {order.pricing.codCharge > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">COD Charges</span>
                  <span className="text-gray-900 font-medium">₹{order.pricing.codCharge.toFixed(2)}</span>
                </div>
              )}
              
              {/* Total */}
              <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
                <div className="flex justify-between">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg sm:text-xl font-bold text-brand-primary">₹{order.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invoice Modal */}
      {showInvoiceModal && invoiceOrderData && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setInvoiceOrderData(null);
          }}
          orderData={invoiceOrderData}
        />
      )}
    </div>
  );
}