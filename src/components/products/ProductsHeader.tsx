import { Grid3X3, List, PackagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { AppButton, AppSelect, SearchInput } from '@/components/ui';

interface OptionItem {
  label: string;
  value: string;
}

interface ProductsHeaderProps {
  search: string;
  categoryFilter: string;
  brandFilter: string;
  categories: OptionItem[];
  brands: OptionItem[];
  viewMode: 'table' | 'grid';
  selectedCount: number;
  canDelete: boolean;
  exporting?: boolean;
  deletingSelected?: boolean;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onBrandFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onAddClick: () => void;
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onExport: () => void;
  onBulkDelete: () => void;
}

export default function ProductsHeader({
  search,
  categoryFilter,
  brandFilter,
  categories,
  brands,
  viewMode,
  selectedCount,
  canDelete,
  exporting = false,
  deletingSelected = false,
  onSearchChange,
  onCategoryFilterChange,
  onBrandFilterChange,
  onClearFilters,
  onRefresh,
  onAddClick,
  onViewModeChange,
  onExport,
  onBulkDelete,
}: ProductsHeaderProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-[0_12px_34px_rgba(2,6,23,0.45)]">
      <div className="grid gap-3 md:grid-cols-[1.8fr_1fr_1fr]">
        <SearchInput value={search} onChange={onSearchChange} placeholder="Search by name, SKU, brand, or category" />

        <AppSelect
          value={categoryFilter}
          onChange={(value) => onCategoryFilterChange(String(value))}
          options={[{ label: 'All Categories', value: '' }, ...categories]}
          placeholder="Category"
        />

        <AppSelect
          value={brandFilter}
          onChange={(value) => onBrandFilterChange(String(value))}
          options={[{ label: 'All Brands', value: '' }, ...brands]}
          placeholder="Brand"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
          <AppButton
            variant={viewMode === 'table' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
          >
            <List size={14} />
            Table
          </AppButton>
          <AppButton
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 size={14} />
            Grid
          </AppButton>
        </div>

        <AppButton variant="secondary" size="sm" onClick={onClearFilters}>
          Clear Filters
        </AppButton>

        <AppButton variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw size={14} />
          Refresh
        </AppButton>

        <AppButton variant="secondary" size="sm" onClick={onExport} loading={exporting}>
          Export CSV
        </AppButton>

        {canDelete ? (
          <AppButton
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            loading={deletingSelected}
            disabled={selectedCount === 0}
          >
            <Trash2 size={14} />
            Delete Selected ({selectedCount})
          </AppButton>
        ) : null}

        <div className="ml-auto">
          <AppButton variant="primary" size="sm" onClick={onAddClick}>
            <PackagePlus size={14} />
            Add Product
          </AppButton>
        </div>
      </div>
    </div>
  );
}
