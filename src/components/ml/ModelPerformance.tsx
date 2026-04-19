import { Gauge, Sigma } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';
import type { ModelMetrics, PredictionSummary } from '@/hooks/useMLAnalytics';

interface ModelPerformanceProps {
  salesMetrics: ModelMetrics | null | undefined;
  expenseMetrics: ModelMetrics | null | undefined;
  summary: PredictionSummary;
}

interface PerformanceCardProps {
  title: string;
  metrics?: ModelMetrics | null;
  accuracy?: number | null;
}

function PerformanceCard({ title, metrics, accuracy }: PerformanceCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {title}
      </h3>

      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Gauge size={14} /> Accuracy
          </span>
          <strong className="text-slate-900 dark:text-slate-100">
            {accuracy == null ? 'N/A' : `${formatNumber(accuracy, { maximumFractionDigits: 2 })}%`}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Sigma size={14} /> RMSE
          </span>
          <strong className="text-slate-900 dark:text-slate-100">
            {metrics ? formatNumber(metrics.rmse, { maximumFractionDigits: 2 }) : 'N/A'}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 dark:text-slate-400">MAPE</span>
          <strong className="text-slate-900 dark:text-slate-100">
            {metrics ? `${formatNumber(metrics.mape, { maximumFractionDigits: 2 })}%` : 'N/A'}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 dark:text-slate-400">Test Points</span>
          <strong className="text-slate-900 dark:text-slate-100">
            {metrics ? formatNumber(metrics.test_points) : 'N/A'}
          </strong>
        </div>
      </div>
    </article>
  );
}

export default function ModelPerformance({ salesMetrics, expenseMetrics, summary }: ModelPerformanceProps) {
  const hasAnyMetrics = Boolean(salesMetrics || expenseMetrics || summary.profit.accuracy != null);
  if (!hasAnyMetrics) {
    return <EmptyState title="Model metrics unavailable" description="Evaluate or train models to see performance metrics." />;
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <PerformanceCard title="Sales Model" metrics={salesMetrics} accuracy={summary.sales.accuracy} />
      <PerformanceCard title="Expenses Model" metrics={expenseMetrics} accuracy={summary.expenses.accuracy} />
      <PerformanceCard title="Profit Projection" accuracy={summary.profit.accuracy} />
    </section>
  );
}
