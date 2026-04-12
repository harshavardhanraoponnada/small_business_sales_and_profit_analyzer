import { DataTable, EmptyState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';
import type { MLForecastType, PredictionSummary } from '@/hooks/useMLAnalytics';

interface PredictionTableProps {
  summary: PredictionSummary;
  selectedModel: 'all' | MLForecastType;
}

interface ForecastRow {
  id: string;
  date: string;
  forecast: number;
  lower: number;
  upper: number;
  actual: number | null;
}

const MODEL_LABELS: Record<MLForecastType, string> = {
  sales: 'Sales',
  expenses: 'Expenses',
  profit: 'Profit',
};

const visibleModels = (selected: 'all' | MLForecastType): MLForecastType[] => {
  if (selected === 'all') {
    return ['sales', 'expenses', 'profit'];
  }

  return [selected];
};

export default function PredictionTable({ summary, selectedModel }: PredictionTableProps) {
  const models = visibleModels(selectedModel);

  return (
    <div className="grid gap-4">
      {models.map((model) => {
        const rows: ForecastRow[] = summary[model].data.map((row, index) => ({
          id: `${model}-${row.date}-${index}`,
          date: row.date,
          forecast: row.forecast,
          lower: row.lower,
          upper: row.upper,
          actual: row.actual,
        }));

        if (!rows.length) {
          return (
            <section
              key={model}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                {MODEL_LABELS[model]} Predictions
              </h3>
              <EmptyState title="No predictions" description="Prediction rows will appear here after model training." />
            </section>
          );
        }

        const columns = [
          {
            key: 'date',
            label: 'Date',
            sortable: true,
            render: (value: string) => new Date(value).toLocaleDateString(),
          },
          {
            key: 'forecast',
            label: 'Predicted',
            sortable: true,
            render: (value: number) => `₹${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            key: 'lower',
            label: 'Lower CI',
            sortable: true,
            render: (value: number) => `₹${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            key: 'upper',
            label: 'Upper CI',
            sortable: true,
            render: (value: number) => `₹${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            key: 'actual',
            label: 'Actual',
            sortable: true,
            render: (value: number | null) =>
              value == null
                ? '-'
                : `₹${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
        ] as const;

        return (
          <section
            key={model}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              {MODEL_LABELS[model]} Predictions
            </h3>
            <DataTable columns={columns as any} data={rows as any} />
          </section>
        );
      })}
    </div>
  );
}
