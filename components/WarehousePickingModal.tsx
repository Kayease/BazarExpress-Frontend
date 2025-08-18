"use client"

import { useState } from "react"
import { X, Download, Printer } from "lucide-react"
import { jsPDF } from 'jspdf'

interface OrderItem {
  productId: string | {
    _id: string
    name: string
    price: number
    image?: string
    category?: string | { _id: string; name: string }
    brand?: string | { _id: string; name: string }
    locationName?: string
    variantName?: string
  }
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  categoryId?: string | { _id: string; name: string }
  brand?: string
  brandId?: string | { _id: string; name: string }
  locationName?: string
  variantName?: string
  location?: string
  // Variant information
  variantId?: string
  selectedVariant?: any
}

interface Order {
  _id: string
  orderId: string
  status: string
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
    warehouseId: string
  }
}

interface WarehousePickingModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

export default function WarehousePickingModal({ order, isOpen, onClose }: WarehousePickingModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const generateReceiptPDF = async (shouldDownload = true) => {
    setIsGenerating(true);
    try {
      // Start with standard 80mm width and sufficient height
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200], // Fixed height that will be adjusted later
      });

      let yPos = 10;
      const pageWidth = 80;
      const margin = 5;
      const innerMargin = margin + 2;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('WAREHOUSE PICKING LIST', pageWidth / 2, yPos, {
        align: 'center',
      });
      yPos += 8;

      // Order Info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER DETAILS:', margin, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`Order ID: ${order.orderId}`, innerMargin, yPos);
      yPos += 4;
      doc.text(`Customer: ${order.customerInfo.name}`, innerMargin, yPos);
      yPos += 4;
      doc.text(`Phone: ${order.customerInfo.phone}`, innerMargin, yPos);
      yPos += 4;
      doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`,
        innerMargin,
        yPos,
      );
      yPos += 8;

      // Items Header with divider
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ITEMS TO COLLECT:', margin, yPos);
      yPos += 5;

      // Divider line
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Items List
      order.items.forEach((item, index) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        // Enhanced variant name extraction
        let variantName = null
        if (item.variantName) {
          variantName = item.variantName
        } else if (item.selectedVariant?.name) {
          variantName = item.selectedVariant.name
        } else if (typeof item.selectedVariant === 'string') {
          variantName = item.selectedVariant
        } else if (typeof item.productId === 'object' && item.productId.variantName) {
          variantName = (item.productId as any).variantName
        } else if (item.variantId && typeof item.productId === 'object' && (item.productId as any).variants) {
          const variant = (item.productId as any).variants.find((v: any) => v._id === item.variantId || v.id === item.variantId)
          if (variant?.name) {
            variantName = variant.name
          }
        } else if (item.name && item.name.includes('(') && item.name.includes(')')) {
          const match = item.name.match(/\(([^)]+)\)/)
          if (match && match[1]) {
            variantName = match[1]
          }
        }
        
        const variantText = variantName ? ` (${variantName})` : '';
        doc.text(`${index + 1}. ${item.name}${variantText} - Qty: ${item.quantity}`, margin, yPos);
        yPos += 5;

                // Product details
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Enhanced brand name extraction
        let brandName = 'N/A'
        if (typeof item.brandId === 'object' && item.brandId?.name) {
          brandName = item.brandId.name
        } else if (typeof item.productId === 'object' && item.productId?.brand) {
          brandName = typeof item.productId.brand === 'object' ? item.productId.brand.name : item.productId.brand
        } else if (typeof item.brand === 'string') {
          brandName = item.brand
        }

        // Enhanced category name extraction
        let categoryName = 'N/A'
        if (typeof item.categoryId === 'object' && item.categoryId?.name) {
          categoryName = item.categoryId.name
        } else if (typeof item.productId === 'object' && item.productId?.category) {
          categoryName = typeof item.productId.category === 'object' ? item.productId.category.name : item.productId.category
        } else if (typeof item.category === 'string') {
          categoryName = item.category
        }

        // Enhanced location name extraction
        let locationName = 'Location not specified'
        if (typeof item.productId === 'object' && item.productId?.locationName) {
          locationName = item.productId.locationName
        } else if (item.locationName) {
          locationName = item.locationName
        } else if (item.location) {
          locationName = item.location
        }

        doc.text(`Brand: ${brandName}`, innerMargin, yPos);
        yPos += 4;
        doc.text(`Category: ${categoryName}`, innerMargin, yPos);
        yPos += 4;
        
        // Make location bold for better visibility
        doc.setFont('helvetica', 'bold');
        doc.text(`Location: ${locationName}`, innerMargin, yPos);
        doc.setFont('helvetica', 'normal'); // Reset to normal font
        yPos += 5;

        // Add small space between items
        if (index < order.items.length - 1) {
          yPos += 2;
        }
      });

      // Divider line
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Instructions section
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('COLLECTION INSTRUCTIONS:', margin, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      const instructions = [
        'Verify all items and quantities',
        'Check product locations carefully',
        'Contact manager if item not found',
        'Ensure proper packaging',
        'Mark items as collected',
      ];

      instructions.forEach(instruction => {
        doc.text(`• ${instruction}`, innerMargin, yPos);
        yPos += 4;
      });

      // Footer
      yPos += 5;
      doc.setFontSize(7);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, yPos);

      // Remove the auto height adjustment that was causing the error
      // Just use the standard page size we started with

      if (shouldDownload) {
        doc.save(`Warehouse_Picking_List_${order.orderId}.pdf`);
      } else {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    generateReceiptPDF(false)
    onClose()
  }

  const handleDownload = () => {
    generateReceiptPDF(true)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Warehouse Picking List</h3>
              <p className="text-white/80">#{order.orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Generate Picking List
            </h4>
            <p className="text-gray-600 text-sm">
              Choose how you want to get the warehouse picking list for order #{order.orderId}
            </p>
          </div>

          {/* Order Preview Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Customer:</span>
                <p className="font-medium">{order.customerInfo.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Items:</span>
                <p className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
              </div>
              <div>
                <span className="text-gray-600">Warehouse:</span>
                <p className="font-medium">{order.warehouseInfo.warehouseName}</p>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <p className="font-medium">₹{Math.ceil(order.pricing.total)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Picking List
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            The picking list will be formatted for thermal receipt printers (80mm width)
          </div>
        </div>
      </div>
    </div>
  )
}