import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cachedFetch } from '@/lib/cache';
import { getProductsByPincode } from '@/lib/warehouse-location';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Query Keys
export const queryKeys = {
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  products: (params?: any) => ['products', params] as const,
  productsByLocation: (pincode: string, params?: any) => ['products', 'location', pincode, params] as const,
  product: (id: string) => ['product', id] as const,
};

// Categories Hook
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const data = await cachedFetch<any[]>(`${API_URL}/categories`, undefined, 10 * 60 * 1000);
      return data.filter((cat: any) => !cat.hide);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Brands Hook
export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: async () => {
      return await cachedFetch<any[]>(`${API_URL}/brands`, undefined, 10 * 60 * 1000);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Products Hook
export function useProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.sort) searchParams.set('sort', params.sort);
      
      const url = `${API_URL}/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      return await cachedFetch(url, undefined, 2 * 60 * 1000); // 2 minutes cache
    },
    enabled: !!API_URL,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Products by Location Hook (using pincode-based warehouse system)
export function useProductsByLocation(
  pincode: string,
  params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    mode?: string;
  }
) {
  return useQuery({
    queryKey: queryKeys.productsByLocation(pincode, params),
    queryFn: async () => {
      const options = {
        page: params?.page || 1,
        limit: params?.limit || 20,
        category: params?.category,
        search: params?.search,
        mode: (params?.mode === 'global' ? 'global' : 'auto') as 'auto' | 'global'
      };
      
      return await getProductsByPincode(pincode, options);
    },
    enabled: !!pincode,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Single Product Hook
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: async () => {
      return await cachedFetch(`${API_URL}/products/${id}`, undefined, 5 * 60 * 1000);
    },
    enabled: !!id && !!API_URL,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Prefetch utilities
export function usePrefetchCategories() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories,
      queryFn: async () => {
        const data = await cachedFetch<any[]>(`${API_URL}/categories`, undefined, 10 * 60 * 1000);
        return data.filter((cat: any) => !cat.hide);
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}

export function usePrefetchBrands() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.brands,
      queryFn: async () => {
        return await cachedFetch<any[]>(`${API_URL}/brands`, undefined, 10 * 60 * 1000);
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}

// Invalidation utilities
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateCategories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    invalidateBrands: () => queryClient.invalidateQueries({ queryKey: queryKeys.brands }),
    invalidateProducts: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    invalidateProduct: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.product(id) }),
  };
}