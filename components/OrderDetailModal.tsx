"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Package, MapPin, CreditCard, Calendar, Truck, CheckCircle, Download } from 'lucide-react';
import { calculateProductTax, isInterStateTransaction } from '@/lib/tax-calculation';
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

  // Calculate correct tax for each item based on priceIncludesTax
  const calculateItemTax = (item: OrderItem) => {
    if (!item.tax || !item.tax.percentage) {
      return {
        basePrice: item.price * item.quantity,
        taxAmount: 0,
        displayPrice: item.price * item.quantity
      };
    }

    const isInterState = order.taxCalculation?.isInterState || false;
    const taxInfo = {
      price: item.price,
      priceIncludesTax: item.priceIncludesTax || false,
      tax: {
        id: item.tax._id || item.tax.id || '',
        name: item.tax.name,
        percentage: item.tax.percentage
      },
      quantity: item.quantity
    };

    const taxResult = calculateProductTax(taxInfo, isInterState);
    
    return {
      basePrice: taxResult.basePrice,
      taxAmount: taxResult.taxAmount,
      displayPrice: taxResult.totalPrice
    };
  };

  // Calculate correct order summary totals
  const calculateOrderSummary = () => {
    let totalMRP = 0;
    let totalSellingPrice = 0;
    let totalTaxAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let subtotalBeforeTax = 0;

    order.items.forEach(item => {
      // Calculate MRP total (use MRP if available, otherwise use price as fallback)
      const itemMRP = (item.mrp || item.price) * item.quantity;
      totalMRP += itemMRP;
      
      // Calculate selling price total
      const itemSellingPrice = item.price * item.quantity;
      totalSellingPrice += itemSellingPrice;
      
      // Calculate tax amount and base price (before tax)
      if (item.tax && item.tax.percentage) {
        let taxPerItem = 0;
        let basePricePerItem = 0;
        
        if (item.priceIncludesTax) {
          // Tax is included in price, so extract it: base_price = price / (1 + tax_rate)
          const taxRate = item.tax.percentage / 100;
          basePricePerItem = item.price / (1 + taxRate);
          taxPerItem = item.price - basePricePerItem;
        } else {
          // Tax is excluded, so base price is the selling price
          basePricePerItem = item.price;
          taxPerItem = (item.price * item.tax.percentage) / 100;
        }
        
        const itemTotalTax = taxPerItem * item.quantity;
        totalTaxAmount += itemTotalTax;
        
        const itemSubtotal = basePricePerItem * item.quantity;
        subtotalBeforeTax += itemSubtotal;
        
        // Check if interstate or intrastate
        const isInterState = order.taxCalculation?.isInterState || false;
        
        if (isInterState) {
          totalIGST += itemTotalTax;
        } else {
          // Split into CGST and SGST (half each)
          const cgstAmount = itemTotalTax / 2;
          const sgstAmount = itemTotalTax / 2;
          totalCGST += cgstAmount;
          totalSGST += sgstAmount;
        }
      } else {
        // No tax, so subtotal is same as selling price
        subtotalBeforeTax += itemSellingPrice;
      }
    });

    // Calculate save amount (MRP - Selling Price)
    const saveAmount = totalMRP - totalSellingPrice;
    
    // Promocode discount
    const promocodeDiscount = order.promoCode?.discountAmount || 0;
    
    // Final total calculation
    let finalTotal = subtotalBeforeTax + totalTaxAmount - promocodeDiscount + (order.pricing.deliveryCharge || 0) + (order.pricing.codCharge || 0);

    return {
      totalMRP,
      totalSellingPrice,
      subtotalBeforeTax,
      saveAmount,
      promocodeDiscount,
      taxAmount: totalTaxAmount,
      totalCGST,
      totalSGST,
      totalIGST,
      deliveryCharge: order.pricing.deliveryCharge || 0,
      codCharge: order.pricing.codCharge || 0,
      total: finalTotal
    };
  };

  const orderSummary = calculateOrderSummary();

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
        hsnCode: item.hsnCode || item.hsn || '-'
      })),
      pricing: order.pricing,
      taxCalculation: order.taxCalculation,
      warehouseInfo: order.warehouseInfo,
      promoCode: order.promoCode
    };
    
    setInvoiceOrderData(invoiceData);
    setShowInvoiceModal(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Order Details</h3>
              <p className="text-white/80">#{order.orderId}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Preview Invoice</span>
              </button>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Order Status and Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-600">Order Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-600">Payment</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {order.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold text-gray-900">Delivery Address</h4>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
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
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-brand-primary" />
              Order Items ({order.items.length})
            </h4>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const itemTax = calculateItemTax(item);
                return (
                  <div key={`${item.productId}-${index}`} className="flex items-center p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 ml-4">
                      <h5 className="font-medium text-gray-900 mb-1">{item.name}</h5>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        {item.brandId && (
                          <span>
                            Brand: {typeof item.brandId === 'object' ? item.brandId.name : (typeof item.brandId === 'string' && item.brandId.length > 20 ? 'Loading...' : item.brandId)}
                          </span>
                        )}
                        {item.categoryId && (
                          <span>
                            Category: {typeof item.categoryId === 'object' ? item.categoryId.name : (typeof item.categoryId === 'string' && item.categoryId.length > 20 ? 'Loading...' : item.categoryId)}
                          </span>
                        )}
                        {item.tax && (
                          <span className="text-brand-primary">
                            Tax: {item.tax.percentage}% 
                            {item.priceIncludesTax ? ' (Incl.)' : ' (Excl.)'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Price Info */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{item.price.toFixed(2)} x {item.quantity}
                      </div>
                      {itemTax.taxAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          {item.priceIncludesTax ? 
                            `(Tax ₹${itemTax.taxAmount.toFixed(2)} included)` :
                            `+ Tax ₹${itemTax.taxAmount.toFixed(2)}`
                          }
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Order Summary</h4>
            <div className="space-y-3">
              {/* Subtotal (Before Tax) */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal (Before Tax)</span>
                <span className="text-gray-900 font-medium">₹{orderSummary.subtotalBeforeTax.toFixed(2)}</span>
              </div>
              
              {/* Discount Applied */}
              {orderSummary.promocodeDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount Applied</span>
                  <span className="text-green-600 font-medium">-₹{orderSummary.promocodeDiscount.toFixed(2)}</span>
                </div>
              )}
              
              {/* Tax Breakdown */}
              {orderSummary.taxAmount > 0 && (
                <div className="space-y-2">
                  {orderSummary.totalIGST > 0 ? (
                    // Interstate - Show IGST
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGST</span>
                      <span className="text-gray-900">₹{orderSummary.totalIGST.toFixed(2)}</span>
                    </div>
                  ) : (
                    // Intrastate - Show CGST + SGST
                    <>
                      {orderSummary.totalCGST > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">CGST</span>
                          <span className="text-gray-900">₹{orderSummary.totalCGST.toFixed(2)}</span>
                        </div>
                      )}
                      {orderSummary.totalSGST > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">SGST</span>
                          <span className="text-gray-900">₹{orderSummary.totalSGST.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Total Tax */}
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-700">Total Tax</span>
                    <span className="text-gray-900">₹{orderSummary.taxAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {/* Delivery Charges */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Charges</span>
                <span className={`font-medium ${orderSummary.deliveryCharge === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {orderSummary.deliveryCharge === 0 ? 'FREE' : `₹${orderSummary.deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              
              {/* COD Charges */}
              {orderSummary.codCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">COD Charges</span>
                  <span className="text-gray-900 font-medium">₹{orderSummary.codCharge.toFixed(2)}</span>
                </div>
              )}
              
              {/* Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-600">₹{Math.ceil(orderSummary.total)}</span>
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