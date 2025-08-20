'use client';

import React, { useState, useEffect } from 'react';
import { Save, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoiceSettingsAPI, InvoiceSettingsData } from '@/lib/api/invoice-settings';

interface InvoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: InvoiceSettingsData) => void;
  initialSettings?: InvoiceSettingsData;
}

const defaultSettings: InvoiceSettingsData = {
  businessName: 'Your Business Name',
  formerlyKnownAs: '',
  gstin: '',
  fssai: '',
  cin: '',
  pan: '',
  termsAndConditions: [
    'If you have any issues or queries in respect of your order, please contact customer chat support through our platform or drop in email at support@yourbusiness.com',
    'In case you need to get more information about seller\'s FSSAI status, please visit https://foscos.fssai.gov.in/ and use the FBO search option with FSSAI License / Registration number.',
    'Please note that we never ask for bank account details such as CVV, account number, UPI Pin, etc. across our support channels. For your safety please do not share these details with anyone over any medium.'
  ]
};

export default function InvoiceSettings({ isOpen, onClose, onSave, initialSettings }: InvoiceSettingsProps) {
  const [settings, setSettings] = useState<InvoiceSettingsData>(initialSettings || defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !initialSettings) {
      loadSettings();
    } else if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceSettingsAPI.getSettings();
      setSettings(data);
    } catch (error: any) {
      setError('Failed to load invoice settings');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InvoiceSettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleTermsChange = (index: number, value: string) => {
    const newTerms = [...settings.termsAndConditions];
    newTerms[index] = value;
    setSettings(prev => ({
      ...prev,
      termsAndConditions: newTerms
    }));
  };

  const addNewTerm = () => {
    setSettings(prev => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, '']
    }));
  };

  const removeTerm = (index: number) => {
    setSettings(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index)
    }));
  };



  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!settings.businessName || !settings.gstin || !settings.fssai || !settings.cin || !settings.pan) {
        setError('Please fill in all required fields');
        return;
      }

      const savedSettings = await invoiceSettingsAPI.updateSettings(settings);
      onSave(savedSettings);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to save invoice settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Save className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoice Settings</h2>
              <p className="text-sm text-gray-600">Configure your business details for invoice generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading invoice settings...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* Business Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-600 rounded-lg mr-3">
                <Save className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Business Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Formerly Known As (Optional)
                </label>
                <input
                  type="text"
                  value={settings.formerlyKnownAs || ''}
                  onChange={(e) => handleInputChange('formerlyKnownAs', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="Former business name"
                />
              </div>
            </div>

            {/* Logo Information */}
            <div className="mt-6 bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                  <img src="/logo.svg" alt="Business Logo" className="h-12 w-auto" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-blue-900">Business Logo</h4>
                  <p className="text-sm text-blue-700">Automatically using: /logo.svg</p>
                  <p className="text-xs text-blue-600 mt-1">Logo will appear on all invoices</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-600 rounded-lg mr-3">
                <Save className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Legal Information</h3>
                <p className="text-sm text-gray-600">Required for tax compliance and legal documentation</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  GSTIN *
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="07AAFCG9846E1ZB"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  FSSAI License Number *
                </label>
                <input
                  type="text"
                  value={settings.fssai}
                  onChange={(e) => handleInputChange('fssai', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="10018064001545"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  CIN *
                </label>
                <input
                  type="text"
                  value={settings.cin}
                  onChange={(e) => handleInputChange('cin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="U74140HR2015FTC055568"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  PAN *
                </label>
                <input
                  type="text"
                  value={settings.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="AAFCG9846E"
                />
              </div>
            </div>
          </div>



          {/* Signature Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-600 rounded-lg mr-3">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Authorized Signature</h3>
                <p className="text-sm text-gray-600">Static signature used for all invoices</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-purple-200">
              <div className="flex items-center space-x-6">
                <div className="w-48 h-24 border-2 border-purple-300 rounded-lg flex items-center justify-center bg-purple-50">
                  <img src="/sign.jpg" alt="Authorized Signature" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">Static Signature Configuration</h4>
                    <p className="text-sm text-purple-700">Using: /sign.jpg</p>
                    <p className="text-xs text-purple-600 mt-2">
                      This signature will automatically appear on all generated invoices. 
                      To change the signature, replace the sign.jpg file in the public folder.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-600 rounded-lg mr-3">
                <Save className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Terms & Conditions</h3>
                <p className="text-sm text-gray-600">Define terms and conditions that will appear on invoices</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-orange-200 space-y-4">
              {settings.termsAndConditions.map((term, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-semibold text-orange-700">{index + 1}</span>
                  </div>
                  <textarea
                    value={term}
                    onChange={(e) => handleTermsChange(index, e.target.value)}
                    rows={3}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                    placeholder="Enter terms and conditions..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTerm(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-1 p-2 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addNewTerm}
                className="w-full mt-4 border-orange-300 text-orange-700 hover:bg-orange-50 py-3"
              >
                + Add New Term
              </Button>
            </div>
          </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-4 p-8 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

