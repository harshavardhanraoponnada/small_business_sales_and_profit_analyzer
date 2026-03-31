import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { User, ApiListResponse } from '@/types';

const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: unknown) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...userKeys.details(), id] as const,
};

export const useUsers = (filters?: unknown) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<User>>(endpoints.users.list);
      return response.data || [];
    },
  });
};

export const useUser = (id: string | number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<User>(endpoints.users.get(id));
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiPost<User>(endpoints.users.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<User> }) => {
      const response = await apiPut<User>(endpoints.users.update(id), data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(userKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      }
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete(endpoints.users.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(userKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
