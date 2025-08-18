import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  categoryId?: string | { _id: string; name: string }
  brand?: string
  brandId?: string | { _id: string; name: string }
  locationName?: string // Product location in warehouse
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
  assignedDeliveryBoy?: {
    id: string
    name: string
    phone: string
  }
}

export const generateWarehousePickingInvoice = async (order: Order): Promise<void> => {
  const doc = new jsPDF()
  
  // Set up colors
  const primaryColor = [41, 128, 185] // Blue
  const secondaryColor = [52, 73, 94] // Dark gray
  const accentColor = [231, 76, 60] // Red
  
  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('WAREHOUSE PICKING LIST', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('For Delivery Boy Collection', 105, 30, { align: 'center' })
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
  
  let yPosition = 50
  
  // Order Information Section
  doc.setFillColor(240, 240, 240)
  doc.rect(10, yPosition, 190, 8, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDER INFORMATION', 15, yPosition + 6)
  
  yPosition += 15
  
  // Order details in two columns
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Left column
  doc.setFont('helvetica', 'bold')
  doc.text('Order ID:', 15, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(order.orderId, 45, yPosition)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Status:', 15, yPosition + 8)
  doc.setFont('helvetica', 'normal')
  doc.text(order.status.toUpperCase(), 45, yPosition + 8)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Date:', 15, yPosition + 16)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(order.createdAt).toLocaleDateString('en-IN'), 45, yPosition + 16)
  
  // Right column
  doc.setFont('helvetica', 'bold')
  doc.text('Warehouse:', 110, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(order.warehouseInfo.warehouseName, 140, yPosition)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Payment:', 110, yPosition + 8)
  doc.setFont('helvetica', 'normal')
  doc.text(order.paymentInfo.method === 'cod' ? 'Cash on Delivery' : 'Online Payment', 140, yPosition + 8)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Total Amount:', 110, yPosition + 16)
  doc.setFont('helvetica', 'normal')
  doc.text(`₹${Math.ceil(order.pricing.total)}`, 140, yPosition + 16)
  
  yPosition += 30
  
  // Customer & Delivery Information
  doc.setFillColor(240, 240, 240)
  doc.rect(10, yPosition, 190, 8, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CUSTOMER & DELIVERY INFORMATION', 15, yPosition + 6)
  
  yPosition += 15
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Customer:', 15, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(`${order.customerInfo.name} | ${order.customerInfo.phone}`, 45, yPosition)
  
  yPosition += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Delivery Address:', 15, yPosition)
  doc.setFont('helvetica', 'normal')
  
  const address = order.deliveryInfo.address
  const fullAddress = [
    address.building,
    address.area,
    `${address.city}, ${address.state} - ${address.pincode}`,
    address.landmark ? `Near ${address.landmark}` : ''
  ].filter(Boolean).join(', ')
  
  // Split long address into multiple lines
  const addressLines = doc.splitTextToSize(fullAddress, 140)
  doc.text(addressLines, 55, yPosition)
  
  yPosition += addressLines.length * 5 + 10
  
  // Delivery Boy Information (if assigned)
  if (order.assignedDeliveryBoy) {
    doc.setFont('helvetica', 'bold')
    doc.text('Assigned Delivery Boy:', 15, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`${order.assignedDeliveryBoy.name} | ${order.assignedDeliveryBoy.phone}`, 70, yPosition)
    yPosition += 15
  }
  
  // Items Section Header
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2])
  doc.rect(10, yPosition, 190, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ITEMS TO COLLECT', 15, yPosition + 6)
  doc.setTextColor(0, 0, 0)
  
  yPosition += 15
  
  // Items table
  const tableColumns = [
    { header: '#', dataKey: 'sno' },
    { header: 'Product Name', dataKey: 'name' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Location', dataKey: 'location' },
    { header: 'Brand', dataKey: 'brand' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Price', dataKey: 'price' }
  ]
  
  const tableData = order.items.map((item, index) => ({
    sno: (index + 1).toString(),
    name: item.name,
    quantity: item.quantity.toString(),
    location: item.locationName || 'Not Specified',
    brand: typeof item.brandId === 'object' ? item.brandId.name : (item.brand || 'N/A'),
    category: typeof item.categoryId === 'object' ? item.categoryId.name : (item.category || 'N/A'),
    price: `₹${(item.price * item.quantity).toFixed(2)}`
  }))
  
  // Add table using autoTable plugin
  try {
    autoTable(doc, {
    startY: yPosition,
    head: [tableColumns.map(col => col.header)],
    body: tableData.map(row => tableColumns.map(col => row[col.dataKey as keyof typeof row])),
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' }, // S.No
      1: { cellWidth: 60 }, // Product Name
      2: { cellWidth: 20, halign: 'center' }, // Quantity
      3: { cellWidth: 35, halign: 'center' }, // Location
      4: { cellWidth: 25 }, // Brand
      5: { cellWidth: 25 }, // Category
      6: { cellWidth: 25, halign: 'right' } // Price
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249]
    },
    margin: { left: 10, right: 10 }
  })
    
    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50
    yPosition = finalY
  } catch (tableError) {
    console.error('Error creating table, falling back to simple list:', tableError)
    // Fallback to simple list format if autoTable fails
    doc.setFontSize(10)
    order.items.forEach((item, index) => {
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${item.name}`, 15, yPosition)
      yPosition += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Quantity: ${item.quantity}`, 20, yPosition)
      doc.text(`Price: ₹${(item.price * item.quantity).toFixed(2)}`, 80, yPosition)
      
      if (item.locationName) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 255)
        doc.text(`Location: ${item.locationName}`, 140, yPosition)
        doc.setTextColor(0, 0, 0)
      }
      
      yPosition += 10
    })
  }
  
  // Summary section
  const summaryY = yPosition + 15
  
  // Summary box
  doc.setFillColor(240, 240, 240)
  doc.rect(120, summaryY, 80, 35, 'F')
  doc.rect(120, summaryY, 80, 35, 'S')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDER SUMMARY', 125, summaryY + 8)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Items: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}`, 125, summaryY + 18)
  doc.text(`Subtotal: ₹${order.pricing.subtotal.toFixed(2)}`, 125, summaryY + 25)
  
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Amount: ₹${Math.ceil(order.pricing.total)}`, 125, summaryY + 32)
  
  // Instructions section
  const instructionsY = summaryY + 45
  
  doc.setFillColor(255, 248, 220) // Light yellow
  doc.rect(10, instructionsY, 190, 25, 'F')
  doc.rect(10, instructionsY, 190, 25, 'S')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('COLLECTION INSTRUCTIONS', 15, instructionsY + 8)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('1. Verify all items are collected as per the quantity mentioned', 15, instructionsY + 15)
  doc.text('2. Check product locations carefully to ensure correct items', 15, instructionsY + 20)
  doc.text('3. Contact warehouse manager if any item is not found at specified location', 15, instructionsY + 25)
  doc.text('4. Ensure proper packaging before handover to delivery boy', 15, instructionsY + 30)
  
  // Footer
  const footerY = instructionsY + 40
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 15, footerY)
  doc.text('This is a computer-generated document for internal warehouse use only.', 105, footerY, { align: 'center' })
  
  // Save the PDF
  doc.save(`Warehouse_Picking_List_${order.orderId}.pdf`)
}