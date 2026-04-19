import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Clock } from 'lucide-react';
import { ErrorBoundary, ErrorState, LoadingState } from '@/components/ui';
import ExportButtons from '@/components/reports/ExportButtons';
import { formatNumber } from '@/utils/numberFormat';
import type { TrendPoint } from '@/hooks/useDashboard';
import styles from '@/pages/Dashboard.module.css';

interface DashboardChartsProps {
  isStaff: boolean;
  canSchedule: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  salesTrend: TrendPoint[];
  profitTrend: TrendPoint[];
  onSchedule: (type: string) => void;
}

const cardClass = `rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${styles.chartContainer}`;

function ChartToolbar({ title, reportType, canSchedule, onSchedule }: { title: string; reportType: string; canSchedule: boolean; onSchedule: (type: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="flex items-center gap-2">
        <ExportButtons reportType={reportType} />
        {canSchedule ? (
          <button
            type="button"
            onClick={() => onSchedule(reportType)}
            className="inline-flex items-center gap-2 rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            <Clock size={14} />
            Schedule
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardCharts({
  isStaff,
  canSchedule,
  loading = false,
  error,
  onRetry,
  salesTrend,
  profitTrend,
  onSchedule,
}: DashboardChartsProps) {
  if (loading) {
    return <LoadingState type="skeleton" variant="chart" />;
  }

  if (error) {
    return <ErrorState title="Dashboard charts unavailable" message={error} onRetry={onRetry} />;
  }

  // Only render charts if data is available to prevent ResizeObserver errors
  const hasSalesData = salesTrend && salesTrend.length > 0;
  const hasProfitData = profitTrend && profitTrend.length > 0;

  return (
    <div className={styles.chartGrid}>
      <ErrorBoundary fallbackTitle="Sales trend failed">
        <section className={cardClass}>
          <ChartToolbar title="Sales Trend" reportType="sales-trend" canSchedule={canSchedule} onSchedule={onSchedule} />
          {hasSalesData ? (
            <div className="w-full min-w-0 overflow-hidden" style={{ minWidth: 0, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320} minWidth={1} debounce={80}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatNumber} width={90} />
                  <Tooltip formatter={(value: any) => `₹${formatNumber(value)}`} />
                  <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">No sales data available</p>
            </div>
          )}
        </section>
      </ErrorBoundary>

      {!isStaff ? (
        <ErrorBoundary fallbackTitle="Profit trend failed">
          <section className={cardClass}>
            <ChartToolbar title="Profit Trend" reportType="profit-trend" canSchedule={canSchedule} onSchedule={onSchedule} />
            {hasProfitData ? (
              <div className="w-full min-w-0 overflow-hidden" style={{ minWidth: 0, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height={320} minWidth={1} debounce={80}>
                  <LineChart data={profitTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatNumber} width={90} />
                    <Tooltip formatter={(value: any) => `₹${formatNumber(value)}`} />
                    <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500 dark:text-slate-400">No profit data available</p>
              </div>
            )}
          </section>
        </ErrorBoundary>
      ) : null}
    </div>
  );
}
