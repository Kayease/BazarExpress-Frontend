"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import AdminLayout from "../../../components/AdminLayout";
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth';
import { Settings, Save, Eye, Receipt, Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceSettings from '@/components/InvoiceSettings';
import InvoiceModal from '@/components/InvoiceModal';
import { invoiceSettingsAPI, InvoiceSettingsData } from '@/lib/api/invoice-settings';
import toast from 'react-hot-toast';

// Sample order data for preview
const sampleOrderData = {
  orderId: 'ORD-2024-001',
  orderDate: new Date().toISOString(),
  customerInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 9876543210'
  },
  deliveryAddress: {
    building: '123 Sample Building',
    area: 'Sample Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    landmark: 'Near Sample Mall'
  },
  items: [
    {
      name: 'Sample Product 1',
      price: 100,
      quantity: 2,
      taxRate: 18,
      taxAmount: 36,
      hsnCode: '1234'
    },
    {
      name: 'Sample Product 2',
      price: 200,
      quantity: 1,
      taxRate: 12,
      taxAmount: 24,
      hsnCode: '5678'
    }
  ],
  pricing: {
    subtotal: 400,
    taxAmount: 60,
    deliveryCharge: 30,
    codCharge: 0,
    discountAmount: 0,
    total: 490
  },
  taxCalculation: {
    isInterState: false,
    customerState: 'Maharashtra',
    warehouseState: 'Maharashtra',
    taxBreakdown: [
      {
        itemName: 'Sample Product 1',
        taxableAmount: 200,
        taxRate: 18,
        taxAmount: 36,
        taxType: 'CGST+SGST'
      },
      {
        itemName: 'Sample Product 2',
        taxableAmount: 200,
        taxRate: 12,
        taxAmount: 24,
        taxType: 'CGST+SGST'
      }
    ]
  },
  warehouseInfo: {
    warehouseName: 'Main Warehouse',
    warehouseAddress: 'Sample Warehouse Address, City, State - 123456'
  }
};

export default function InvoiceSettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<InvoiceSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'invoice-settings')) {
      router.push("/")
      return
    }
    
    loadInvoiceSettings();
  }, [user, router]);

  const loadInvoiceSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await invoiceSettingsAPI.getSettings();
      setCurrentSettings(settings);
    } catch (error: any) {
      setError('Failed to load invoice settings');
      console.error('Error loading invoice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (settings: InvoiceSettingsData) => {
    setCurrentSettings(settings);
    setShowSettings(false);
    toast.success('Invoice settings saved successfully!');
  };

  if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'invoice-settings')) {
      router.push("/")
      return
    }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-spectra mx-auto mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Settings</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadInvoiceSettings} className="bg-red-600 hover:bg-red-700">
                Retry
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-spectra to-elm rounded-lg p-6 text-white">
          <div className="flex items-center mb-2">
            <Receipt className="h-8 w-8 mr-3" />
            <h1 className="text-2xl font-bold">Invoice Settings</h1>
          </div>
          <p className="text-gray-200">
            Configure your business details for invoice generation. These settings will be used for all invoices.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Business Information</p>
                <p className="text-lg font-bold text-codGray">
                  {currentSettings?.businessName ? 'Configured' : 'Not Set'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentSettings?.businessName ? 'Ready for invoices' : 'Setup required'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Legal Compliance</p>
                <p className="text-lg font-bold text-codGray">
                  {currentSettings?.gstin || currentSettings?.fssai ? 'Partial' : 'Not Set'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  GSTIN & FSSAI details
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Invoice System</p>
                <p className="text-lg font-bold text-codGray">
                  {currentSettings ? 'Active' : 'Inactive'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ready to generate invoices
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Current Settings */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-codGray flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-spectra" />
                  Current Configuration
                </h2>
              </div>
              
              <div className="p-6">
                {currentSettings ? (
                  <div className="space-y-8">
                    {/* Business Information Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Business Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-md p-3 border">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Name</p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {currentSettings.businessName || 'Not configured'}
                          </p>
                        </div>
                        {currentSettings.formerlyKnownAs && (
                          <div className="bg-white rounded-md p-3 border">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Formerly Known As</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {currentSettings.formerlyKnownAs}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Legal Information Card */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Receipt className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Legal & Compliance</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-md p-4 border">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">GSTIN</p>
                          <p className="text-sm font-semibold text-gray-800 break-all">
                            {currentSettings.gstin || 'Not set'}
                          </p>
                        </div>
                        <div className="bg-white rounded-md p-4 border">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">FSSAI</p>
                          <p className="text-sm font-semibold text-gray-800 break-all">
                            {currentSettings.fssai || 'Not set'}
                          </p>
                        </div>
                        <div className="bg-white rounded-md p-4 border">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">CIN</p>
                          <p className="text-sm font-semibold text-gray-800 break-all">
                            {currentSettings.cin || 'Not set'}
                          </p>
                        </div>
                        <div className="bg-white rounded-md p-4 border">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">PAN</p>
                          <p className="text-sm font-semibold text-gray-800 break-all">
                            {currentSettings.pan || 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Configuration Found</h3>
                    <p className="text-gray-500 mb-6">Get started by configuring your invoice settings</p>
                    <Button
                      onClick={() => setShowSettings(true)}
                      className="bg-spectra hover:bg-spectra/90 text-white"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Setup Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-3">
                <Button
                  onClick={() => setShowSettings(true)}
                  className="w-full bg-spectra hover:bg-spectra/90 text-white text-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
                
                <Button
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  className="w-full border-elm text-elm hover:bg-elm/10 text-sm"
                  disabled={!currentSettings}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Status Overview */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Setup Status</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Business Info</span>
                  <div className={`w-2 h-2 rounded-full ${currentSettings?.businessName ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GSTIN</span>
                  <div className={`w-2 h-2 rounded-full ${currentSettings?.gstin ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">FSSAI</span>
                  <div className={`w-2 h-2 rounded-full ${currentSettings?.fssai ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ready to Use</span>
                  <div className={`w-2 h-2 rounded-full ${currentSettings?.businessName ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Settings Modal */}
        <InvoiceSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          initialSettings={currentSettings || undefined}
        />

        {/* Preview Modal */}
        <InvoiceModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          orderData={sampleOrderData}
        />
      </div>
    </AdminLayout>
  );
}