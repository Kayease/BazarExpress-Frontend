"use client"

import InvoiceTest from '../../components/InvoiceTest'

export default function TestInvoicePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Invoice Generation Test</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Warehouse Picking List Generation</h2>
          <p className="text-gray-600 mb-6">
            Click the button below to test the warehouse picking list PDF generation functionality.
          </p>
          <InvoiceTest />
        </div>
      </div>
    </div>
  )
}