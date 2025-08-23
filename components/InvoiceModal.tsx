'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoiceSettingsAPI, InvoiceSettingsData } from '@/lib/api/invoice-settings';
import { calculateProductTax } from '@/lib/tax-calculation';

// QR Code generation function with fallback
const generateQRCode = (text: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=png&ecc=M&data=${encodeURIComponent(text)}`;
};

interface InvoiceItem {
  name: string;
  price: number;
  mrp?: number;
  quantity: number;
  taxRate?: number;
  taxAmount?: number;
  hsnCode?: string;
  priceIncludesTax?: boolean;
  tax?: {
    _id?: string;
    id?: string;
    name: string;
    percentage: number;
    description?: string;
  };
  // Variant information
  variantId?: string;
  variantName?: string;
  selectedVariant?: any;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    orderDate: string;
    customerInfo: {
      name: string;
      email?: string;
      phone?: string;
    };
    deliveryAddress: {
      building: string;
      area: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
    };
    items: InvoiceItem[];
    pricing: {
      subtotal: number;
      taxAmount: number;
      deliveryCharge: number;
      codCharge?: number;
      discountAmount: number;
      total: number;
    };
    taxCalculation?: {
      isInterState: boolean;
      customerState: string;
      warehouseState: string;
      taxBreakdown: Array<{
        itemName: string;
        taxableAmount: number;
        taxRate: number;
        taxAmount: number;
        taxType: string;
      }>;
    };
    warehouseInfo?: {
      warehouseName: string;
      warehouseAddress: string;
    };
    promoCode?: {
      code: string;
      discountAmount: number;
      discountType: 'percentage' | 'fixed';
      discountValue?: number;
    };
  };
}

export default function InvoiceModal({ isOpen, onClose, orderData }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInvoiceSettings();
    }
  }, [isOpen]);

  const loadInvoiceSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await invoiceSettingsAPI.getSettings();
      setInvoiceSettings(settings);
    } catch (error: any) {
      setError('Failed to load invoice settings');
      console.error('Error loading invoice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-700">Loading invoice settings...</span>
        </div>
      </div>
    );
  }

  if (error || !invoiceSettings) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600">Error</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-700 mb-4">{error || 'Unable to load invoice settings'}</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={loadInvoiceSettings}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (invoiceRef.current) {
      try {
        setIsGeneratingPDF(true);

        if (!(window as any).html2pdf) {
          await loadHtml2PdfScript();
        }

        const html2pdf = (window as any).html2pdf;
        const element = invoiceRef.current;

        // Create a temporary wrapper for better centering
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 0;
          background: white;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        `;
        
        const clonedElement = element.cloneNode(true) as HTMLElement;
        clonedElement.style.cssText = `
          width: 100%;
          max-width: 794px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        `;
        
        wrapper.appendChild(clonedElement);
        document.body.appendChild(wrapper);

        const opt = {
          margin: [5, 5, 5, 5],
          filename: `Invoice-${orderData.orderId}.pdf`,
          image: { type: 'png', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            allowTaint: false,
            dpi: 192,
            width: 794,
            height: 1123,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            removeContainer: true
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            compress: true,
            precision: 16
          },
          pagebreak: {
            mode: ['avoid-all', 'css', 'legacy'],
            avoid: '.no-break'
          }
        };

        await html2pdf().set(opt).from(wrapper).save();
        
        // Clean up
        document.body.removeChild(wrapper);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again or contact support.');
      } finally {
        setIsGeneratingPDF(false);
      }
    }
  };

  const loadHtml2PdfScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load html2pdf.js'));
      document.head.appendChild(script);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatFinalTotal = (amount: number) => {
    return `₹${Math.ceil(amount)}`;
  };

  const calculateItemTax = (item: InvoiceItem) => {
    if (!item.tax || !item.tax.percentage) {
      return {
        basePrice: item.price * item.quantity,
        taxAmount: 0,
        totalAmount: item.price * item.quantity,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0
      };
    }

    const isInterState = orderData.taxCalculation?.isInterState || false;
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
      basePrice: taxResult.basePrice || 0,
      taxAmount: taxResult.taxAmount || 0,
      totalAmount: taxResult.totalPrice || 0,
      cgstRate: isInterState ? 0 : (item.tax.percentage || 0) / 2,
      sgstRate: isInterState ? 0 : (item.tax.percentage || 0) / 2,
      igstRate: isInterState ? (item.tax.percentage || 0) : 0,
      cgstAmount: taxResult.cgstAmount || 0,
      sgstAmount: taxResult.sgstAmount || 0,
      igstAmount: taxResult.igstAmount || 0
    };
  };

  const calculateOrderTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    orderData.items.forEach(item => {
      const itemTax = calculateItemTax(item);
      subtotal += itemTax.basePrice || 0;
      totalTax += itemTax.taxAmount || 0;
    });

    const deliveryCharge = orderData.pricing.deliveryCharge || 0;
    const codCharge = orderData.pricing.codCharge || 0;
    const discountAmount = orderData.pricing.discountAmount || 0;
    const promoCodeDiscount = orderData.promoCode?.discountAmount || 0;

    const totalDiscount = promoCodeDiscount > 0 ? promoCodeDiscount : discountAmount;
    const finalTotal = subtotal + totalTax - totalDiscount + deliveryCharge + codCharge;

    return {
      subtotal,
      totalTax,
      deliveryCharge,
      codCharge,
      discountAmount,
      totalDiscount,
      finalTotal
    };
  };

  const orderTotals = calculateOrderTotals();

  const convertToWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (num: number): string => {
      let result = '';
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      if (num > 0) {
        result += ones[num] + ' ';
      }
      return result;
    };

    if (amount === 0) return 'Zero Rupees Only';

    let rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = '';

    if (rupees >= 10000000) {
      result += convertHundreds(Math.floor(rupees / 10000000)) + 'Crore ';
      rupees %= 10000000;
    }
    if (rupees >= 100000) {
      result += convertHundreds(Math.floor(rupees / 100000)) + 'Lakh ';
      rupees %= 100000;
    }
    if (rupees >= 1000) {
      result += convertHundreds(Math.floor(rupees / 1000)) + 'Thousand ';
      rupees %= 1000;
    }
    if (rupees > 0) {
      result += convertHundreds(rupees);
    }

    result += 'Rupees';

    if (paise > 0) {
      result += ' And ' + convertHundreds(paise) + 'Paise';
    }

    return result.trim() + ' Only';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[999]">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header with actions */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 print:hidden">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tax Invoice</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              disabled={isGeneratingPDF}
              className="text-xs sm:text-sm"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
              <span className="sm:hidden">{isGeneratingPDF ? '...' : 'PDF'}</span>
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content - Modified container */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 print:p-0">
          <div
            ref={invoiceRef}
            className="bg-white mx-auto"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '8px',
              lineHeight: '1.2',
              width: '100%',
              maxWidth: '794px',
              margin: '0 auto',
              padding: '10px',
              boxSizing: 'border-box',
              minHeight: 'auto'
            }}
          >
            {/* Print-specific styles */}
            <style>
              {`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 10mm;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                  }
                  body * {
                    visibility: hidden;
                  }
                  #invoice-content, #invoice-content * {
                    visibility: visible;
                  }
                  #invoice-content {
                    position: absolute;
                    left: 50%;
                    top: 0;
                    transform: translateX(-50%);
                    width: 794px;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                  }
                  table {
                    width: 100% !important;
                    table-layout: fixed !important;
                  }
                  td, th {
                    padding: 3px !important;
                    font-size: 8px !important;
                    word-wrap: break-word !important;
                  }
                  .no-break {
                    page-break-inside: avoid;
                  }
                }
                
                /* Mobile responsive styles */
                @media (max-width: 768px) {
                  #invoice-content {
                    font-size: 6px !important;
                    padding: 5px !important;
                  }
                  #invoice-content table {
                    font-size: 6px !important;
                    table-layout: auto !important;
                  }
                  #invoice-content td, #invoice-content th {
                    padding: 2px !important;
                    font-size: 6px !important;
                    word-wrap: break-word !important;
                    white-space: normal !important;
                  }
                  #invoice-content .header-section {
                    flex-direction: column !important;
                    gap: 5px !important;
                  }
                  #invoice-content .business-customer-section {
                    flex-direction: column !important;
                    gap: 10px !important;
                  }
                  #invoice-content .qr-section {
                    width: 100% !important;
                    margin-top: 10px !important;
                  }
                  #invoice-content img {
                    max-width: 100% !important;
                    height: auto !important;
                  }
                  #invoice-content .logo-section img {
                    height: 30px !important;
                    width: auto !important;
                  }
                }
                
                /* PDF generation specific styles */
                .pdf-container {
                  display: flex;
                  justify-content: center;
                  align-items: flex-start;
                  width: 100%;
                  min-height: 100vh;
                  background: white;
                }
              `}
            </style>

            {/* Add an ID to the main invoice container for print styling */}
            <div id="invoice-content" className="pdf-container">
              <div style={{ width: '100%', maxWidth: '794px', margin: '0 auto' }}>
              {/* Header */}
              <div className="no-break" style={{ border: '2px solid #000', marginBottom: '10px' }}>
                <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #000' }}>
                  <div className="logo-section" style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src="/logo.svg"
                      alt={invoiceSettings.businessName}
                      style={{ height: '40px', width: 'auto', marginRight: '10px' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div>
                      <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0', color: '#000' }}>
                        {invoiceSettings.businessName}
                      </h1>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: '#000' }}>Tax Invoice</h2>
                  </div>
                </div>

                {/* Business and Customer Info */}
                <div className="business-customer-section" style={{ display: 'flex' }}>
                  <div style={{ flex: '1', padding: '10px', borderRight: '1px solid #000' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#000' }}>Sold By:</h3>
                    <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                      <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{invoiceSettings.businessName.toUpperCase()}</p>
                      <p style={{ margin: '2px 0' }}>{orderData.warehouseInfo?.warehouseAddress || 'Main Warehouse Address'}</p>
                      <p style={{ margin: '2px 0' }}><strong>GSTIN:</strong> {invoiceSettings.gstin}</p>
                      <p style={{ margin: '2px 0' }}><strong>FSSAI:</strong> {invoiceSettings.fssai}</p>
                      <p style={{ margin: '2px 0' }}><strong>PAN:</strong> {invoiceSettings.pan}</p>
                      <p style={{ margin: '2px 0' }}><strong>CIN:</strong> {invoiceSettings.cin}</p>
                    </div>
                  </div>

                  <div style={{ flex: '1', padding: '10px', borderRight: '1px solid #000' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#000' }}>Bill To:</h3>
                    <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                      <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{orderData.customerInfo.name}</p>
                      <p style={{ margin: '2px 0' }}>{orderData.deliveryAddress.building}, {orderData.deliveryAddress.area}</p>
                      <p style={{ margin: '2px 0' }}>{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} - {orderData.deliveryAddress.pincode}</p>
                      <p style={{ margin: '5px 0 2px 0' }}><strong>Order ID:</strong> {orderData.orderId}</p>
                      <p style={{ margin: '2px 0' }}><strong>Date:</strong> {formatDate(orderData.orderDate)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Place of Supply:</strong> {orderData.deliveryAddress.state}</p>
                    </div>
                  </div>

                  <div className="qr-section" style={{ width: '100px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '70px', height: '70px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                      <img
                        src={generateQRCode(orderData.orderId)}
                        alt="QR Code"
                        style={{ width: '68px', height: '68px', objectFit: 'contain' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div style="font-size: 7px; text-align: center; color: #666; word-wrap: break-word;">${orderData.orderId}</div>`;
                          }
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '8px', textAlign: 'center', margin: '3px 0 0 0' }}>Scan for invoice verification</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="no-break" style={{ marginBottom: '10px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000',
                  fontSize: '9px',
                  tableLayout: 'fixed'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ width: '3%', padding: '3px', textAlign: 'center' }}>Sr.</th>
                      <th style={{ width: '7%', padding: '3px', textAlign: 'left' }}>HSN</th>
                      <th style={{ width: '25%', padding: '3px', textAlign: 'left' }}>Item Description</th>
                      <th style={{ width: '5%', padding: '3px', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '8%', padding: '3px', textAlign: 'right' }}>MRP</th>
                      <th style={{ width: '8%', padding: '3px', textAlign: 'right' }}>Taxable</th>
                      <th style={{ width: '6%', padding: '3px', textAlign: 'right' }}>CGST%</th>
                      <th style={{ width: '6%', padding: '3px', textAlign: 'right' }}>CGST₹</th>
                      <th style={{ width: '6%', padding: '3px', textAlign: 'right' }}>SGST%</th>
                      <th style={{ width: '6%', padding: '3px', textAlign: 'right' }}>SGST₹</th>
                      <th style={{ width: '6%', padding: '3px', textAlign: 'right' }}>IGST%</th>
                      <th style={{ width: '6%', padding: '3px', textAlign: 'right' }}>IGST₹</th>
                      <th style={{ width: '8%', padding: '3px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.items.map((item, index) => {
                      const taxCalc = calculateItemTax(item);

                      return (
                        <tr key={`item-${index}`}>
                          <td style={{ padding: '3px', textAlign: 'center' }}>{index + 1}</td>
                          <td style={{ padding: '3px', textAlign: 'left', wordBreak: 'break-word' }}>{item.hsnCode || '-'}</td>
                          <td style={{ padding: '3px', textAlign: 'left', wordBreak: 'break-word' }}>
                            {item.name}
                            {item.variantName && <span style={{ fontSize: '8px', color: '#666', display: 'block' }}>({item.variantName})</span>}
                          </td>
                          <td style={{ padding: '3px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(item.mrp || item.price)}</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(taxCalc.basePrice || 0)}</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{(taxCalc.cgstRate || 0).toFixed(1)}%</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(taxCalc.cgstAmount || 0)}</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{(taxCalc.sgstRate || 0).toFixed(1)}%</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(taxCalc.sgstAmount || 0)}</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{(taxCalc.igstRate || 0).toFixed(1)}%</td>
                          <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(taxCalc.igstAmount || 0)}</td>
                          <td style={{ padding: '3px', textAlign: 'right', fontWeight: 'bold' }}>
                            {formatCurrency(
                              item.priceIncludesTax 
                                ? item.price * item.quantity 
                                : (item.price * item.quantity) + (taxCalc.taxAmount || 0)
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {orderData.pricing.deliveryCharge > 0 && (
                      <tr>
                        <td style={{ padding: '3px', textAlign: 'center' }}>{orderData.items.length + 1}</td>
                        <td style={{ padding: '3px', textAlign: 'left' }}>-</td>
                        <td style={{ padding: '3px', textAlign: 'left' }}>Delivery Charge</td>
                        <td style={{ padding: '3px', textAlign: 'center' }}>1</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(orderData.pricing.deliveryCharge)}</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(orderData.pricing.deliveryCharge)}</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(orderData.pricing.deliveryCharge)}</td>
                      </tr>
                    )}

                    {(orderData.pricing.codCharge || 0) > 0 && (
                      <tr>
                        <td style={{ padding: '3px', textAlign: 'center' }}>{orderData.items.length + (orderData.pricing.deliveryCharge > 0 ? 2 : 1)}</td>
                        <td style={{ padding: '3px', textAlign: 'left' }}>-</td>
                        <td style={{ padding: '3px', textAlign: 'left' }}>COD Charge</td>
                        <td style={{ padding: '3px', textAlign: 'center' }}>1</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(orderData.pricing.codCharge || 0)}</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(orderData.pricing.codCharge || 0)}</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(orderData.pricing.codCharge || 0)}</td>
                      </tr>
                    )}

                    {orderData.promoCode && orderData.promoCode.discountAmount > 0 && (
                      <tr>
                        <td style={{ padding: '3px', textAlign: 'center' }}>
                          {orderData.items.length +
                            (orderData.pricing.deliveryCharge > 0 ? 1 : 0) +
                            ((orderData.pricing.codCharge || 0) > 0 ? 1 : 0) + 1}
                        </td>
                        <td style={{ padding: '3px', textAlign: 'left' }}>-</td>
                        <td style={{ padding: '3px', textAlign: 'left' }}>Discount ({orderData.promoCode.code})</td>
                        <td style={{ padding: '3px', textAlign: 'center' }}>1</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>-{formatCurrency(orderData.promoCode.discountAmount)}</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>-{formatCurrency(orderData.promoCode.discountAmount)}</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>0%</td>
                        <td style={{ padding: '3px', textAlign: 'right' }}>₹0.00</td>
                        <td style={{ padding: '3px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>-{formatCurrency(orderData.promoCode.discountAmount)}</td>
                      </tr>
                    )}

                    <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                      <td style={{ padding: '3px', textAlign: 'center' }} colSpan={5}>Total</td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>
                        {formatCurrency(orderData.items.reduce((sum, item) => {
                          const taxCalc = calculateItemTax(item);
                          return sum + (taxCalc.basePrice || 0);
                        }, 0) + (orderData.pricing.deliveryCharge || 0) + (orderData.pricing.codCharge || 0) - (orderData.promoCode?.discountAmount || 0))}
                      </td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>
                        {formatCurrency(orderData.taxCalculation?.isInterState ? 0 : orderData.items.reduce((sum, item) => {
                          const taxCalc = calculateItemTax(item);
                          return sum + (taxCalc.cgstAmount || 0);
                        }, 0))}
                      </td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>
                        {formatCurrency(orderData.taxCalculation?.isInterState ? 0 : orderData.items.reduce((sum, item) => {
                          const taxCalc = calculateItemTax(item);
                          return sum + (taxCalc.sgstAmount || 0);
                        }, 0))}
                      </td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>
                        {formatCurrency(orderData.taxCalculation?.isInterState ? orderData.items.reduce((sum, item) => {
                          const taxCalc = calculateItemTax(item);
                          return sum + (taxCalc.igstAmount || 0);
                        }, 0) : 0)}
                      </td>
                      <td style={{ padding: '3px', textAlign: 'right' }}>{formatCurrency(orderTotals.finalTotal || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Billing Summary */}
              <div className="no-break" style={{ marginBottom: '10px', border: '1px solid #000' }}>
                <div style={{ backgroundColor: '#f0f0f0', padding: '5px', borderBottom: '1px solid #000' }}>
                  <h4 style={{ margin: '0', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Billing Summary</h4>
                </div>
                <div style={{ padding: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '2px 0', textAlign: 'left' }}>Subtotal (Before Tax):</td>
                        <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                          {formatCurrency((() => {
                            let subtotalBeforeTax = 0;
                            orderData.items.forEach(item => {
                              if (item.tax && item.tax.percentage) {
                                let basePricePerItem = 0;
                                if (item.priceIncludesTax) {
                                  const taxRate = item.tax.percentage / 100;
                                  basePricePerItem = item.price / (1 + taxRate);
                                } else {
                                  basePricePerItem = item.price;
                                }
                                const itemSubtotal = basePricePerItem * item.quantity;
                                subtotalBeforeTax += itemSubtotal;
                              } else {
                                const itemSellingPrice = item.price * item.quantity;
                                subtotalBeforeTax += itemSellingPrice;
                              }
                            });
                            return subtotalBeforeTax;
                          })())}
                        </td>
                      </tr>

                      {orderData.promoCode && orderData.promoCode.discountAmount > 0 && (
                        <tr>
                          <td style={{ padding: '2px 0', textAlign: 'left' }}>Promo Code Discount ({orderData.promoCode.code}):</td>
                          <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                            -{formatCurrency(orderData.promoCode.discountAmount)}
                          </td>
                        </tr>
                      )}

                      {orderTotals.totalTax > 0 && (
                        <>
                          {orderData.taxCalculation?.isInterState ? (
                            <tr>
                              <td style={{ padding: '2px 0', textAlign: 'left' }}>IGST:</td>
                              <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                                {formatCurrency(orderTotals.totalTax)}
                              </td>
                            </tr>
                          ) : (
                            <>
                              <tr>
                                <td style={{ padding: '2px 0', textAlign: 'left' }}>CGST:</td>
                                <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                                  {formatCurrency(orderTotals.totalTax / 2)}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '2px 0', textAlign: 'left' }}>SGST:</td>
                                <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                                  {formatCurrency(orderTotals.totalTax / 2)}
                                </td>
                              </tr>
                            </>
                          )}
                          <tr style={{ borderTop: '1px solid #ccc' }}>
                            <td style={{ padding: '3px 0 2px 0', textAlign: 'left', fontWeight: 'bold' }}>Total Tax:</td>
                            <td style={{ padding: '3px 0 2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                              {formatCurrency(orderTotals.totalTax)}
                            </td>
                          </tr>
                        </>
                      )}

                      <tr>
                        <td style={{ padding: '2px 0', textAlign: 'left' }}>Delivery Charges:</td>
                        <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold', color: orderTotals.deliveryCharge === 0 ? '#059669' : 'inherit' }}>
                          {orderTotals.deliveryCharge === 0 ? 'Free' : formatCurrency(orderTotals.deliveryCharge)}
                        </td>
                      </tr>

                      {orderTotals.codCharge > 0 && (
                        <tr>
                          <td style={{ padding: '2px 0', textAlign: 'left' }}>COD Charges:</td>
                          <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                            {formatCurrency(orderTotals.codCharge)}
                          </td>
                        </tr>
                      )}

                      {/* Final Total */}
                      <tr style={{ borderTop: '2px solid #000', backgroundColor: '#f9f9f9' }}>
                        <td style={{ padding: '6px 0', textAlign: 'left', fontSize: '13px', fontWeight: 'bold' }}>Total Amount:</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                          {formatFinalTotal(orderTotals.finalTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="no-break" style={{ marginBottom: '8px', border: '1px solid #000', padding: '8px', backgroundColor: '#f9f9f9', pageBreakInside: 'avoid' }}>
                <p style={{ margin: '0', fontSize: '11px', fontWeight: 'bold' }}>
                  Amount in Words: {convertToWords(Math.ceil(orderTotals.finalTotal || 0))}
                </p>
              </div>



                             {/* Footer - Terms & Conditions and Signature */}
               <div className="no-break" style={{ marginTop: '10px', pageBreakInside: 'avoid' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '25px' }}>
                   <div style={{ fontSize: '9px', color: '#666', flex: '1', maxWidth: '60%' }}>
                     <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Terms & Conditions:</p>
                     <p style={{ margin: '1px 0' }}>• This is a computer generated invoice and does not require physical signature.</p>
                     <p style={{ margin: '1px 0' }}>• Please check all items at the time of delivery and report any discrepancies immediately.</p>
                     <p style={{ margin: '1px 0' }}>• Return policy as per company terms and conditions.</p>
                     <p style={{ margin: '1px 0' }}>• For any queries, please contact customer support through website or mobile app.</p>
                   </div>
                   <div style={{ textAlign: 'center', flexShrink: 0, width: '70px' }}>
                     {/* Signature Image */}
                     <div style={{ marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <div style={{ width: '35px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', border: '1px dashed #ccc' }}>
                         <img
                           src="/sign.jpg"
                           alt="Authorized Signature"
                           style={{
                             height: '10px',
                             width: 'auto',
                             maxWidth: '33px',
                             objectFit: 'contain',
                             display: 'block'
                           }}
                           onError={(e) => {
                             const target = e.target as HTMLImageElement;
                             target.style.display = 'none';
                             const parent = target.parentElement;
                             if (parent) {
                               parent.innerHTML = '<div style="font-size: 6px; color: #999; text-align: center;">Digital Signature</div>';
                             }
                           }}
                         />
                       </div>
                     </div>
                     <div style={{ borderTop: '1px solid #000', paddingTop: '1px' }}>
                       <p style={{ margin: '0', fontSize: '7px', fontWeight: 'bold' }}>Authorized Signatory</p>
                       <p style={{ margin: '1px 0 0 0', fontSize: '5px' }}>for {invoiceSettings.businessName}</p>
                     </div>
                   </div>
                 </div>
               </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

