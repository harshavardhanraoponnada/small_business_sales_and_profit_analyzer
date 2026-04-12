import { AppButton } from '@/components/ui';

interface DashboardHeaderProps {
  onRefresh: () => void;
  refreshing?: boolean;
}

export default function DashboardHeader({ onRefresh, refreshing = false }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Performance Overview</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Live business metrics with role-based reporting.</p>
      </div>
      <AppButton variant="outline" onClick={onRefresh} loading={refreshing}>
        Refresh Data
      </AppButton>
    </div>
  );
}