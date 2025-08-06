'use client'

import React, { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FaShippingFast, FaCheckCircle, FaTimesCircle, FaClock, FaBox, FaUndo } from 'react-icons/fa'
import { Loader2, Package, Truck, CheckCircle, X, RefreshCw, MapPin, Phone, Calendar, CreditCard, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import InvoiceModal from '@/components/InvoiceModal'
import { calculateProductTax } from '@/lib/tax-calculation'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  brand?: string
  priceIncludesTax?: boolean
  tax?: {
    _id?: string
    id?: string
    name: string
    percentage: number
    description?: string
  }
  taxRate?: number
  taxAmount?: number
  hsnCode?: string
  hsn?: string
}

interface Order {
  _id: string
  orderId: string
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  createdAt: string
  pricing: {
    total: number
    subtotal: number
    taxAmount: number
    discountAmount: number
    deliveryCharge: number
    codCharge: number
  }
  items: OrderItem[]
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  deliveryInfo: {
    address: {
      building: string
      area: string
      city: string
      state: string
      pincode: string
      landmark?: string
    }
    estimatedDeliveryTime?: string
  }
  paymentInfo: {
    method: 'cod' | 'online'
    paymentMethod: string
    status: string
  }
  warehouseInfo: {
    warehouseName: string
  }
  tracking?: {
    trackingNumber?: string
    carrier?: string
  }
  taxCalculation?: {
    isInterState: boolean
    totalTax: number
    subtotal: number
    totalCGST: number
    totalSGST: number
    totalIGST: number
    taxBreakdown: {
      cgst: { percentage: number }
      sgst: { percentage: number }
      igst: { percentage: number }
    }
  }
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceOrderData, setInvoiceOrderData] = useState<any>(null)

  // Helper function to calculate correct item price
  const calculateItemDisplayPrice = (item: OrderItem, order: Order) => {
    if (!item.tax || !item.tax.percentage) {
      return item.price * item.quantity;
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
    return taxResult.totalPrice;
  };

  // Calculate correct order summary totals for an order
  const calculateOrderSummary = (order: Order) => {
    let correctSubtotal = 0;
    let correctTaxAmount = 0;

    order.items.forEach(item => {
      if (!item.tax || !item.tax.percentage) {
        correctSubtotal += item.price * item.quantity;
        return;
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
      correctSubtotal += taxResult.basePrice;
      correctTaxAmount += taxResult.taxAmount;
    });

    return {
      subtotal: correctSubtotal,
      taxAmount: correctTaxAmount,
      discountAmount: order.pricing.discountAmount || 0,
      deliveryCharge: order.pricing.deliveryCharge || 0,
      codCharge: order.pricing.codCharge || 0,
      total: correctSubtotal + correctTaxAmount - (order.pricing.discountAmount || 0) + (order.pricing.deliveryCharge || 0) + (order.pricing.codCharge || 0)
    };
  };
  
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    fetchOrders()
  }, [user, token])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      console.log('Fetched orders:', data) // Debug log
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders')
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = (order: Order) => {
    console.log('Orders page - Raw order data:', order);
    
    const invoiceData = {
      orderId: order.orderId,
      orderDate: order.createdAt,
      customerInfo: order.customerInfo,
      deliveryAddress: order.deliveryInfo.address,
      items: order.items.map(item => ({
        name: item.name,
        price: item.price,
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
      warehouseInfo: order.warehouseInfo
    }
    
    console.log('Orders page - Prepared invoice data:', invoiceData);
    
    setInvoiceOrderData(invoiceData)
    setShowInvoiceModal(true)
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <Package className="text-blue-800" />
      case 'processing':
        return <FaClock className="text-yellow-800" />
      case 'shipped':
        return <Truck className="text-purple-800" />
      case 'delivered':
        return <CheckCircle className="text-green-800" />
      case 'cancelled':
        return <X className="text-red-800" />
      case 'refunded':
        return <RefreshCw className="text-gray-800" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchOrders}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">My Orders</h1>
          <p className="mt-2 text-lg text-gray-600">
            View and track your order history
          </p>
        </div>

        <div className="mb-6 p-4 bg-white shadow rounded-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Total Orders</h2>
            <p className="text-gray-600">{orders.length}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Total Spending</h2>
            <p className="text-gray-600">₹{Math.ceil(orders.reduce((acc, order) => acc + order.pricing.total, 0))}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <Link 
              href="/"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {orders.map((order) => (
                <li key={order._id}>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full block hover:bg-gray-50 transition duration-150 ease-in-out"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <p className="ml-2 text-sm font-medium text-indigo-600 truncate">
                            {order.orderId}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <CreditCard className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {order.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Ordered on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-900">₹{Math.ceil(order.pricing.total)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          (() => {
            const orderSummary = calculateOrderSummary(selectedOrder);
            return (
              <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Order Details - {selectedOrder.orderId}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Order Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order Date:</span>
                        <span className="text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Method:</span>
                        <span className="text-sm text-gray-900">
                          {selectedOrder.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </span>
                      </div>
                      {selectedOrder.tracking?.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tracking:</span>
                          <span className="text-sm text-gray-900">{selectedOrder.tracking.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h4>
                    <div className="text-sm text-gray-900">
                      <p>{selectedOrder.deliveryInfo.address.building}</p>
                      <p>{selectedOrder.deliveryInfo.address.area}</p>
                      <p>{selectedOrder.deliveryInfo.address.city}, {selectedOrder.deliveryInfo.address.state}</p>
                      <p>{selectedOrder.deliveryInfo.address.pincode}</p>
                      {selectedOrder.deliveryInfo.address.landmark && (
                        <p className="text-gray-600">Near {selectedOrder.deliveryInfo.address.landmark}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex items-center p-3 border border-gray-200 rounded-lg">
                        {item.image && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="ml-4 flex-1">
                          <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                          {item.category && (
                            <p className="text-xs text-gray-500">{item.category}</p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-900">
                                ₹{calculateItemDisplayPrice(item, selectedOrder).toFixed(2)}
                              </span>
                              {item.tax && item.tax.percentage && (
                                <div className="text-xs text-gray-500">
                                  {item.priceIncludesTax ? 'Tax Included' : 'Tax Excluded'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal (Before Tax):</span>
                      <span className="text-gray-900">₹{orderSummary.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Enhanced Tax Breakdown */}
                    {orderSummary.taxAmount > 0 && (
                      <div className="space-y-1">
                        {selectedOrder.taxCalculation ? (
                          selectedOrder.taxCalculation.isInterState ? (
                            // Interstate - Show IGST
                            selectedOrder.taxCalculation.totalIGST > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">IGST:</span>
                                <span className="text-gray-900">₹{selectedOrder.taxCalculation.totalIGST.toFixed(2)}</span>
                              </div>
                            )
                          ) : (
                            // Intrastate - Show CGST + SGST
                            <>
                              {selectedOrder.taxCalculation.totalCGST > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">CGST:</span>
                                  <span className="text-gray-900">₹{selectedOrder.taxCalculation.totalCGST.toFixed(2)}</span>
                                </div>
                              )}
                              {selectedOrder.taxCalculation.totalSGST > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">SGST:</span>
                                  <span className="text-gray-900">₹{selectedOrder.taxCalculation.totalSGST.toFixed(2)}</span>
                                </div>
                              )}
                            </>
                          )
                        ) : (
                          // Fallback for orders without detailed tax calculation
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax:</span>
                            <span className="text-gray-900">₹{orderSummary.taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {orderSummary.deliveryCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Charge:</span>
                        <span className="text-gray-900">₹{orderSummary.deliveryCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {orderSummary.codCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">COD Charge:</span>
                        <span className="text-gray-900">₹{orderSummary.codCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {orderSummary.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-green-600">-₹{orderSummary.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">₹{Math.ceil(orderSummary.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-between">
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Close
                </button>
              </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && invoiceOrderData && (
          <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => setShowInvoiceModal(false)}
            orderData={invoiceOrderData}
          />
        )}
      </div>
    </div>
  )
}

export default OrdersPage