import toast from 'react-hot-toast';
import { useGlobalStatsStore } from '../hooks/useGlobalStatsRefresh';

// Keywords that indicate successful operations that should trigger stats refresh
const SUCCESS_KEYWORDS = [
  'success', 'successfully', 'created', 'updated', 'deleted', 'added', 'removed',
  'activated', 'deactivated', 'enabled', 'disabled', 'approved', 'rejected',
  'completed', 'processed', 'shipped', 'delivered', 'cancelled', 'refunded',
  'saved', 'published', 'unpublished', 'archived', 'restored'
];

// Original toast methods
const originalSuccess = toast.success;
const originalError = toast.error;
const originalLoading = toast.loading;
const originalCustom = toast.custom;

// Enhanced toast.success that triggers global stats refresh
const enhancedSuccess = (message: string, options?: any) => {
  const result = originalSuccess(message, options);
  
  // Trigger global stats refresh for success messages
  const { triggerRefresh } = useGlobalStatsStore.getState();
  triggerRefresh();
  
  console.log('🔄 Global stats refresh triggered by success toast:', message);
  
  return result;
};

// Enhanced toast.error that can trigger refresh for certain error recoveries
const enhancedError = (message: string, options?: any) => {
  const result = originalError(message, options);
  
  // Some error messages might indicate successful operations (like "Already exists" after creation)
  const messageStr = String(message).toLowerCase();
  const shouldRefresh = SUCCESS_KEYWORDS.some(keyword => messageStr.includes(keyword));
  
  if (shouldRefresh) {
    const { triggerRefresh } = useGlobalStatsStore.getState();
    triggerRefresh();
    console.log('🔄 Global stats refresh triggered by error toast (success operation):', message);
  }
  
  return result;
};

// Enhanced toast.loading - no refresh needed for loading states
const enhancedLoading = (message: string, options?: any) => {
  return originalLoading(message, options);
};

// Enhanced toast.custom that checks message content
const enhancedCustom = (jsx: any, options?: any) => {
  const result = originalCustom(jsx, options);
  
  // Try to extract text content from JSX to check for success keywords
  if (jsx && typeof jsx === 'object' && jsx.props && jsx.props.children) {
    const textContent = String(jsx.props.children).toLowerCase();
    const shouldRefresh = SUCCESS_KEYWORDS.some(keyword => textContent.includes(keyword));
    
    if (shouldRefresh) {
      const { triggerRefresh } = useGlobalStatsStore.getState();
      triggerRefresh();
      console.log('🔄 Global stats refresh triggered by custom toast:', textContent);
    }
  }
  
  return result;
};

// Function to initialize the toast interceptor
export const initializeGlobalToastInterceptor = () => {
  // Replace toast methods with enhanced versions
  toast.success = enhancedSuccess;
  toast.error = enhancedError;
  toast.loading = enhancedLoading;
  toast.custom = enhancedCustom;
  
  console.log('✅ Global toast interceptor initialized');
};

// Function to restore original toast methods (for cleanup if needed)
export const restoreOriginalToast = () => {
  toast.success = originalSuccess;
  toast.error = originalError;
  toast.loading = originalLoading;
  toast.custom = originalCustom;
  
  console.log('🔄 Original toast methods restored');
};

// Manual trigger function for cases where toast might not be used
export const triggerGlobalStatsRefresh = (reason?: string) => {
  const { triggerRefresh } = useGlobalStatsStore.getState();
  triggerRefresh();
  console.log('🔄 Manual global stats refresh triggered:', reason || 'No reason provided');
};