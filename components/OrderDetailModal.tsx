"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Package, MapPin, CreditCard, Calendar, Truck, CheckCircle, Download } from 'lucide-react';
import InvoiceModal from './InvoiceModal';

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
    
    // For mobile, trigger direct download
    if (window.innerWidth < 768) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = `/api/invoice/download?orderId=${order.orderId}`;
      link.download = `invoice-${order.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For larger displays, show modal
      setInvoiceOrderData(invoiceData);
      setShowInvoiceModal(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Status and Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <span className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
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
            
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 col-span-2 md:col-span-1">
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
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
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

          {/* Order Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-brand-primary" />
              Items ({order.items.length})
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex items-center p-2.5 sm:p-3 border border-gray-200 rounded-lg sm:rounded-xl hover:shadow-sm transition-shadow">
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
                    <h5 className="font-medium text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1 truncate">
                      {item.name}
                      {item.variantName && (
                        <span className="text-xs sm:text-sm text-gray-600 font-normal ml-1 sm:ml-2">({item.variantName})</span>
                      )}
                    </h5>
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
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Order Summary</h4>
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
                  <span className="text-lg sm:text-xl font-bold text-green-600">₹{order.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invoice Modal - Only for larger displays */}
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