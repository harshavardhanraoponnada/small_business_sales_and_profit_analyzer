import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';
import type { MLForecastType, PredictionSummary } from '@/hooks/useMLAnalytics';

interface PredictionChartsProps {
  summary: PredictionSummary;
  selectedModel: 'all' | MLForecastType;
}

const MODEL_META: Record<MLForecastType, { title: string; color: string }> = {
  sales: { title: 'Sales Forecast', color: '#2563eb' },
  expenses: { title: 'Expenses Forecast', color: '#dc2626' },
  profit: { title: 'Profit Forecast', color: '#16a34a' },
};

const visibleModels = (selected: 'all' | MLForecastType): MLForecastType[] => {
  if (selected === 'all') {
    return ['sales', 'expenses', 'profit'];
  }

  return [selected];
};

export default function PredictionCharts({ summary, selectedModel }: PredictionChartsProps) {
  const models = visibleModels(selectedModel);

  return (
    <div className="grid gap-4">
      {models.map((model) => {
        const series = summary[model].data;
        const meta = MODEL_META[model];

        return (
          <section
            key={model}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              {meta.title} (Actual vs Predicted)
            </h3>

            {!series.length ? (
              <EmptyState title="No forecast data" description="Train models to generate prediction charts." />
            ) : (
              <div className="w-full min-w-0 overflow-hidden" style={{ minWidth: 0, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height={320} minWidth={1} debounce={80}>
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => new Date(String(date)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tickFormatter={(value) => formatNumber(Number(value))} width={90} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        `₹${formatNumber(Number(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        name,
                      ]}
                      labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
                    />
                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Predicted"
                      stroke={meta.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="upper"
                      name="Upper CI"
                      stroke="#94a3b8"
                      strokeWidth={1}
                      strokeDasharray="6 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="lower"
                      name="Lower CI"
                      stroke="#94a3b8"
                      strokeWidth={1}
                      strokeDasharray="6 4"
                      dot={false}
                      isAnimationActive={false}
                    />

                    {series.some((row) => row.actual != null) ? (
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        isAnimationActive={false}
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
