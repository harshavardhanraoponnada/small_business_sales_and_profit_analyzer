import { Package, ReceiptIndianRupee, TrendingUp, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { EmptyState, LoadingState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';
import type { LowStockItem } from '@/hooks/useDashboard';

interface DashboardStatsProps {
  isStaff: boolean;
  loading?: boolean;
  hasData?: boolean;
  salesPeriod: string;
  expensesPeriod: string;
  profitPeriod: string;
  setSalesPeriod: (value: 'daily' | 'weekly' | 'monthly' | 'max') => void;
  setExpensesPeriod: (value: 'daily' | 'weekly' | 'monthly' | 'max') => void;
  setProfitPeriod: (value: 'daily' | 'weekly' | 'monthly' | 'max') => void;
  summary: {
    totalSales: number;
    totalExpenses: number;
    cogs: number;
    netProfit: number;
  };
  quick: {
    sales: number;
    units: number;
    expenses: number;
    profit: number;
  };
  lowStock: LowStockItem[];
}

function ModernPeriodSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: 'daily' | 'weekly' | 'monthly' | 'max') => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as 'daily' | 'weekly' | 'monthly' | 'max')}
      className="mt-2 w-full rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:ring-blue-500/30"
    >
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
      <option value="max">Total</option>
    </select>
  );
}

const getPeriodLabel = (period: string): string => {
  const map: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    max: 'Total',
  };
  return map[period] || period;
};

export default function DashboardStats({
  isStaff,
  loading = false,
  hasData = true,
  salesPeriod,
  expensesPeriod,
  profitPeriod,
  setSalesPeriod,
  setExpensesPeriod,
  setProfitPeriod,
  summary,
  quick,
  lowStock,
}: DashboardStatsProps) {
  if (loading) {
    return <LoadingState type="skeleton" variant="card" />;
  }

  if (!hasData) {
    return <EmptyState title="No dashboard metrics yet" description="Sales and expenses will appear once data is available." />;
  }

  return (
    <>
      {/* Main Stats Grid - 4 Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Daily Sales Card */}
        <StatCard
          title={`${getPeriodLabel(salesPeriod)} Sales`}
          value={`₹${formatNumber(quick.sales)}`}
          icon="₹"
          extraContent={<ModernPeriodSelect value={salesPeriod} onChange={setSalesPeriod} />}
        />

        {/* COGS Card */}
        <StatCard title="COGS" value={`₹${formatNumber(summary.cogs)}`} icon={<Package />} />

        {/* Expenses Card */}
        {!isStaff ? (
          <StatCard
            title={`${getPeriodLabel(expensesPeriod)} Expenses`}
            value={`₹${formatNumber(quick.expenses)}`}
            icon={<ReceiptIndianRupee />}
            extraContent={<ModernPeriodSelect value={expensesPeriod} onChange={setExpensesPeriod} />}
          />
        ) : (
          <StatCard title="Units Sold" value={formatNumber(quick.units)} icon={<Package />} />
        )}

        {/* Profit Card */}
        {!isStaff ? (
          <StatCard
            title={`${getPeriodLabel(profitPeriod)} Net Profit`}
            value={`₹${formatNumber(quick.profit)}`}
            icon={<TrendingUp />}
            extraContent={<ModernPeriodSelect value={profitPeriod} onChange={setProfitPeriod} />}
          />
        ) : (
          <StatCard title="Low Stock Alerts" value={lowStock.length} icon={<AlertTriangle />} />
        )}
      </div>
    </>
  );
}
