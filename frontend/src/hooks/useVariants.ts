import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { Variant, ApiListResponse } from '@/types';

const variantKeys = {
  all: ['variants'] as const,
  lists: () => [...variantKeys.all, 'list'] as const,
  list: (filters: unknown) => [...variantKeys.lists(), { filters }] as const,
  details: () => [...variantKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...variantKeys.details(), id] as const,
};

export const useVariants = (filters?: unknown) => {
  return useQuery({
    queryKey: variantKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<Variant>>(endpoints.variants.list);
      return response.data || [];
    },
  });
};

export const useVariant = (id: string | number) => {
  return useQuery({
    queryKey: variantKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<Variant>(endpoints.variants.get(id));
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Variant>) => {
      const response = await apiPost<Variant>(endpoints.variants.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Variant> }) => {
      const response = await apiPut<Variant>(endpoints.variants.update(id), data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(variantKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      }
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete(endpoints.variants.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(variantKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
    },
  });
};
