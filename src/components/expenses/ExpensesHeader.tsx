import { AppButton, SearchInput, AppSelect, AppInput } from '@/components/ui';
import { Plus, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface ExpensesHeaderProps {
  search: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  categories: Array<{ label: string; value: string }>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onAddClick: () => void;
}

export default function ExpensesHeader({
  search,
  category,
  dateFrom,
  dateTo,
  categories,
  onSearchChange,
  onCategoryChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  onRefresh,
  onAddClick,
}: ExpensesHeaderProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-[0_12px_34px_rgba(2,6,23,0.45)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">
        <SlidersHorizontal size={14} />
        Filters & Actions
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchInput value={search} onChange={onSearchChange} placeholder="Search description or category" />
        <AppSelect
          value={category}
          onChange={(value) => onCategoryChange(String(value))}
          options={[{ label: 'All Categories', value: '' }, ...categories]}
          placeholder="Filter by category"
        />
        <AppInput type="date" value={dateFrom} onChange={onDateFromChange} />
        <AppInput type="date" value={dateTo} onChange={onDateToChange} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AppButton variant="secondary" onClick={onClearFilters}>Clear Filters</AppButton>
        <AppButton variant="outline" onClick={onRefresh}>
          <RefreshCw size={14} />
          Refresh
        </AppButton>
        <AppButton variant="primary" onClick={onAddClick}>
          <Plus size={14} />
          Add Expense
        </AppButton>
      </div>
    </div>
  );
}
