import { Download, Filter, RefreshCw } from 'lucide-react';
import { AppButton, AppInput, AppSelect } from '@/components/ui';

interface AuditHeaderProps {
  userFilter: string;
  actionFilter: string;
  dateFrom: string;
  dateTo: string;
  actionOptions: Array<{ label: string; value: string }>;
  disableExport?: boolean;
  exporting?: boolean;
  onUserFilterChange: (value: string) => void;
  onActionFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onExport: () => void;
}

export default function AuditHeader({
  userFilter,
  actionFilter,
  dateFrom,
  dateTo,
  actionOptions,
  disableExport = false,
  exporting = false,
  onUserFilterChange,
  onActionFilterChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  onRefresh,
  onExport,
}: AuditHeaderProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-[0_12px_34px_rgba(2,6,23,0.45)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">
        <Filter size={14} />
        Audit Filters
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AppInput
          label="User"
          value={userFilter}
          onChange={onUserFilterChange}
          placeholder="Filter by username or role"
        />

        <AppSelect
          label="Action"
          value={actionFilter}
          onChange={(value) => onActionFilterChange(String(value))}
          options={[{ label: 'All Actions', value: '' }, ...actionOptions]}
        />

        <AppInput
          label="Date From"
          type="date"
          value={dateFrom}
          onChange={onDateFromChange}
        />

        <AppInput
          label="Date To"
          type="date"
          value={dateTo}
          onChange={onDateToChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AppButton variant="secondary" onClick={onClearFilters}>Clear Filters</AppButton>
        <AppButton variant="outline" onClick={onRefresh}>
          <RefreshCw size={14} />
          Refresh
        </AppButton>
        <AppButton variant="primary" onClick={onExport} loading={exporting} disabled={disableExport}>
          <Download size={14} />
          Export CSV
        </AppButton>
      </div>
    </div>
  );
}
