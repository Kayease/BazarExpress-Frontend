'use client';

import React, { useState, useEffect } from 'react';
import { useRoleAccess } from './RoleBasedAccess';
import { Eye, Package, Truck, CheckCircle, X, RefreshCw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  orderId: string;
  status: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  pricing: {
    total: number;
    subtotal: number;
    tax: number;
    delivery: number;
  };
  warehouseInfo: {
    warehouseId: string;
    warehouseName: string;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface RoleBasedOrderListProps {
  status?: string;
  onOrderClick?: (order: Order) => void;
}

const RoleBasedOrderList: React.FC<RoleBasedOrderListProps> = ({
  status,
  onOrderClick
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const { user, isWarehouseRestricted } = useRoleAccess();
  const [showOtpInput, setShowOtpInput] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, status, search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '/api/orders/admin/all';
      if (status && status !== 'all') {
        url = `/api/orders/admin/status/${status}`;
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (orderStatus: string) => {
    switch (orderStatus) {
      case 'new':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-yellow-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canUpdateOrderStatus = () => {
    return user?.role === 'admin' || user?.role === 'order_warehouse_management';
  };

  const generateDeliveryOtp = async (orderId: string) => {
    try {
      setGeneratingOtp(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/delivery-otp/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate delivery OTP');
      }

      const data = await response.json();
      setOtpSessionId(data.sessionId);
      setShowOtpInput(orderId);
      toast.success('Delivery OTP generated successfully');
      
      // For testing - show OTP in console (remove in production)
      if (data.otp) {
        console.log('Delivery OTP:', data.otp);
        toast.success(`OTP: ${data.otp} (Check console for testing)`);
      }
    } catch (error) {
      console.error('Error generating delivery OTP:', error);
      toast.error('Failed to generate delivery OTP');
    } finally {
      setGeneratingOtp(false);
    }
  };

  const verifyDeliveryOtp = async (orderId: string) => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      toast.error('Please enter complete 4-digit OTP');
      return;
    }

    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/admin/delivery-verify/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otp: otpString,
          sessionId: otpSessionId,
          note: 'Order delivered - OTP verified'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify delivery OTP');
      }

      // Refresh orders list
      await fetchOrders();
      
      setShowOtpInput(null);
      setOtp(["", "", "", ""]);
      setOtpSessionId("");
      toast.success('Order status updated to delivered successfully');
    } catch (error) {
      console.error('Error verifying delivery OTP:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify delivery OTP');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search orders by ID, customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Search
          </button>
        </div>
        
        {isWarehouseRestricted() && (
          <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            <Package className="w-4 h-4 inline mr-1" />
            Showing orders from your assigned warehouse(s) only
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {search ? 'Try adjusting your search criteria' : 'No orders match the current filters'}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.orderId}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {order.customerInfo.name} • {order.customerInfo.phone}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{order.pricing.total.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Items</p>
                  <p className="font-medium">{order.items.length} item(s)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warehouse</p>
                  <p className="font-medium">{order.warehouseInfo.warehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* OTP Input for Delivery Status */}
              {showOtpInput === order.orderId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
                  <div className="text-center">
                    <h5 className="font-medium text-gray-900 mb-2">Enter Delivery OTP</h5>
                    <p className="text-sm text-gray-600 mb-4">Please enter the 4-digit OTP to confirm delivery</p>
                  </div>
                  
                  <div className="flex justify-center space-x-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-10 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        placeholder="0"
                      />
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => verifyDeliveryOtp(order.orderId)}
                      disabled={updatingStatus || otp.join('').length !== 4}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {updatingStatus ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify & Deliver
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowOtpInput(null);
                        setOtp(["", "", "", ""]);
                        setOtpSessionId("");
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(order.updatedAt).toLocaleString()}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOrderClick?.(order)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  
                  {canUpdateOrderStatus() && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => generateDeliveryOtp(order.orderId)}
                      disabled={generatingOtp || showOtpInput === order.orderId}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingOtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating OTP...</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4" />
                          <span>Mark as Delivered</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RoleBasedOrderList;