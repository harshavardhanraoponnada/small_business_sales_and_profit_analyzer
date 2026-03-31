import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { Expense, ApiResponse, ApiListResponse } from '@/types';

/**
 * Query key factory for expenses
 */
const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: any) => [...expenseKeys.lists(), { filters }] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...expenseKeys.details(), id] as const,
};

/**
 * Hook to fetch all expenses
 */
export const useExpenses = (filters?: any) => {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<Expense>>(endpoints.expenses.list);
      return response.data || [];
    },
  });
};

/**
 * Hook to fetch a single expense
 */
export const useExpense = (id: string | number) => {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<Expense>(endpoints.expenses.get(id));
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create an expense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiPost<Expense>(endpoints.expenses.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
};

/**
 * Hook to update an expense
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const response = await apiPut<Expense>(endpoints.expenses.update(id), data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(expenseKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      }
    },
  });
};

/**
 * Hook to delete an expense
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete(endpoints.expenses.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(expenseKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
};
