import { AppButton, SearchInput } from '@/components/ui';

interface SalesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onRefresh: () => void;
  onExport: () => void;
  exporting?: boolean;
}

export default function SalesHeader({ search, onSearchChange, onAddClick, onRefresh, onExport, exporting = false }: SalesHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 lg:max-w-xl">
          <div className="min-w-0 flex-1">
            <SearchInput value={search} onChange={onSearchChange} placeholder="Search by sale id, product, or date" />
          </div>
          <AppButton variant="primary" onClick={onAddClick}>Add Sale</AppButton>
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="secondary" onClick={onExport} loading={exporting}>Export CSV</AppButton>
          <AppButton variant="outline" onClick={onRefresh}>Refresh</AppButton>
        </div>
      </div>
    </div>
  );
}
