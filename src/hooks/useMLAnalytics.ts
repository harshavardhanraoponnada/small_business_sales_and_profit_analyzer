import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/services/api';

export type MLForecastType = 'sales' | 'expenses' | 'profit';

export interface ForecastPoint {
  date: string;
  forecast: number;
  upper: number;
  lower: number;
  actual: number | null;
}

export interface ForecastSeries {
  data: ForecastPoint[];
  accuracy: number | null;
}

export interface PredictionSummary {
  sales: ForecastSeries;
  expenses: ForecastSeries;
  profit: ForecastSeries;
}

export interface ModelMetrics {
  mape: number;
  rmse: number;
  test_points: number;
}

const mlKeys = {
  all: ['ml-analytics'] as const,
  summary: (periods: number) => [...mlKeys.all, 'summary', periods] as const,
  metrics: (type: Exclude<MLForecastType, 'profit'>) => [...mlKeys.all, 'metrics', type] as const,
};

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeForecastPoint = (row: any): ForecastPoint => ({
  date: String(row?.date || ''),
  forecast: numberOrZero(row?.forecast),
  upper: numberOrZero(row?.upper),
  lower: numberOrZero(row?.lower),
  actual: row?.actual == null ? null : numberOrZero(row.actual),
});

const normalizeSeries = (input: any): ForecastSeries => {
  const rows = Array.isArray(input?.data) ? input.data : [];
  const accuracy = input?.accuracy == null ? null : numberOrZero(input.accuracy);

  return {
    data: rows.map(normalizeForecastPoint),
    accuracy,
  };
};

const normalizeSummaryResponse = (payload: any): PredictionSummary => {
  const source = payload?.data || payload;

  return {
    sales: normalizeSeries(source?.sales),
    expenses: normalizeSeries(source?.expenses),
    profit: normalizeSeries(source?.profit),
  };
};

const normalizeMetricsResponse = (payload: any): ModelMetrics | null => {
  const source = payload?.metrics || payload?.data?.metrics || payload?.data || payload;
  if (!source || typeof source !== 'object') {
    return null;
  }

  return {
    mape: numberOrZero(source.mape),
    rmse: numberOrZero(source.rmse),
    test_points: Math.trunc(numberOrZero(source.test_points)),
  };
};

export const useMLPredictionsSummary = (periods: number) => {
  return useQuery({
    queryKey: mlKeys.summary(periods),
    queryFn: async () => {
      const response = await apiGet<any>(`/ml/predictions/summary?periods=${periods}`);
      return normalizeSummaryResponse(response);
    },
  });
};

export const useMLModelMetrics = (type: Exclude<MLForecastType, 'profit'>) => {
  return useQuery({
    queryKey: mlKeys.metrics(type),
    queryFn: async () => {
      const response = await apiGet<any>(`/ml/predictions/evaluate/${type}`);
      return normalizeMetricsResponse(response);
    },
  });
};

export const useTrainMLModels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiPost('/ml/predictions/train', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mlKeys.all });
    },
  });
};
