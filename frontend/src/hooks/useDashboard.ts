import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';

type DateRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'max' | 'custom';

export interface SummaryResponse {
  totalSales: number;
  totalExpenses: number;
  profit: number;
  netProfit?: number;
  cogs?: number;
  cogsFromExpenses?: number;
  operatingExpenses?: number;
  profitV2?: number;
}

export interface QuickStatsResponse {
  totalSales: number;
  totalUnits: number;
  totalExpenses: number;
  profit: number;
  netProfit?: number;
  cogs?: number;
  cogsFromExpenses?: number;
  operatingExpenses?: number;
  profitV2?: number;
}

export interface TrendPoint {
  date: string;
  sales?: number;
  expenses?: number;
  profit?: number;
  amount?: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

interface ExpenseAnalyticsResponse {
  trend: Array<{ date: string; amount: number }>;
  distribution: Array<{ category: string; amount: number }>;
  totalExpenses?: number;
  cogsFromExpenses?: number;
  operatingExpenses?: number;
}

const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (range: DateRange) => [...dashboardKeys.all, 'summary', range] as const,
  quickStats: (period: DateRange) => [...dashboardKeys.all, 'quick-stats', period] as const,
  lowStock: (threshold: number) => [...dashboardKeys.all, 'low-stock', threshold] as const,
  salesTrend: (range: DateRange, startDate?: string, endDate?: string) =>
    [...dashboardKeys.all, 'sales-trend', range, startDate, endDate] as const,
  profitTrend: (range: DateRange, startDate?: string, endDate?: string) =>
    [...dashboardKeys.all, 'profit-trend', range, startDate, endDate] as const,
  expenseAnalytics: (range: DateRange, startDate?: string, endDate?: string) =>
    [...dashboardKeys.all, 'expenses', range, startDate, endDate] as const,
};

const buildRangeQuery = (range: DateRange, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams({ range });
  if (range === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  return params.toString();
};

const unwrapPayload = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response && response.data !== undefined) {
    return response.data as T;
  }
  return response as T;
};

export const useDashboardSummary = (range: DateRange = 'monthly', enabled = true) => {
  return useQuery({
    queryKey: dashboardKeys.summary(range),
    enabled,
    queryFn: async () => {
      const response = await apiGet<SummaryResponse>(`/reports/summary?range=${range}`);
      return unwrapPayload<SummaryResponse>(response);
    },
  });
};

export const useDashboardQuickStats = (period: DateRange = 'daily') => {
  return useQuery({
    queryKey: dashboardKeys.quickStats(period),
    queryFn: async () => {
      const response = await apiGet<QuickStatsResponse>(`/reports/quick-stats?type=${period}`);
      return unwrapPayload<QuickStatsResponse>(response);
    },
  });
};

export const useLowStockAlerts = (threshold = 10) => {
  return useQuery({
    queryKey: dashboardKeys.lowStock(threshold),
    queryFn: async () => {
      const response = await apiGet<LowStockItem[]>(`/reports/low-stock?threshold=${threshold}`);
      return unwrapPayload<LowStockItem[]>(response);
    },
  });
};

export const useSalesTrend = (range: DateRange = 'monthly', startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: dashboardKeys.salesTrend(range, startDate, endDate),
    queryFn: async () => {
      const query = buildRangeQuery(range, startDate, endDate);
      const response = await apiGet<TrendPoint[]>(`/reports/sales-trend?${query}`);
      return unwrapPayload<TrendPoint[]>(response);
    },
  });
};

export const useProfitTrend = (range: DateRange = 'monthly', startDate?: string, endDate?: string, enabled = true) => {
  return useQuery({
    queryKey: dashboardKeys.profitTrend(range, startDate, endDate),
    enabled,
    queryFn: async () => {
      const query = buildRangeQuery(range, startDate, endDate);
      const response = await apiGet<TrendPoint[]>(`/reports/profit-trend?${query}`);
      return unwrapPayload<TrendPoint[]>(response);
    },
  });
};

export const useExpenseAnalytics = (range: DateRange = 'monthly', startDate?: string, endDate?: string, enabled = true) => {
  return useQuery({
    queryKey: dashboardKeys.expenseAnalytics(range, startDate, endDate),
    enabled,
    queryFn: async () => {
      const query = buildRangeQuery(range, startDate, endDate);
      const response = await apiGet<ExpenseAnalyticsResponse>(`/reports/expenses?${query}`);
      const payload = unwrapPayload<ExpenseAnalyticsResponse>(response);
      return {
        trend: payload?.trend || [],
        distribution: payload?.distribution || [],
      };
    },
  });
};
