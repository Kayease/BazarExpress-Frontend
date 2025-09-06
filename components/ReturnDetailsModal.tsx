"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Package, User, Calendar, MapPin, Phone, RefreshCw, CheckCircle, XCircle, Truck, UserCheck, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { calculateCartTax, ProductTaxInfo } from "@/lib/tax-calculation";

type Role = 'admin' | 'order_warehouse_management' | 'delivery_boy' | string;

interface ReturnItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  returnReason: string;
  returnStatus: string;
  refundAmount?: number;
  // Tax information
  priceIncludesTax?: boolean;
  tax?: {
    _id: string;
    name: string;
    percentage: number;
    description?: string;
  };
  // Link to original order item
  orderItemId?: string;
  // Additional fields for refund calculation
  taxableValue?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  grossTotal?: number;
  discountShare?: number;
  deliveryCharge?: number;
  // Variant information
  variantName?: string;
  variantId?: string;
  selectedVariant?: any;
}

interface ReturnRequest {
  _id: string;
  returnId: string;
  orderId: string;
  customerInfo: { name: string; email?: string; phone: string };
  pickupInfo: { address: any; pickupInstructions?: string };
  items: ReturnItem[];
  status: string;
  returnReason: string;
  assignedPickupAgent?: { id: string; name: string; phone: string; assignedAt: string };
  warehouseInfo: { warehouseId: string; warehouseName: string };
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{ status: string; timestamp: string; updatedBy: any; note: string }>;
  refundPreference?: {
    method?: 'upi' | 'bank';
    upiId?: string;
    bankDetails?: { accountHolderName?: string; accountNumber?: string; ifsc?: string; bankName?: string };
  };
  // Amount actually refunded to customer
  refundedAmount?: number;
  // Order summary fields for refund calculation
  orderSummary?: {
    totalTaxableValue: number;
    totalDiscount: number;
    totalTax: number;
    totalDeliveryCharge: number;
    finalAmount: number;
    promoCode?: string;
    discountType?: 'percentage' | 'fixed';
  };
}

interface ReturnDetailsModalProps {
  open: boolean;
  onClose: () => void;
  data: ReturnRequest;
  role: Role;
  onUpdateStatus: (status: string, note?: string, refundedAmount?: number) => Promise<void> | void;
  onAssignPickup?: (agentId: string, note?: string) => Promise<void> | void;
  onPickupAction?: (action: 'reject' | 'picked_up', note?: string) => Promise<void> | void;
  onVerifyPickupOtp?: (otp: string) => Promise<void> | void;
  onGeneratePickupOtp?: (returnId: string) => Promise<void> | void;
  deliveryAgents?: Array<{ _id: string; name: string; phone: string }>;
  // Refund calculation options
  refundOptions?: {
    deliveryRefundable?: boolean;
    currency?: string;
  };
}

interface RefundSummary {
  items_total_gross: number;
  items_discount_total: number;
  delivery_refund: number;
  total_refund: number;
  currency: string;
  item_breakdown: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    taxable_value: number;
    cgst: number;
    sgst: number;
    igst: number;
    gross_total: number;
    discount_share: number;
    delivery_charge: number;
    refundable_amount: number;
  }>;
}

