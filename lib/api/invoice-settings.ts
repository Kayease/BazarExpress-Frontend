import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// API client with auth handling
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/invoice-settings`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface InvoiceSettingsData {
  _id?: string;
  businessName: string;
  formerlyKnownAs?: string;
  gstin: string;
  fssai: string;
  cin: string;
  pan: string;
  termsAndConditions: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const invoiceSettingsAPI = {
  // Get current active invoice settings (public route)
  getSettings: async (): Promise<InvoiceSettingsData> => {
    try {
      const response = await apiClient.get('/');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching invoice settings:', error);
      // Return default settings if API fails
      return {
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
    }
  },

  // Update invoice settings (admin only)
  updateSettings: async (settings: Omit<InvoiceSettingsData, '_id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<InvoiceSettingsData> => {
    try {
      const response = await apiClient.put('/', settings);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating invoice settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to update invoice settings');
    }
  },

  // Get all invoice settings (admin only)
  getAllSettings: async (): Promise<InvoiceSettingsData[]> => {
    try {
      const response = await apiClient.get('/all');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching all invoice settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch invoice settings');
    }
  },

  // Delete invoice settings (admin only)
  deleteSettings: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/${id}`);
    } catch (error: any) {
      console.error('Error deleting invoice settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete invoice settings');
    }
  }
};