import { useMemo, useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import TopNotification from '@/components/common/TopNotification';
import {
  PageContainer,
  ErrorState,
  LoadingState,
} from '@/components/ui';
import {
  MLHeader,
  ModelPerformance,
  PredictionCharts,
  PredictionTable,
} from '@/components/ml';
import ScheduleReportModal from '@/components/reports/ScheduleReportModal';
import {
  useMLModelMetrics,
  useMLPredictionsSummary,
  useTrainMLModels,
  type ForecastSeries,
  type MLForecastType,
} from '@/hooks/useMLAnalytics';
import { formatNumber } from '@/utils/numberFormat';
import styles from './MLAnalytics.module.css';

type NotificationState = {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
} | null;

const averageForecast = (series: ForecastSeries) => {
  if (!series.data.length) return 0;
  const total = series.data.reduce((sum, row) => sum + Number(row.forecast || 0), 0);
  return total / series.data.length;
};

const trendPercent = (series: ForecastSeries) => {
  if (series.data.length < 2) return 0;
  const first = Number(series.data[0].forecast || 0);
  const last = Number(series.data[series.data.length - 1].forecast || 0);

  if (first === 0) return 0;
  return ((last - first) / Math.abs(first)) * 100;
};

const toCsv = (rows: Array<Record<string, string | number>>) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) =>
    headers
      .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );

  return [headers.join(','), ...body].join('\n');
};

const triggerCsvDownload = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const scheduleReportType = (model: 'all' | MLForecastType) => {
  if (model === 'sales') return 'sales-trend';
  if (model === 'expenses') return 'expenses';
  if (model === 'profit') return 'profit-trend';
  return 'summary';
};

export default function MLAnalytics() {
  const [period, setPeriod] = useState(30);
  const [selectedModel, setSelectedModel] = useState<'all' | MLForecastType>('all');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);

  const summaryQuery = useMLPredictionsSummary(period);
  const salesMetricsQuery = useMLModelMetrics('sales');
  const expenseMetricsQuery = useMLModelMetrics('expenses');
  const trainMutation = useTrainMLModels();

  const loading =
    summaryQuery.isLoading ||
    salesMetricsQuery.isLoading ||
    expenseMetricsQuery.isLoading;

  const errorMessage = String(
    (summaryQuery.error as any)?.message ||
      (salesMetricsQuery.error as any)?.message ||
      (expenseMetricsQuery.error as any)?.message ||
      ''
  );

  const summary = summaryQuery.data || {
    sales: { data: [], accuracy: null },
    expenses: { data: [], accuracy: null },
    profit: { data: [], accuracy: null },
  };

  const cards = useMemo(() => {
    const salesAvg = averageForecast(summary.sales);
    const expenseAvg = averageForecast(summary.expenses);
    const profitAvg = averageForecast(summary.profit);

    return [
      {
        key: 'sales',
        title: 'Sales Forecast',
        value: `₹${formatNumber(salesAvg, { maximumFractionDigits: 2 })}/day`,
        change: `${trendPercent(summary.sales) >= 0 ? '+' : ''}${formatNumber(trendPercent(summary.sales), { maximumFractionDigits: 1 })}%`,
        changeType: trendPercent(summary.sales) >= 0 ? 'positive' as const : 'negative' as const,
        icon: <TrendingUp />,
      },
      {
        key: 'expenses',
        title: 'Expenses Forecast',
        value: `₹${formatNumber(expenseAvg, { maximumFractionDigits: 2 })}/day`,
        change: `${trendPercent(summary.expenses) >= 0 ? '+' : ''}${formatNumber(trendPercent(summary.expenses), { maximumFractionDigits: 1 })}%`,
        changeType: trendPercent(summary.expenses) <= 0 ? 'positive' as const : 'negative' as const,
        icon: <TrendingDown />,
      },
      {
        key: 'profit',
        title: 'Profit Forecast',
        value: `₹${formatNumber(profitAvg, { maximumFractionDigits: 2 })}/day`,
        change: `${trendPercent(summary.profit) >= 0 ? '+' : ''}${formatNumber(trendPercent(summary.profit), { maximumFractionDigits: 1 })}%`,
        changeType: trendPercent(summary.profit) >= 0 ? 'positive' as const : 'negative' as const,
        icon: <DollarSign />,
      },
    ];
  }, [summary]);

  const handleTrainModels = async () => {
    try {
      await trainMutation.mutateAsync();
      setNotification({
        id: Date.now(),
        title: 'Training Started',
        message: 'Models were retrained and analytics data refreshed.',
        type: 'success',
      });
    } catch (error: any) {
      setNotification({
        id: Date.now(),
        title: 'Training Failed',
        message: String(error?.message || 'Unable to train ML models right now.'),
        type: 'error',
      });
    }
  };

  const handleExport = () => {
    const models: MLForecastType[] =
      selectedModel === 'all' ? ['sales', 'expenses', 'profit'] : [selectedModel];

    const rows = models.flatMap((model) =>
      summary[model].data.map((entry) => ({
        model,
        date: entry.date,
        forecast: entry.forecast,
        lower: entry.lower,
        upper: entry.upper,
        actual: entry.actual == null ? '' : entry.actual,
      }))
    );

    if (!rows.length) {
      setNotification({
        id: Date.now(),
        title: 'No Data to Export',
        message: 'Train models first to generate predictions before exporting.',
        type: 'info',
      });
      return;
    }

    const csv = toCsv(rows);
    const stamp = new Date().toISOString().split('T')[0];
    triggerCsvDownload(csv, `ml_predictions_${selectedModel}_${stamp}.csv`);
    setNotification({
      id: Date.now(),
      title: 'Export Complete',
      message: `${formatNumber(rows.length)} prediction rows exported as CSV.`,
      type: 'success',
    });
  };

  return (
    <PageContainer className={styles.mlAnalyticsContainer}>
      {notification ? (
        <TopNotification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      ) : null}

      <MLHeader
        period={period}
        selectedModel={selectedModel}
        training={trainMutation.isPending}
        onPeriodChange={setPeriod}
        onModelChange={setSelectedModel}
        onTrain={handleTrainModels}
        onSchedule={() => setScheduleOpen(true)}
        onExport={handleExport}
      />

      {loading ? <LoadingState type="skeleton" variant="chart" /> : null}
      {errorMessage ? (
        <ErrorState
          title="Failed to load ML analytics"
          message={errorMessage}
          onRetry={() => {
            summaryQuery.refetch();
            salesMetricsQuery.refetch();
            expenseMetricsQuery.refetch();
          }}
        />
      ) : null}

      {!loading && !errorMessage ? (
        <>
          <section className={styles.statsGrid}>
            {cards.map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                value={card.value}
                change={card.change}
                changeType={card.changeType}
                icon={card.icon}
              />
            ))}
          </section>

          <ModelPerformance
            salesMetrics={salesMetricsQuery.data}
            expenseMetrics={expenseMetricsQuery.data}
            summary={summary}
          />

          <PredictionCharts summary={summary} selectedModel={selectedModel} />
          <PredictionTable summary={summary} selectedModel={selectedModel} />
        </>
      ) : null}

      <ScheduleReportModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        reportType={scheduleReportType(selectedModel)}
      />
    </PageContainer>
  );
}
