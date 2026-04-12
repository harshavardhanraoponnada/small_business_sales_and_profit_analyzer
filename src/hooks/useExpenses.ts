import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, endpoints } from '@/services/api';
import { Expense, ApiListResponse } from '@/types';

export interface ExpenseCategoryOption {
  id?: string | null;
  key: string;
  name: string;
  expense_group: string;
  affects_cogs_default: boolean;
  is_system?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface ExpenseMetadata {
  paymentMethods: string[];
}

/**
 * Query key factory for expenses
 */
const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: any) => [...expenseKeys.lists(), { filters }] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...expenseKeys.details(), id] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
  metadata: () => [...expenseKeys.all, 'metadata'] as const,
};

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<ExpenseCategoryOption>>(endpoints.expenses.categories);
      const payload: any = response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });
};

export const useExpenseMetadata = () => {
  return useQuery({
    queryKey: expenseKeys.metadata(),
    queryFn: async () => {
      const response = await apiGet<ExpenseMetadata>(endpoints.expenses.metadata);
      const payload: any = response;
      if (payload?.paymentMethods) {
        return payload as ExpenseMetadata;
      }
      if (payload?.data?.paymentMethods) {
        return payload.data as ExpenseMetadata;
      }
      return { paymentMethods: [] } as ExpenseMetadata;
    },
  });
};

/**
 * Hook to fetch all expenses
 */
export const useExpenses = (filters?: any) => {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<Expense>>(endpoints.expenses.list);
      const payload: any = response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
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
      const payload: any = response;
      return payload?.data ?? payload?.expense ?? payload;
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
      const response = await apiPost<Expense>(
        endpoints.expenses.create,
        data,
        data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
      );
      const payload: any = response;
      return payload?.data ?? payload?.expense ?? payload;
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
      const response = await apiPut<Expense>(
        endpoints.expenses.update(id),
        data,
        data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
      );
      const payload: any = response;
      return payload?.data ?? payload?.expense ?? payload;
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
