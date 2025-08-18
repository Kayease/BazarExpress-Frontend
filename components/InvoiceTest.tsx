"use client"

import { useState } from 'react'
import WarehousePickingModal from './WarehousePickingModal'

// Test component to verify invoice generation
export default function InvoiceTest() {
  const [showModal, setShowModal] = useState(false)
  const testOrder = {
    _id: "test123",
    orderId: "ORD-2024-001",
    status: "processing",
    createdAt: new Date().toISOString(),
    pricing: {
      total: 1250.50,
      subtotal: 1100.00,
      taxAmount: 150.50,
      discountAmount: 0,
      deliveryCharge: 0,
      codCharge: 0
    },
    items: [
      {
        productId: "prod1",
        name: "Organic Basmati Rice",
        variantName: "5kg Pack",
        price: 500,
        quantity: 2,
        locationName: "Aisle A, Shelf 3, Bin 2",
        brand: "Organic Valley",
        category: "Rice & Grains",
        brandId: { _id: "brand1", name: "Organic Valley" },
        categoryId: { _id: "cat1", name: "Rice & Grains" }
      },
      {
        productId: "prod2", 
        name: "Fresh Milk",
        variantName: "1L Bottle",
        price: 100,
        quantity: 1,
        locationName: "Aisle B, Shelf 1, Bin 5",
        brand: "Amul",
        category: "Dairy Products",
        brandId: { _id: "brand2", name: "Amul" },
        categoryId: { _id: "cat2", name: "Dairy Products" }
      },
      {
        productId: "prod3", 
        name: "Chocolate Cookies",
        price: 150,
        quantity: 3,
        locationName: "Aisle C, Shelf 2, Bin 1",
        brand: "Britannia",
        category: "Snacks",
        brandId: { _id: "brand3", name: "Britannia" },
        categoryId: { _id: "cat3", name: "Snacks" }
      }
    ],
    customerInfo: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+91 9876543210"
    },
    deliveryInfo: {
      address: {
        building: "123 Test Building",
        area: "Test Area",
        city: "Test City",
        state: "Test State",
        pincode: "123456",
        landmark: "Near Test Landmark"
      }
    },
    paymentInfo: {
      method: "cod" as const,
      paymentMethod: "cash",
      status: "pending"
    },
    warehouseInfo: {
      warehouseName: "Main Warehouse",
      warehouseId: "wh123"
    }
  }

  const handleTestInvoice = () => {
    setShowModal(true)
  }

  return (
    <div className="p-4">
      <button 
        onClick={handleTestInvoice}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Invoice Generation
      </button>

      {/* Warehouse Picking Modal */}
      {showModal && (
        <WarehousePickingModal
          order={testOrder}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}