// Helper function to extract state from address
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

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  requested: { label: 'Requested', color: 'text-blue-600', bg: 'bg-blue-100', icon: Calendar },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  pickup_assigned: { label: 'Pickup Assigned', color: 'text-purple-600', bg: 'bg-purple-100', icon: UserCheck },
  pickup_rejected: { label: 'Pickup Rejected', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  picked_up: { label: 'Picked Up', color: 'text-orange-600', bg: 'bg-orange-100', icon: Truck },
  received: { label: 'Received', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Package },
  partially_refunded: { label: 'Partially Refunded', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: RefreshCw },
  refunded: { label: 'Refunded', color: 'text-green-700', bg: 'bg-green-100', icon: RefreshCw },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

function computeAvailableStatuses(current: string, role: Role) {
  const transitions: Record<string, string[]> = {
    requested: ['approved', 'rejected'],
    approved: ['pickup_assigned', 'rejected'],
    pickup_assigned: [],
    pickup_rejected: ['approved', 'pickup_assigned', 'rejected'],
    picked_up: ['received'],
    received: ['partially_refunded', 'refunded'],
    partially_refunded: [], // No status changes allowed from partially_refunded
    refunded: [],
    rejected: [],
  };

  // Admin and warehouse/order manager should be able to move forward, including to picked_up or pickup_rejected from pickup_assigned
  if (role === 'admin' || role === 'order_warehouse_management') {
    if (current === 'pickup_assigned') return ['picked_up', 'pickup_rejected'];
    return transitions[current] || [];
  }

  // Delivery agent: only acts on pickup_assigned → pickup_rejected or picked_up
  if (role === 'delivery_boy') {
    if (current === 'pickup_assigned') return ['pickup_rejected', 'picked_up'];
    return [];
  }

  return transitions[current] || [];
}

// Refund calculation function using proper tax logic
function calculateRefund(
  returnItems: ReturnItem[],
  orderDetails: any,
  options: { deliveryRefundable?: boolean; currency?: string } = {}
): RefundSummary {
  const { deliveryRefundable = false, currency = 'INR' } = options;
  
  if (!returnItems || returnItems.length === 0) {
    return {
      items_total_gross: 0,
      items_discount_total: 0,
      delivery_refund: 0,
      total_refund: 0,
      currency,
      item_breakdown: []
    };
  }

  // Get customer and warehouse states for interstate determination
  const customerState = orderDetails?.shippingAddress?.state || '';
  const warehouseState = orderDetails?.warehouse?.address ? 
    extractStateFromAddress(orderDetails.warehouse.address) : '';
  
  // Determine if this is interstate delivery
  // Also check if the order details already have interstate information
  const isInterState = !!(customerState && warehouseState &&
    customerState.toLowerCase().trim() !== warehouseState.toLowerCase().trim()) ||
    orderDetails?.taxCalculation?.isInterState === true;

  // Prepare items for tax calculation
  // If tax info is not available in return items, try to get it from order details
  const itemsForTax: ProductTaxInfo[] = returnItems.map(item => {
    // First try to get tax info from return item
    let taxInfo = item.tax;
    let priceIncludesTax = item.priceIncludesTax;
    
    // If not available, try to get from order details
    if (!taxInfo && orderDetails?.items) {
      const orderItem = orderDetails.items.find((orderItem: any) => 
        orderItem._id === item.orderItemId || 
        (orderItem.productId === item.productId && orderItem.name === item.name)
      );
      if (orderItem) {
        taxInfo = orderItem.tax;
        priceIncludesTax = orderItem.priceIncludesTax;
      }
    }
    
    return {
      price: item.price,
      priceIncludesTax: priceIncludesTax || false,
      tax: taxInfo ? {
        id: taxInfo._id,
        name: taxInfo.name,
        percentage: taxInfo.percentage,
        description: taxInfo.description
      } : null,
      quantity: item.quantity
    };
  });

  // Calculate tax using the proper tax calculation logic
  // If order details have tax calculation, use that as fallback for interstate determination
  const finalIsInterState = isInterState || orderDetails?.taxCalculation?.isInterState === true;
  const taxCalculation = calculateCartTax(itemsForTax, finalIsInterState, warehouseState, customerState);
  
  // Debug logging
  console.log('ReturnDetailsModal Tax Calculation Debug:', {
    returnItems: returnItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      hasTaxInfo: !!item.tax,
      priceIncludesTax: item.priceIncludesTax,
      tax: item.tax
    })),
    orderDetails: orderDetails ? {
      hasItems: !!orderDetails.items,
      itemsCount: orderDetails.items?.length || 0,
      taxCalculation: orderDetails.taxCalculation,
      shippingAddress: orderDetails.shippingAddress,
      warehouse: orderDetails.warehouse
    } : null,
    itemsForTax: itemsForTax.map(item => ({
      price: item.price,
      quantity: item.quantity,
      priceIncludesTax: item.priceIncludesTax,
      hasTax: !!item.tax,
      taxPercentage: item.tax?.percentage
    })),
    interstateDetection: {
      customerState,
      warehouseState,
      isInterState,
      finalIsInterState,
      customerStateTrimmed: customerState.toLowerCase().trim(),
      warehouseStateTrimmed: warehouseState.toLowerCase().trim(),
      statesMatch: customerState.toLowerCase().trim() === warehouseState.toLowerCase().trim(),
      orderTaxCalculationIsInterState: orderDetails?.taxCalculation?.isInterState
    },
    taxCalculation: {
      subtotal: taxCalculation.subtotal,
      totalTax: taxCalculation.totalTax,
      totalCGST: taxCalculation.totalCGST,
      totalSGST: taxCalculation.totalSGST,
      totalIGST: taxCalculation.totalIGST,
      finalTotal: taxCalculation.finalTotal,
      isInterState: taxCalculation.isInterState
    }
  });
  
  // Get discount information from order
  const totalDiscount = orderDetails?.promoCode?.discountAmount || 
                       orderDetails?.pricing?.discountAmount || 
                       orderDetails?.orderSummary?.totalDiscount || 0;
  
  const totalDeliveryCharge = orderDetails?.pricing?.deliveryCharge || 
                             orderDetails?.orderSummary?.totalDeliveryCharge || 0;

  // Calculate proportional discount and delivery charge
  const subtotal = taxCalculation.subtotal;
  const discountRatio = subtotal > 0 ? totalDiscount / (subtotal + taxCalculation.totalTax) : 0;
  const deliveryRatio = subtotal > 0 ? totalDeliveryCharge / (subtotal + taxCalculation.totalTax) : 0;

  const items_total_gross = taxCalculation.finalTotal;
  const items_discount_total = items_total_gross * discountRatio;
  const delivery_refund = deliveryRefundable ? items_total_gross * deliveryRatio : 0;
  const total_refund = items_total_gross - items_discount_total + delivery_refund;

  // Create item breakdown
  const item_breakdown = returnItems.map((item, index) => {
    // Get tax info for this specific item (same logic as above)
    let taxInfo = item.tax;
    let priceIncludesTax = item.priceIncludesTax;
    
    if (!taxInfo && orderDetails?.items) {
      const orderItem = orderDetails.items.find((orderItem: any) => 
        orderItem._id === item.orderItemId || 
        (orderItem.productId === item.productId && orderItem.name === item.name)
      );
      if (orderItem) {
        taxInfo = orderItem.tax;
        priceIncludesTax = orderItem.priceIncludesTax;
      }
    }
    
    const itemTaxInfo: ProductTaxInfo = {
      price: item.price,
      priceIncludesTax: priceIncludesTax || false,
      tax: taxInfo ? {
        id: taxInfo._id,
        name: taxInfo.name,
        percentage: taxInfo.percentage,
        description: taxInfo.description
      } : null,
      quantity: item.quantity
    };

    // Calculate individual item tax
    const itemTaxCalc = calculateCartTax([itemTaxInfo], finalIsInterState, warehouseState, customerState);
    
    const taxable_value = itemTaxCalc.subtotal;
    const cgst = itemTaxCalc.totalCGST;
    const sgst = itemTaxCalc.totalSGST;
    const igst = itemTaxCalc.totalIGST;
    const gross_total = itemTaxCalc.finalTotal;
    
    // Debug logging for individual item
    console.log(`Item ${item.name} tax calculation:`, {
      itemTaxInfo,
      isInterState,
      finalIsInterState,
      itemTaxCalc: {
        subtotal: itemTaxCalc.subtotal,
        totalCGST: itemTaxCalc.totalCGST,
        totalSGST: itemTaxCalc.totalSGST,
        totalIGST: itemTaxCalc.totalIGST,
        finalTotal: itemTaxCalc.finalTotal,
        isInterState: itemTaxCalc.isInterState
      },
      calculatedValues: {
        taxable_value,
        cgst,
        sgst,
        igst,
        gross_total
      }
    });
    
    const discount_share = gross_total * discountRatio;
    const delivery_charge = deliveryRefundable ? gross_total * deliveryRatio : 0;
    const refundable_amount = gross_total - discount_share;

    return {
      item_id: item._id,
      item_name: item.name,
      quantity: item.quantity,
      taxable_value: Math.round(taxable_value * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      gross_total: Math.round(gross_total * 100) / 100,
      discount_share: Math.round(discount_share * 100) / 100,
      delivery_charge: Math.round(delivery_charge * 100) / 100,
      refundable_amount: Math.round(refundable_amount * 100) / 100
    };
  });

  return {
    items_total_gross: Math.round(items_total_gross * 100) / 100,
    items_discount_total: Math.round(items_discount_total * 100) / 100,
    delivery_refund: Math.round(delivery_refund * 100) / 100,
    total_refund: Math.round(total_refund * 100) / 100,
    currency,
    item_breakdown
  };
}

export default function ReturnDetailsModal({ open, onClose, data, role, onUpdateStatus, onAssignPickup, onPickupAction, onVerifyPickupOtp, onGeneratePickupOtp, deliveryAgents = [], refundOptions = {} }: ReturnDetailsModalProps) {
  const [newStatus, setNewStatus] = useState<string>(data.status);
  const [note, setNote] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const otpRefs = useMemo(() => Array(4).fill(0).map(() => React.createRef<HTMLInputElement>()), []);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [partialRefundAmount, setPartialRefundAmount] = useState<string>("");
  const appliedPromoCode = useMemo(() => {
    return (orderDetails?.promoCode?.code) || data.orderSummary?.promoCode || '';
  }, [orderDetails?.promoCode?.code, data.orderSummary?.promoCode]);

  // Calculate refund amounts using the proper tax calculation logic
  const refundSummary = useMemo(() => {
    return calculateRefund(data.items, orderDetails, {
      deliveryRefundable: false, // Delivery is non-refundable as per user requirement
      currency: refundOptions.currency || 'INR'
    });
  }, [data.items, refundOptions, orderDetails]);

  // Load order details to get actual applied promocode/discount
  useEffect(() => {
    let cancelled = false;
    const loadOrder = async () => {
      try {
        if (!data?.orderId) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const APIURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${APIURL}/orders/order/${data.orderId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) return;
        const json = await res.json();
        const order = json?.order || null;
        if (!cancelled) setOrderDetails(order);
      } catch (e) {
        if (!cancelled) setOrderDetails(null);
      }
    };
    loadOrder();
    return () => { cancelled = true; };
  }, [data?.orderId]);

  // Convert refund summary to the format expected by the UI
  const calculateRefundAmounts = useMemo(() => {
    return refundSummary.item_breakdown.map((item, index) => ({
      ...data.items[index],
      taxableValue: item.taxable_value,
      cgst: item.cgst,
      sgst: item.sgst,
      igst: item.igst,
      grossTotal: item.gross_total,
      discountShare: item.discount_share,
      deliveryCharge: item.delivery_charge,
      refundableAmount: item.refundable_amount
    }));
  }, [refundSummary, data.items]);

  // Calculate totals from refund summary
  const refundTotals = useMemo(() => {
    return {
      taxableValue: refundSummary.item_breakdown.reduce((sum, item) => sum + item.taxable_value, 0),
      cgst: refundSummary.item_breakdown.reduce((sum, item) => sum + item.cgst, 0),
      sgst: refundSummary.item_breakdown.reduce((sum, item) => sum + item.sgst, 0),
      igst: refundSummary.item_breakdown.reduce((sum, item) => sum + item.igst, 0),
      grossTotal: refundSummary.items_total_gross,
      discountShare: refundSummary.items_discount_total,
      deliveryCharge: refundSummary.delivery_refund,
      refundableAmount: refundSummary.total_refund
    };
  }, [refundSummary]);

  const resetOtpInputs = () => {
    setOtp(["", "", "", ""]);
    setTimeout(() => {
      otpRefs[0]?.current?.focus();
    }, 0);
  };

  const startResendCooldown = (seconds: number = 30) => {
    setResendSecondsLeft(seconds);
  };

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setResendSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSecondsLeft]);

  useEffect(() => {
    setNewStatus(data.status);
    // Reset partial refund amount when status changes
    if (data.status !== 'partially_refunded') {
      setPartialRefundAmount("");
    }
  }, [data.status]);

  useEffect(() => {
    if (showOtp && otpRefs[0]?.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        otpRefs[0]?.current?.focus();
      }, 100);
    }
  }, [showOtp, otpRefs]);

  const availableStatuses = useMemo(() => computeAvailableStatuses(data.status, role), [data.status, role]);
  const showAgentColumn = (role === 'admin' || role === 'order_warehouse_management') && ((data.status === 'pickup_assigned') || (newStatus === 'pickup_assigned' && data.status !== 'pickup_assigned'));

  const handleStatusSubmit = async () => {
    if (!availableStatuses.includes(newStatus)) return;
    setSubmitting(true);
    try {
      let refundedAmount: number | undefined;
      
      // Calculate refunded amount based on status
      if (newStatus === 'refunded') {
        // For full refund, use the total calculated refund amount
        refundedAmount = Math.round(refundTotals.refundableAmount);
      } else if (newStatus === 'partially_refunded' && partialRefundAmount) {
        // For partial refund, use the manually entered amount
        refundedAmount = Number(partialRefundAmount);
      }
      
      await onUpdateStatus(newStatus, note, refundedAmount);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 4) return;
    setSubmitting(true);
    try {
      await onVerifyPickupOtp?.(code);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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

        <div className="p-6 space-y-6">
          {/* Top summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                {(() => {
                  const Icon = (statusConfig[data.status]?.icon) || RefreshCw;
                  return <Icon className="w-4 h-4 text-brand-primary" />;
                })()}
                <span className="text-sm font-medium text-gray-600">Return Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig[data.status]?.bg || 'bg-gray-100'} ${statusConfig[data.status]?.color || 'text-gray-800'}`}>
                {statusConfig[data.status]?.label || data.status}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Customer</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{data.customerInfo.name}</p>
              <p className="text-xs text-gray-600">{data.customerInfo.phone}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium text-gray-600">Refund Preference</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {data.refundPreference?.method ? (data.refundPreference.method === 'upi' ? 'UPI' : 'Bank Transfer') : 'Not provided'}
              </p>
              {data.refundPreference?.method === 'upi' && data.refundPreference.upiId && (
                <p className="text-xs text-gray-600">UPI: {data.refundPreference.upiId}</p>
              )}
              {data.refundPreference?.method === 'bank' && data.refundPreference.bankDetails && (
                <p className="text-xs text-gray-600 truncate">A/C: {data.refundPreference.bankDetails.accountNumber} • {data.refundPreference.bankDetails.ifsc}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold text-gray-900">Pickup Address</h4>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium">{data.pickupInfo.address.name}</p>
              <p>{data.pickupInfo.address.building}</p>
              <p>{data.pickupInfo.address.area}</p>
              <p>{data.pickupInfo.address.city}, {data.pickupInfo.address.state} - {data.pickupInfo.address.pincode}</p>
              {data.pickupInfo.address.phone && (
                <p className="text-gray-600 inline-flex items-center"><Phone className="w-4 h-4 mr-1" />{data.pickupInfo.address.phone}</p>
              )}
              {data.pickupInfo.pickupInstructions && (
                <p className="text-gray-500">Instructions: {data.pickupInfo.pickupInstructions}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 text-brand-primary mr-2" />
              Return Items ({data.items.length})
            </h4>
            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div key={item._id || `item-${index}`} className="flex items-center p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
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

          {/* Return Order Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 text-brand-primary mr-2" />
              Return Order Summary
            </h4>
            
            {/* Items breakdown */}
            <div className="space-y-3 mb-6">
              {calculateRefundAmounts.map((item, index) => (
                <div key={item._id || `refund-item-${index}`} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">{item.name}</h5>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₹{item.refundableAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <div className="flex justify-between">
                        <span>Taxable Value:</span>
                        <span>₹{item.taxableValue.toFixed(2)}</span>
                      </div>
                      {Math.abs(item.igst) > 0.01 ? (
                        <div className="flex justify-between">
                          <span>IGST:</span>
                          <span>₹{item.igst.toFixed(2)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>CGST:</span>
                            <span>₹{item.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SGST:</span>
                            <span>₹{item.sgst.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Gross Total:</span>
                        <span>₹{item.grossTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount Share:</span>
                        <span className="text-red-600">-₹{item.discountShare.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo code info */}
            {(appliedPromoCode) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-900">Promo Code Applied:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {appliedPromoCode}
                    </span>
                  </div>
                  <span className="text-sm text-blue-700">
                    -₹{refundTotals.discountShare.toFixed(2)} discount
                  </span>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{refundTotals.taxableValue.toFixed(2)}</span>
                </div>
                {Math.abs(refundTotals.igst) > 0.01 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IGST:</span>
                    <span className="font-medium">₹{refundTotals.igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGST:</span>
                      <span className="font-medium">₹{refundTotals.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium">₹{refundTotals.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-₹{refundTotals.discountShare.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Refund Amount:</span>
                    <span>₹{Math.round(refundTotals.refundableAmount)}</span>
                  </div>
                  {data.status === 'partially_refunded' && data.refundedAmount && data.refundedAmount > 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-yellow-800">
                          {'Partially Refunded Amount:'}
                        </span>
                        <span className="text-sm font-bold text-yellow-900">
                          ₹{data.refundedAmount}
                        </span>
                      </div>
                      {(() => {
                        // Find the most recent refund-related status entry for additional notes
                        const refundEntry = data.statusHistory?.find(entry => 
                          (entry.status === 'partially_refunded') && 
                          entry.note && 
                          !entry.note.includes('Amount: ₹')
                        );
                        return refundEntry?.note && (
                          <div className="mt-1 text-xs text-yellow-700">
                            Note: {refundEntry.note}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {availableStatuses.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              {/* Unified status controls (dropdown in modal) */}
              <div className="space-y-3">
                <div className="space-y-3">
                  {/* Status and Note in a compact row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Change Status</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        <option value={data.status} disabled>
                          Current: {statusConfig[data.status]?.label || data.status}
                        </option>
                        {availableStatuses.map((st) => (
                          <option key={st} value={st}>{statusConfig[st]?.label || st}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        placeholder="Add a note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Agent assignment fields in separate row when needed */}
                  {(data.status === 'pickup_assigned' && (role === 'admin' || role === 'order_warehouse_management')) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Pickup Agent</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed"
                        value={data.assignedPickupAgent?.id || ''}
                        disabled
                      >
                        <option value="">
                          {data.assignedPickupAgent ? `${data.assignedPickupAgent.name} - ${data.assignedPickupAgent.phone}` : 'No agent assigned'}
                        </option>
                      </select>
                    </div>
                  )}
                  {(newStatus === 'pickup_assigned' && data.status !== 'pickup_assigned' && (role === 'admin' || role === 'order_warehouse_management')) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Pickup Agent</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                      >
                        <option value="">Choose an agent...</option>
                        {deliveryAgents.map((a) => (
                          <option key={a._id} value={a._id}>{a.name} - {a.phone}</option>
                        ))}
                      </select>
                    </div>  
                  )}
                  {newStatus === 'partially_refunded' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Partial Refund Amount (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        placeholder={`Enter amount (max: ₹${Math.round(refundTotals.refundableAmount)})`}
                        value={partialRefundAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow integers and ensure it doesn't exceed total refund amount
                          if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= Math.round(refundTotals.refundableAmount))) {
                            setPartialRefundAmount(value);
                          }
                        }}
                        min="0"
                        max={Math.round(refundTotals.refundableAmount)}
                        step="1"
                      />
                    </div>
                  )}
                </div>

                {/* Action area per role */}
                {(role === 'admin' || role === 'order_warehouse_management') && (
                  <div className="flex flex-col space-y-3">
                    {/* Admin: direct update; Warehouse: OTP required when setting picked_up */}
                    {role === 'order_warehouse_management' && newStatus === 'picked_up' && (
                      <div className="space-y-3">
                        {/* Show generate button above only before OTP is shown */}
                        {!showOtp && (
                        <div className="flex justify-center">
                          <button
                            className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
                            disabled={submitting}
                            onClick={async () => {
                              setSubmitting(true)
                              try {
                                await onGeneratePickupOtp?.(data.returnId)
                                setShowOtp(true)
                                setOtpSent(true)
                                startResendCooldown(30)
                              } catch (error: any) {
                                console.error('Failed to generate pickup OTP:', error)
                                toast.error('Failed to send OTP. Please try again.')
                              } finally {
                                setSubmitting(false)
                              }
                            }}
                          >
                            {submitting ? 'Generating...' : 'Generate Return Pick-up OTP'}
                          </button>
                        </div>
                        )}
                        
                        {/* OTP Input */}
                        {showOtp && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="text-sm text-gray-600">Enter the 4-digit OTP to confirm pickup.</div>
                            <div className="flex justify-center space-x-3">
                              {otp.map((digit, idx) => (
                                <input 
                                  key={idx} 
                                  ref={otpRefs[idx]}
                                  maxLength={1} 
                                  value={digit} 
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                                    const next = [...otp];
                                    next[idx] = value;
                                    setOtp(next);
                                    
                                    // Auto-focus next input if value entered
                                    if (value && idx < 3) {
                                      otpRefs[idx + 1]?.current?.focus();
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    // Handle backspace to go to previous input
                                    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                                      otpRefs[idx - 1]?.current?.focus();
                                    }
                                    // Submit on Enter if 4 digits entered (manager/warehouse flow)
                                    if (e.key === 'Enter') {
                                      const code = otp.join("");
                                      if (code.length === 4) {
                                        (async () => {
                                          setSubmitting(true);
                                          try {
                                            await onVerifyPickupOtp?.(code);
                                           // toast.success('OTP verified successfully');
                                            await onUpdateStatus(newStatus, note);
                                          } catch (err: any) {
                                            toast.error(err?.message || 'Invalid or expired OTP');
                                            resetOtpInputs();
                                          } finally {
                                            setSubmitting(false);
                                          }
                                        })();
                                      }
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" 
                                  placeholder="0" 
                                />
                              ))}
                            </div>
                            {otpSent && (
                              <div className="flex justify-center">
                                <button
                                  className="mt-2 text-sm text-brand-primary hover:text-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={submitting || resendSecondsLeft > 0}
                                  onClick={async () => {
                                    setSubmitting(true)
                                    try {
                                      await onGeneratePickupOtp?.(data.returnId)
                                      setShowOtp(true)
                                      startResendCooldown(30)
                                    } catch (error) {
                                      console.error('Failed to resend pickup OTP:', error)
                                      toast.error('Failed to resend OTP. Please try again.')
                                    } finally {
                                      setSubmitting(false)
                                    }
                                  }}
                                >
                                  {submitting ? 'Resending...' : (resendSecondsLeft > 0 ? `Resend in ${resendSecondsLeft}s` : 'Resend OTP')}
                                </button>
                              </div>
                            )}
                            {/* Bottom action button when OTP is visible */}
                            <div className="flex justify-end">
                              <button
                                className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
                                disabled={submitting}
                                onClick={async () => {
                                  setSubmitting(true)
                                  try {
                                    const code = otp.join('')
                                    if (code.length !== 4) {
                                      otpRefs[0]?.current?.focus()
                                      return
                                    }
                                    await onVerifyPickupOtp?.(code)
                                    //toast.success('OTP verified successfully')
                                    await onUpdateStatus(newStatus, note)
                                  } catch (e: any) {
                                    toast.error(e?.message || 'Invalid or expired OTP')
                                    resetOtpInputs()
                                  } finally {
                                    setSubmitting(false)
                                  }
                                }}
                              >
                                {submitting ? 'Verifying...' : (otp.join('').length === 4 ? 'Verify OTP & Update Status' : 'Enter OTP')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(!(role === 'order_warehouse_management' && newStatus === 'picked_up')) && (
                      <div className="flex justify-end">
                        <button
                          className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
                          disabled={submitting || (newStatus === 'pickup_assigned' && !selectedAgent) || !availableStatuses.includes(newStatus) || (newStatus === 'partially_refunded' && (!partialRefundAmount || Number(partialRefundAmount) <= 0))}
                          onClick={async () => {
                            setSubmitting(true)
                            try {
                              if (newStatus === 'pickup_assigned' && selectedAgent && onAssignPickup) {
                                await onAssignPickup(selectedAgent, note || 'Pickup agent assigned')
                              } else {
                                // Calculate refunded amount based on status
                                let refundedAmount: number | undefined;
                                if (newStatus === 'refunded') {
                                  // For full refund, use the total calculated refund amount
                                  refundedAmount = Math.round(refundTotals.refundableAmount);
                                } else if (newStatus === 'partially_refunded' && partialRefundAmount) {
                                  // For partial refund, use the manually entered amount
                                  refundedAmount = Number(partialRefundAmount);
                                }
                                
                                // For partially_refunded status, include the partial refund amount in the note
                                const statusNote = newStatus === 'partially_refunded' 
                                  ? `${note || 'Partial refund processed'}. Amount: ₹${partialRefundAmount}`
                                  : note;
                                
                                await onUpdateStatus(newStatus, statusNote, refundedAmount)
                              }
                            } finally {
                              setSubmitting(false)
                            }
                          }}
                        >
                          {submitting ? 'Updating...' : 'Update Status'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {role === 'delivery_boy' && (
                  <div className="space-y-3">
                    {/* Primary button reflects selected status */}
                    {newStatus === 'pickup_rejected' && (
                      <div className="flex justify-end">
                        <button
                          className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
                          disabled={submitting || !availableStatuses.includes(newStatus)}
                          onClick={async () => {
                            setSubmitting(true)
                            try {
                              await onPickupAction?.('reject', note || 'Pickup rejected by delivery agent')
                            } finally {
                              setSubmitting(false)
                            }
                          }}
                        >
                          {submitting ? 'Updating...' : 'Update Status'}
                        </button>
                      </div>
                    )}

                    {newStatus === 'picked_up' && (
                      <div className="space-y-2">
                        {!showOtp && (
                        <div className="flex justify-center">
                          <button
                            className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
                            disabled={submitting}
                            onClick={async () => {
                              setSubmitting(true)
                              try {
                                await onGeneratePickupOtp?.(data.returnId)
                                setShowOtp(true)
                                setOtpSent(true)
                              } catch (error: any) {
                                console.error('Failed to generate pickup OTP:', error)
                                toast.error('Failed to send OTP. Please try again.')
                              } finally {
                                setSubmitting(false)
                              }
                            }}
                          >
                            {submitting ? 'Generating...' : 'Generate Return Pick-up OTP'}
                          </button>
                        </div>
                        )}
                        {showOtp && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="text-sm text-gray-600">Ask customer for OTP and enter below to confirm pickup.</div>
                          <div className="flex justify-center space-x-3">
                            {otp.map((digit, idx) => (
                              <input 
                                key={idx} 
                                ref={otpRefs[idx]}
                                maxLength={1} 
                                value={digit} 
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                                  const next = [...otp];
                                  next[idx] = value;
                                  setOtp(next);
                                  
                                  // Auto-focus next input if value entered
                                  if (value && idx < 3) {
                                    otpRefs[idx + 1]?.current?.focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  // Handle backspace to go to previous input
                                  if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                                    otpRefs[idx - 1]?.current?.focus();
                                  }
                                  // Submit on Enter if 4 digits entered (delivery flow)
                                  if (e.key === 'Enter') {
                                    const code = otp.join("");
                                    if (code.length === 4) {
                                      (async () => {
                                        setSubmitting(true);
                                        try {
                                          await onVerifyPickupOtp?.(code)
                                        //  toast.success('OTP verified successfully')
                                          await onPickupAction?.('picked_up', note || 'Items picked up successfully')
                                        } catch (err: any) {
                                          toast.error(err?.message || 'Invalid or expired OTP')
                                          resetOtpInputs()
                                        } finally {
                                          setSubmitting(false)
                                        }
                                      })();
                                    }
                                  }
                                }}
                                onFocus={(e) => e.target.select()}
                                className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" 
                                placeholder="0" 
                              />
                            ))}
                          </div>
                          {otpSent && (
                            <div className="flex justify-center">
                              <button
                                className="mt-2 text-sm text-brand-primary hover:underline disabled:opacity-50"
                                disabled={resending || resendSecondsLeft > 0}
                                onClick={async () => {
                                  setResending(true)
                                  try {
                                    await onGeneratePickupOtp?.(data.returnId)
                                    setShowOtp(true)
                                    startResendCooldown(30)
                                  } catch (error) {
                                    console.error('Failed to resend pickup OTP:', error)
                                    toast.error('Failed to resend OTP. Please try again.')
                                  } finally {
                                    setResending(false)
                                  }
                                }}
                              >
                                {resending ? 'Resending...' : (resendSecondsLeft > 0 ? `Resend in ${resendSecondsLeft}s` : 'Resend OTP')}
                              </button>
                            </div>
                          )}
                          {/* Bottom action button when OTP is visible */}
                          <div className="flex justify-end">
                            <button
                              className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
                              disabled={submitting}
                              onClick={async () => {
                                setSubmitting(true)
                                try {
                                  const code = otp.join('')
                                  if (code.length !== 4) {
                                    otpRefs[0]?.current?.focus()
                                    return
                                  }
                                  await onVerifyPickupOtp?.(code)
                                  //toast.success('OTP verified successfully')
                                  await onPickupAction?.('picked_up', note || 'Items picked up successfully')
                                } catch (e: any) {
                                  toast.error(e?.message || 'Invalid or expired OTP')
                                  resetOtpInputs()
                                } finally {
                                  setSubmitting(false)
                                }
                              }}
                            >
                              {submitting ? 'Verifying...' : (otp.join('').length === 4 ? 'Verify OTP & Update Status' : 'Enter OTP')}
                            </button>
                          </div>
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Removed legacy duplicate pickup actions and OTP blocks */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


