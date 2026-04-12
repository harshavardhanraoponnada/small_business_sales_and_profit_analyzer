import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { Sale, ApiResponse, ApiListResponse } from '@/types';

/**
 * Query key factory for sales
 */
const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (filters: any) => [...saleKeys.lists(), { filters }] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...saleKeys.details(), id] as const,
};

/**
 * Hook to fetch all sales
 */
export const useSales = (filters?: any) => {
  return useQuery({
    queryKey: saleKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<Sale>>(endpoints.sales.list);
      const payload: any = response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });
};

/**
 * Hook to fetch a single sale
 */
export const useSale = (id: string | number) => {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<Sale>(endpoints.sales.get(id));
      const payload: any = response;
      return payload?.data ?? payload?.sale ?? payload;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a sale
 */
export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiPost<Sale>(endpoints.sales.create, data);
      const payload: any = response;
      return payload?.data ?? payload?.sale ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
    },
  });
};

/**
 * Hook to update a sale
 */
export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const response = await apiPut<Sale>(endpoints.sales.update(id), data);
      const payload: any = response;
      return payload?.data ?? payload?.sale ?? payload;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(saleKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      }
    },
  });
};

/**
 * Hook to delete a sale
 */
export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete(endpoints.sales.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(saleKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
    },
  });
};
