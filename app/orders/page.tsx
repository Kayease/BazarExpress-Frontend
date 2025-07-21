'use client'

import React, { useState } from 'react'
import { User } from '@/lib/auth'
import Link from 'next/link'
import { FaShippingFast, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa'

interface Order {
  id: string
  date: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: {
    id: string
    name: string
    quantity: number
    price: number
    image: string
  }[]
}

// Mock data - Replace with actual API call
const mockOrders: Order[] = [
  {
    id: '#ORD-2023-001',
    date: '2023-07-10',
    status: 'delivered',
    total: 299.99,
    items: [
      {
        id: '1',
        name: 'Premium Product',
        quantity: 2,
        price: 149.99,
        image: '/placeholder.jpg'
      }
    ]
  },
  {
    id: '#ORD-2023-002',
    date: '2023-07-11',
    status: 'processing',
    total: 199.99,
    items: [
      {
        id: '2',
        name: 'Another Product',
        quantity: 1,
        price: 199.99,
        image: '/placeholder.jpg'
      }
    ]
  }
]

function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-800" />
      case 'processing':
        return <FaShippingFast className="text-blue-800" />
      case 'shipped':
        return <FaShippingFast className="text-purple-800" />
      case 'delivered':
        return <FaCheckCircle className="text-green-800" />
      case 'cancelled':
        return <FaTimesCircle className="text-red-800" />
      default:
        return null
    }
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
            <p className="text-gray-600">{mockOrders.length}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Total Spending</h2>
            <p className="text-gray-600">${mockOrders.reduce((acc, order) => acc + order.total, 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {mockOrders.map((order) => (
              <li key={order.id}>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full block hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <p className="ml-2 text-sm font-medium text-indigo-600 truncate">
                          {order.id}
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
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Ordered on {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Order Details - {selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order Status</dt>
                    <dd className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(selectedOrder.date).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500">Items</h4>
                  <ul role="list" className="mt-3 divide-y divide-gray-200">
                    {selectedOrder.items.map((item) => (
                      <li key={item.id} className="py-4 flex">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 rounded-md object-cover"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                            <p className="text-sm font-medium text-gray-900">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${selectedOrder.total.toFixed(2)}
                  </dd>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage