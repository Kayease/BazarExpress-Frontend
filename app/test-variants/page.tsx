'use client'

import { useState } from 'react'
import StockTransferModal from '@/components/StockTransferModal'

export default function TestVariantsPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Variant Products in Stock Transfer</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Stock Transfer Modal Test</h2>
          <p className="text-gray-600 mb-6">
            This page allows you to test the variant product functionality in the stock transfer modal.
            The modal has been updated to handle products with variants by showing expandable rows
            with individual quantity controls for each variant.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Features Implemented:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Products with variants show a chevron down arrow to expand variant options</li>
              <li>Each variant has its own quantity controls (+ / - buttons and input field)</li>
              <li>The main product shows total selected quantity across all variants</li>
              <li>Variant information includes name, SKU, price, and stock availability</li>
              <li>Stock validation prevents selecting more than available stock for each variant</li>
              <li>Updated StockTransferReportModal and StockTransferDetailsModal to display variant information</li>
            </ul>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Open Stock Transfer Modal
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Test Data Created:</h4>
            <p className="text-blue-800 text-sm">
              A test product "Test T-Shirt with Variants" has been created with the following variants:
            </p>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>• Small Blue (₹299) - 10 units</li>
              <li>• Small Red (₹299) - 8 units</li>
              <li>• Medium Blue (₹319) - 15 units</li>
              <li>• Medium Red (₹319) - 12 units</li>
              <li>• Large Green (₹339) - 20 units</li>
              <li>• Extra Large Blue (₹359) - 5 units</li>
            </ul>
          </div>
        </div>
      </div>

      {showModal && (
        <StockTransferModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={async (transferData) => {
            console.log('Stock transfer data:', transferData)
            
            try {
              const response = await fetch('/api/stock-transfers', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(transferData)
              })
              
              if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create stock transfer')
              }
              
              const result = await response.json()
              console.log('Transfer result:', result)
              alert(`Transfer created successfully! ID: ${result._id}`)
            } catch (error) {
              console.error('Transfer error:', error)
              alert(`Transfer failed: ${error.message}`)
            }
          }}
        />
      )}
    </div>
  )
}