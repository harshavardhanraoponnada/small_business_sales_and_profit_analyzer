import { useState } from 'react';
import { Clock } from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorBoundary, ErrorState, LoadingState } from '@/components/ui';
import ExportButtons from '@/components/reports/ExportButtons';
import { useExpenseAnalytics } from '@/hooks';
import { formatNumber } from '@/utils/numberFormat';
import styles from '@/pages/Dashboard.module.css';

type DateRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'max' | 'custom';

type ExpenseAnalyticsProps = {
  canSchedule: boolean;
  onSchedule: (type: string) => void;
};

const RANGE_OPTIONS: Array<{ label: string; value: DateRange }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Max', value: 'max' },
  { label: 'Custom', value: 'custom' },
];

const PIE_COLORS = ['#2563eb', '#16a34a', '#eab308', '#ef4444', '#8b5cf6', '#14b8a6'];

const cardClass = `rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${styles.chartContainer}`;

export default function ExpenseAnalytics({ canSchedule, onSchedule }: ExpenseAnalyticsProps) {
  const today = new Date().toISOString().split('T')[0];
  const [range, setRange] = useState<DateRange>('monthly');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const invalidCustomRange = range === 'custom' && startDate > endDate;

  const expenseQuery = useExpenseAnalytics(
    range,
    range === 'custom' ? startDate : undefined,
    range === 'custom' ? endDate : undefined,
    !invalidCustomRange
  );

  const trend = expenseQuery.data?.trend || [];
  const distribution = expenseQuery.data?.distribution || [];
  const hasData = trend.length > 0 || distribution.length > 0;

  return (
    <ErrorBoundary fallbackTitle="Expense analytics failed">
      <section className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Expense Analytics</h3>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as DateRange)}
              className="h-8 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {range === 'custom' ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            ) : null}

            <ExportButtons
              reportType="expenses"
              range={range}
              startDate={range === 'custom' ? startDate : undefined}
              endDate={range === 'custom' ? endDate : undefined}
              disabled={invalidCustomRange}
            />

            {canSchedule ? (
              <button
                type="button"
                onClick={() => onSchedule('expenses')}
                className="inline-flex items-center gap-2 rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                <Clock size={14} />
                Schedule
              </button>
            ) : null}
          </div>
        </div>

        {invalidCustomRange ? (
          <ErrorState
            title="Invalid date range"
            message="Start date must be earlier than or equal to end date."
          />
        ) : null}

        {expenseQuery.isLoading ? <LoadingState type="skeleton" variant="chart" /> : null}

        {expenseQuery.error && !invalidCustomRange ? (
          <ErrorState
            title="Expense analytics unavailable"
            message={(expenseQuery.error as any)?.message || 'Failed to load expense analytics data.'}
            onRetry={() => expenseQuery.refetch()}
          />
        ) : null}

        {!expenseQuery.isLoading && !expenseQuery.error && !invalidCustomRange ? (
          hasData ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="h-80 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} debounce={80}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatNumber} width={90} />
                    <Tooltip formatter={(value: any) => `₹${formatNumber(value)}`} />
                    <Line type="monotone" dataKey="amount" stroke="#ea580c" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-80 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} debounce={80}>
                  <PieChart>
                    <Pie data={distribution} dataKey="amount" nameKey="category" outerRadius={90} label>
                      {distribution.map((entry, index) => (
                        <Cell key={`${entry.category}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value: any) => `₹${formatNumber(value)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">No expense data available</p>
            </div>
          )
        ) : null}
      </section>
    </ErrorBoundary>
  );
}
