import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { Brand, ApiListResponse } from '@/types';

const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (filters: unknown) => [...brandKeys.lists(), { filters }] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...brandKeys.details(), id] as const,
};

export const useBrands = (filters?: unknown) => {
  return useQuery({
    queryKey: brandKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<Brand>>(endpoints.brands.list);
      const payload: any = response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.brands)) return payload.brands;
      return [];
    },
  });
};

export const useBrand = (id: string | number) => {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<Brand>(endpoints.brands.get(id));
      const payload: any = response;
      return payload?.data ?? payload?.brand ?? payload;
    },
    enabled: !!id,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Brand>) => {
      const response = await apiPost<Brand>(endpoints.brands.create, data);
      const payload: any = response;
      return payload?.data ?? payload?.brand ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Brand> }) => {
      const response = await apiPut<Brand>(endpoints.brands.update(id), data);
      const payload: any = response;
      return payload?.data ?? payload?.brand ?? payload;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(brandKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      }
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete(endpoints.brands.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(brandKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
};
