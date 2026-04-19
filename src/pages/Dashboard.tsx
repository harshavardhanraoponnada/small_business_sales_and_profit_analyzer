import { useMemo, useState } from 'react';
import { PageContainer, LoadingState, ErrorState } from '@/components/ui';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import DashboardInsights from '@/components/dashboard/DashboardInsights';
import ExpenseAnalytics from '@/components/dashboard/ExpenseAnalytics';
import RecentSalesSection from '@/components/dashboard/RecentSalesSection';
import ScheduleReportModal from '@/components/reports/ScheduleReportModal';
import { useAuth } from '@/auth/authContext';
import { useExpenses, useProducts, useSales } from '@/hooks';
import {
  useDashboardSummary,
  useDashboardQuickStats,
  useLowStockAlerts,
  useSalesTrend,
  useProfitTrend,
} from '@/hooks/useDashboard';
import styles from './Dashboard.module.css';

interface DashboardProps {
  initialReportType?: string;
}

type DashboardState = {
  salesPeriod: 'daily' | 'weekly' | 'monthly' | 'max';
  expensesPeriod: 'daily' | 'weekly' | 'monthly' | 'max';
  profitPeriod: 'daily' | 'weekly' | 'monthly' | 'max';
  scheduleModalOpen: boolean;
  selectedReportType: string;
};

