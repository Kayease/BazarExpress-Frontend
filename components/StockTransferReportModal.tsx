'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoiceSettingsAPI, InvoiceSettingsData } from '@/lib/api/invoice-settings';

// QR Code generation function with fallback
const generateQRCode = (text: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=png&ecc=M&data=${encodeURIComponent(text)}`;
};

interface StockTransferItem {
  _id: string;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface Warehouse {
  _id: string;
  name: string;
  address: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  contactPhone: string;
  email: string;
  capacity: number;
  status: 'active' | 'inactive';
}

interface StockTransfer {
  _id: string;
  transferId: string;
  fromWarehouse: string;
  toWarehouse: string;
  fromWarehouseDetails?: Warehouse;
  toWarehouseDetails?: Warehouse;
  items: StockTransferItem[];
  totalItems: number;
  totalValue: number;
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

interface StockTransferReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferData: StockTransfer;
}

export default function StockTransferReportModal({ 
  isOpen, 
  onClose, 
  transferData
}: StockTransferReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadInvoiceSettings();
    }
  }, [isOpen]);

  const loadInvoiceSettings = async () => {
    try {
      setLoading(true);
      const settings = await invoiceSettingsAPI.getSettings();
      setInvoiceSettings(settings);
    } catch (error: any) {
      console.error('Error loading invoice settings:', error);
      // Set default settings if API fails
      setInvoiceSettings({
        businessName: 'Bazar Company',
        formerlyKnownAs: '',
        gstin: '22AAAAA0000A1Z5',
        fssai: '',
        cin: '',
        pan: '',
        termsAndConditions: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
        <div className="bg-white rounded-xl p-8 flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-700">Loading company settings...</span>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (reportRef.current) {
      try {
        setIsGeneratingPDF(true);

        if (!(window as any).html2pdf) {
          await loadHtml2PdfScript();
        }

        const html2pdf = (window as any).html2pdf;
        const element = reportRef.current;

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
          filename: `Stock-Transfer-Report-${transferData.transferId}.pdf`,
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // green
      case 'in-transit':
        return '#3B82F6'; // blue
      case 'pending':
        return '#F59E0B'; // yellow
      case 'cancelled':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header with actions */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 print:hidden">
          <h2 className="text-xl font-semibold text-gray-900">Stock Transfer Report</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-auto p-4 print:p-0">
          <div
            ref={reportRef}
            className="bg-white mx-auto"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '10px',
              lineHeight: '1.3',
              width: '794px', // A4 width in pixels at 96dpi
              maxWidth: '100%',
              margin: '0 auto',
              padding: '30px',
              boxSizing: 'border-box',
              minHeight: '1123px' // A4 height in pixels
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
                  #report-content, #report-content * {
                    visibility: visible;
                  }
                  #report-content {
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

            <div id="report-content" className="pdf-container">
              <div style={{ width: '100%', maxWidth: '794px', margin: '0 auto' }}>
              {/* Header Section */}
              <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div style={{ flex: '1', maxWidth: '60%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <img 
                        src="/logo.png" 
                        alt="Company Logo" 
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          marginRight: '12px',
                          objectFit: 'contain'
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                          {invoiceSettings?.businessName || 'Bazar Company'}
                        </div>
                        {invoiceSettings?.formerlyKnownAs && (
                          <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '4px' }}>
                            (Formerly known as: {invoiceSettings.formerlyKnownAs})
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                  <div style={{ textAlign: 'right', flex: '0 0 auto', maxWidth: '35%' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                      STOCK TRANSFER REPORT
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Transfer ID: <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{transferData.transferId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transfer Information */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', gap: '15px' }}>
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>
                      FROM WAREHOUSE
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '3px' }}>
                        {transferData.fromWarehouse}
                      </div>
                      {transferData.fromWarehouseDetails?.address && (
                        <div style={{ color: '#6b7280', fontSize: '9px', lineHeight: '1.3', marginBottom: '2px' }}>
                          {transferData.fromWarehouseDetails.address}
                        </div>
                      )}
                      {transferData.fromWarehouseDetails?.contactPhone && (
                        <div style={{ color: '#6b7280', fontSize: '9px', marginBottom: '1px' }}>
                          Phone: {transferData.fromWarehouseDetails.contactPhone}
                        </div>
                      )}
                      {transferData.fromWarehouseDetails?.email && (
                        <div style={{ color: '#6b7280', fontSize: '9px' }}>
                          Email: {transferData.fromWarehouseDetails.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>
                      TO WAREHOUSE
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '3px' }}>
                        {transferData.toWarehouse}
                      </div>
                      {transferData.toWarehouseDetails?.address && (
                        <div style={{ color: '#6b7280', fontSize: '9px', lineHeight: '1.3', marginBottom: '2px' }}>
                          {transferData.toWarehouseDetails.address}
                        </div>
                      )}
                      {transferData.toWarehouseDetails?.contactPhone && (
                        <div style={{ color: '#6b7280', fontSize: '9px', marginBottom: '1px' }}>
                          Phone: {transferData.toWarehouseDetails.contactPhone}
                        </div>
                      )}
                      {transferData.toWarehouseDetails?.email && (
                        <div style={{ color: '#6b7280', fontSize: '9px' }}>
                          Email: {transferData.toWarehouseDetails.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transfer Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong>Created Date:</strong> {formatDateTime(transferData.createdAt)}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span style={{ 
                      color: getStatusColor(transferData.status), 
                      fontWeight: 'bold',
                      marginLeft: '5px'
                    }}>
                      {getStatusText(transferData.status)}
                    </span>
                  </div>
                  {transferData.completedAt && (
                    <div>
                      <strong>Completed Date:</strong> {formatDateTime(transferData.completedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                  TRANSFER ITEMS
                </div>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  border: '1px solid #e5e7eb',
                  tableLayout: 'fixed'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ 
                        padding: '6px', 
                        textAlign: 'left', 
                        fontSize: '8px', 
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        width: '8%'
                      }}>
                        S.No.
                      </th>
                      <th style={{ 
                        padding: '6px', 
                        textAlign: 'left', 
                        fontSize: '8px', 
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        width: '35%'
                      }}>
                        Product Name
                      </th>
                      <th style={{ 
                        padding: '6px', 
                        textAlign: 'center', 
                        fontSize: '8px', 
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        width: '15%'
                      }}>
                        SKU
                      </th>
                      <th style={{ 
                        padding: '6px', 
                        textAlign: 'center', 
                        fontSize: '8px', 
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        width: '12%'
                      }}>
                        Quantity
                      </th>
                      <th style={{ 
                        padding: '6px', 
                        textAlign: 'right', 
                        fontSize: '8px', 
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        width: '15%'
                      }}>
                        Unit Price
                      </th>
                      <th style={{ 
                        padding: '6px', 
                        textAlign: 'right', 
                        fontSize: '8px', 
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        width: '15%'
                      }}>
                        Total Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferData.items.map((item, index) => (
                      <tr key={item._id}>
                        <td style={{ 
                          padding: '6px', 
                          fontSize: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {index + 1}
                        </td>
                        <td style={{ 
                          padding: '6px', 
                          fontSize: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                        </td>
                        <td style={{ 
                          padding: '6px', 
                          textAlign: 'center', 
                          fontSize: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {item.sku}
                        </td>
                        <td style={{ 
                          padding: '6px', 
                          textAlign: 'center', 
                          fontSize: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {item.quantity}
                        </td>
                        <td style={{ 
                          padding: '6px', 
                          textAlign: 'right', 
                          fontSize: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td style={{ 
                          padding: '6px', 
                          textAlign: 'right', 
                          fontSize: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '250px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ 
                            padding: '4px 8px', 
                            fontSize: '9px', 
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb'
                          }}>
                            Total Items:
                          </td>
                          <td style={{ 
                            padding: '4px 8px', 
                            fontSize: '9px', 
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #e5e7eb'
                          }}>
                            {transferData.totalItems}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ 
                            padding: '4px 8px', 
                            fontSize: '10px', 
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb'
                          }}>
                            Total Value:
                          </td>
                          <td style={{ 
                            padding: '4px 8px', 
                            fontSize: '10px', 
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #e5e7eb',
                            color: '#059669'
                          }}>
                            {formatCurrency(transferData.totalValue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {transferData.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>
                    NOTES
                  </div>
                  <div style={{ 
                    padding: '8px', 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '4px',
                    fontSize: '9px',
                    color: '#374151'
                  }}>
                    {transferData.notes}
                  </div>
                </div>
              )}

              {/* QR Code and Footer */}
              <div style={{ 
                marginTop: '25px', 
                paddingTop: '12px', 
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div>
                  <img 
                    src={generateQRCode(`Transfer ID: ${transferData.transferId}`)} 
                    alt="QR Code" 
                    style={{ width: '60px', height: '60px' }}
                  />
                  <div style={{ fontSize: '7px', color: '#6b7280', textAlign: 'center', marginTop: '3px' }}>
                    Transfer QR Code
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '7px', color: '#6b7280', maxWidth: '60%' }}>
                  <div>Generated on: {formatDateTime(new Date().toISOString())}</div>
                  <div style={{ marginTop: '3px' }}>
                    This is a computer-generated report and does not require a signature.
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