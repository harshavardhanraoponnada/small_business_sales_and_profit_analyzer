import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { Category, ApiResponse, ApiListResponse } from '@/types';

/**
 * Query key factory for categories
 */
const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: any) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...categoryKeys.details(), id] as const,
};

/**
 * Hook to fetch all categories
 */
export const useCategories = (filters?: any) => {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<Category>>(endpoints.categories.list);
      const payload: any = response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });
};

/**
 * Hook to fetch a single category
 */
export const useCategory = (id: string | number) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<Category>(endpoints.categories.get(id));
      const payload: any = response;
      return payload?.data ?? payload;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiPost<Category>(endpoints.categories.create, data);
      const payload: any = response;
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
};

/**
 * Hook to update a category
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const response = await apiPut<Category>(endpoints.categories.update(id), data);
      const payload: any = response;
      return payload?.data ?? payload;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(categoryKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      }
    },
  });
};

/**
 * Hook to delete a category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete(endpoints.categories.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(categoryKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
};