export default function Dashboard({ initialReportType = 'summary' }: DashboardProps) {
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';
  const canSchedule = user?.role === 'OWNER' || user?.role === 'ACCOUNTANT';

  const [salesPeriod, setSalesPeriod] = useState<DashboardState['salesPeriod']>('daily');
  const [expensesPeriod, setExpensesPeriod] = useState<DashboardState['expensesPeriod']>('daily');
  const [profitPeriod, setProfitPeriod] = useState<DashboardState['profitPeriod']>('daily');

  const [scheduleModalOpen, setScheduleModalOpen] = useState<DashboardState['scheduleModalOpen']>(false);
  const [selectedReportType, setSelectedReportType] = useState<DashboardState['selectedReportType']>(initialReportType);

  const salesQuery = useSales();
  const expensesQuery = useExpenses();
  const productsQuery = useProducts();

  const summaryQuery = useDashboardSummary('monthly', !isStaff);
  const salesQuickQuery = useDashboardQuickStats(salesPeriod);
  const expensesQuickQuery = useDashboardQuickStats(expensesPeriod);
  const profitQuickQuery = useDashboardQuickStats(profitPeriod);
  const lowStockQuery = useLowStockAlerts(10);

  const salesTrendQuery = useSalesTrend('monthly');
  const profitTrendQuery = useProfitTrend('monthly', undefined, undefined, !isStaff);

  const loading =
    salesQuery.isLoading ||
    expensesQuery.isLoading ||
    productsQuery.isLoading ||
    salesQuickQuery.isLoading ||
    expensesQuickQuery.isLoading ||
    profitQuickQuery.isLoading ||
    lowStockQuery.isLoading ||
    salesTrendQuery.isLoading ||
    (!isStaff && (summaryQuery.isLoading || profitTrendQuery.isLoading));

  const errorMessage = useMemo(() => {
    return (
      summaryQuery.error?.message ||
      salesQuery.error?.message ||
      expensesQuery.error?.message ||
      productsQuery.error?.message ||
      salesQuickQuery.error?.message ||
      expensesQuickQuery.error?.message ||
      profitQuickQuery.error?.message ||
      lowStockQuery.error?.message ||
      salesTrendQuery.error?.message ||
      profitTrendQuery.error?.message ||
      ''
    );
  }, [
    summaryQuery.error,
    salesQuery.error,
    expensesQuery.error,
    productsQuery.error,
    salesQuickQuery.error,
    expensesQuickQuery.error,
    profitQuickQuery.error,
    lowStockQuery.error,
    salesTrendQuery.error,
    profitTrendQuery.error,
  ]);

  const summary = {
    totalSales: summaryQuery.data?.totalSales || 0,
    totalExpenses: summaryQuery.data?.totalExpenses || 0,
    cogs: summaryQuery.data?.cogsFromExpenses ?? summaryQuery.data?.cogs ?? 0,
    netProfit:
      summaryQuery.data?.netProfit ?? summaryQuery.data?.profitV2 ?? summaryQuery.data?.profit ?? 0,
  };

  const quick = {
    sales: salesQuickQuery.data?.totalSales || 0,
    units: salesQuickQuery.data?.totalUnits || 0,
    expenses:
      expensesQuickQuery.data?.operatingExpenses ??
      ((expensesQuickQuery.data?.totalExpenses || 0) - (expensesQuickQuery.data?.cogsFromExpenses || 0)),
    profit:
      profitQuickQuery.data?.netProfit ??
      profitQuickQuery.data?.profitV2 ??
      profitQuickQuery.data?.profit ??
      0,
  };

  const expensesData = Array.isArray(expensesQuery.data)
    ? expensesQuery.data
    : (expensesQuery.data as any)?.data || [];

  const productsData = Array.isArray(productsQuery.data)
    ? productsQuery.data
    : (productsQuery.data as any)?.data || [];

  const hasStatsData =
    summary.totalSales > 0 ||
    summary.totalExpenses > 0 ||
    summary.netProfit > 0 ||
    quick.sales > 0 ||
    quick.units > 0 ||
    quick.expenses > 0 ||
    quick.profit > 0 ||
    (salesQuery.data?.length || 0) > 0 ||
    expensesData.length > 0 ||
    productsData.length > 0;

  const handleOpenSchedule = (type: string) => {
    setSelectedReportType(type);
    setScheduleModalOpen(true);
  };

  const handleRefresh = () => {
    summaryQuery.refetch();
    salesQuickQuery.refetch();
    expensesQuickQuery.refetch();
    profitQuickQuery.refetch();
    lowStockQuery.refetch();
    salesTrendQuery.refetch();
    profitTrendQuery.refetch();
  };

  return (
    <PageContainer className={styles.dashboard}>
      <DashboardHeader onRefresh={handleRefresh} refreshing={loading} />

      {loading ? <LoadingState type="skeleton" variant="chart" /> : null}
      {errorMessage ? (
        <ErrorState title="Failed to load dashboard" message={errorMessage} onRetry={handleRefresh} />
      ) : null}

      {!loading && !errorMessage ? (
        <>
          <div className={styles.statsGrid}>
            <DashboardStats
              isStaff={isStaff}
              salesPeriod={salesPeriod}
              expensesPeriod={expensesPeriod}
              profitPeriod={profitPeriod}
              loading={loading}
              hasData={hasStatsData}
              setSalesPeriod={setSalesPeriod}
              setExpensesPeriod={setExpensesPeriod}
              setProfitPeriod={setProfitPeriod}
              summary={summary}
              quick={quick}
              lowStock={lowStockQuery.data || []}
            />
          </div>

          <DashboardInsights
            sales={(salesQuery.data || []) as any[]}
            loading={salesQuery.isLoading}
            error={(salesQuery.error as any)?.message}
            lowStock={lowStockQuery.data || []}
          />

          <DashboardCharts
            isStaff={isStaff}
            canSchedule={canSchedule}
            loading={loading}
            error={errorMessage || undefined}
            onRetry={handleRefresh}
            salesTrend={salesTrendQuery.data || []}
            profitTrend={profitTrendQuery.data || []}
            onSchedule={handleOpenSchedule}
          />

          {!isStaff ? <ExpenseAnalytics canSchedule={canSchedule} onSchedule={handleOpenSchedule} /> : null}

          <RecentSalesSection
            sales={(salesQuery.data || []) as any[]}
            loading={salesQuery.isLoading}
            error={(salesQuery.error as any)?.message}
          />
        </>
      ) : null}

      <ScheduleReportModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        reportType={selectedReportType}
      />
    </PageContainer>
  );
}
