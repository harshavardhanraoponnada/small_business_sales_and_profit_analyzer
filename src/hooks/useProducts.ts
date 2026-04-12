import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { Product, ApiResponse, ApiListResponse } from '@/types';

/**
 * Query key factory for products
 */
const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: any) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...productKeys.details(), id] as const,
};

/**
 * Hook to fetch all products
 */
export const useProducts = (filters?: any) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<Product>>(endpoints.products.list);
      const payload: any = response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.products)) return payload.products;
      return [];
    },
  });
};

/**
 * Hook to fetch a single product
 */
export const useProduct = (id: string | number) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<Product>(endpoints.products.get(id));
      const payload: any = response;
      return payload?.data ?? payload?.product ?? payload;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiPost<Product>(endpoints.products.create, data);
      const payload: any = response;
      return payload?.data ?? payload?.product ?? payload;
    },
    onSuccess: () => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

/**
 * Hook to update a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const response = await apiPut<Product>(endpoints.products.update(id), data);
      const payload: any = response;
      return payload?.data ?? payload?.product ?? payload;
    },
    onSuccess: (data) => {
      // Update specific product and invalidate list
      if (data) {
        queryClient.setQueryData(productKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      }
    },
  });
};

/**
 * Hook to delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete(endpoints.products.delete(id));
    },
    onSuccess: (_, id) => {
      // Remove product from cache and invalidate list
      queryClient.setQueryData(productKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
