import { getToken, handleAuthError } from './auth-utils';

/**
 * Authenticated fetch wrapper that automatically adds authorization headers
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token is available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 errors
  if (response.status === 401) {
    handleAuthError({ response: { status: 401 } });
    throw new Error('Authentication failed');
  }

  return response;
};

/**
 * Authenticated fetch that returns JSON data
 */
export const authenticatedFetchJSON = async (url: string, options: RequestInit = {}): Promise<any> => {
  const response = await authenticatedFetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }
  
  return response.json();
};

/**
 * GET request with authentication
 */
export const apiGet = (url: string): Promise<any> => {
  return authenticatedFetchJSON(url, { method: 'GET' });
};

/**
 * POST request with authentication
 */
export const apiPost = (url: string, data: any): Promise<any> => {
  return authenticatedFetchJSON(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request with authentication
 */
export const apiPut = (url: string, data: any): Promise<any> => {
  return authenticatedFetchJSON(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request with authentication
 */
export const apiDelete = (url: string): Promise<any> => {
  return authenticatedFetchJSON(url, { method: 'DELETE' });
};