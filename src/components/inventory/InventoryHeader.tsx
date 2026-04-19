import { AppButton, SearchInput } from '@/components/ui';

interface InventoryHeaderProps {
  search: string;
  lowStockOnly: boolean;
  lowStockCount: number;
  disableAddStock?: boolean;
  onSearchChange: (value: string) => void;
  onLowStockToggle: (value: boolean) => void;
  onAddStockClick: () => void;
  onRefresh: () => void;
}

export default function InventoryHeader({
  search,
  lowStockOnly,
  lowStockCount,
  disableAddStock = false,
  onSearchChange,
  onLowStockToggle,
  onAddStockClick,
  onRefresh,
}: InventoryHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 lg:max-w-xl">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder="Search by SKU, name, brand, or category"
            />
          </div>
          <AppButton variant="primary" onClick={onAddStockClick} disabled={disableAddStock}>
            Adjust Stock
          </AppButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => onLowStockToggle(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span>Low stock only ({lowStockCount})</span>
          </label>
          <AppButton variant="outline" onClick={onRefresh}>
            Refresh
          </AppButton>
        </div>
      </div>
    </div>
  );
}
