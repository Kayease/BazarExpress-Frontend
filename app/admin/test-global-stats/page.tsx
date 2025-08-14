"use client";

import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useAdminStatsRefresh } from '../../../lib/hooks/useAdminStatsRefresh';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function TestGlobalStats() {
  const [data, setData] = useState({ users: 10, orders: 25, products: 50 });

  const fetchData = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(prev => ({
      users: prev.users + Math.floor(Math.random() * 5),
      orders: prev.orders + Math.floor(Math.random() * 10),
      products: prev.products + Math.floor(Math.random() * 15)
    }));
  };

  const { isRefreshing } = useAdminStatsRefresh({
    onRefresh: fetchData,
    debounceMs: 300,
    enabled: true
  });

  const triggerSuccessToast = () => {
    toast.success('Operation completed successfully!');
  };

  const triggerUpdateToast = () => {
    toast.success('Data updated successfully!');
  };

  const triggerDeleteToast = () => {
    toast.success('Item deleted successfully!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Global Stats Refresh Test</h2>
          <p className="text-gray-600">Test the global stats refresh system</p>
        </div>

        {/* Stats Cards */}
        <div className="relative">
          {isRefreshing && (
            <div className="absolute top-2 right-2 z-10">
              <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating stats...</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Users</p>
                <p className="text-3xl font-bold text-blue-600">{data.users}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="text-3xl font-bold text-green-600">{data.orders}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-3xl font-bold text-purple-600">{data.products}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">Test Global Stats Refresh</h3>
          <div className="flex gap-4">
            <button
              onClick={triggerSuccessToast}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Trigger Success Toast
            </button>
            <button
              onClick={triggerUpdateToast}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Trigger Update Toast
            </button>
            <button
              onClick={triggerDeleteToast}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Trigger Delete Toast
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Manual Refresh
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Click any of the toast buttons above. The stats should automatically refresh after the toast appears!
          </p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Global Toast Interceptor:</span>
              <span className="text-green-600 font-semibold">✅ Active</span>
            </div>
            <div className="flex justify-between">
              <span>Stats Refresh Hook:</span>
              <span className="text-green-600 font-semibold">✅ Connected</span>
            </div>
            <div className="flex justify-between">
              <span>Currently Refreshing:</span>
              <span className={isRefreshing ? "text-blue-600 font-semibold" : "text-gray-600"}>
                {isRefreshing ? "🔄 Yes" : "⏸️ No"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}