import { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { DataTable, ErrorState, EmptyState, LoadingState, SearchInput } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';

interface SaleRow {
  id: string;
  date: string;
  quantity: number;
  unit_price: number;
  total: number;
  variant?: { variant_name?: string };
  product?: { name?: string };
}

interface RecentSalesSectionProps {
  sales: SaleRow[];
  loading: boolean;
  error?: string;
}

export default function RecentSalesSection({ sales, loading, error }: RecentSalesSectionProps) {
  const [search, setSearch] = useState('');

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    const recent = [...sales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    if (!query) return recent;

    return recent.filter((sale) => {
      const id = String(sale.id || '').toLowerCase();
      const product = String(sale.variant?.variant_name || sale.product?.name || 'Unknown').toLowerCase();
      const date = new Date(sale.date).toLocaleDateString().toLowerCase();
      return id.includes(query) || product.includes(query) || date.includes(query);
    });
  }, [sales, search]);

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Sale ID',
      sortable: true,
      render: (value: string) => value.slice(0, 8),
    },
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (_: unknown, row: SaleRow) => row.variant?.variant_name || row.product?.name || 'Unknown',
    },
    {
      key: 'quantity',
      label: 'Qty',
      sortable: true,
    },
    {
      key: 'unit_price',
      label: 'Unit Price',
      sortable: true,
      render: (value: number) => `₹${formatNumber(value || 0)}`,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value: number) => `₹${formatNumber(value || 0)}`,
    },
  ] as const;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Sales</h3>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by ID, product, or date..." />
        </div>
      </div>

      {loading ? <LoadingState type="skeleton" variant="table" /> : null}
      {!loading && error ? <ErrorState title="Failed to load recent sales" message={error} /> : null}
      {!loading && !error ? (
        filteredSales.length ? <DataTable columns={columns as any} data={filteredSales as any} /> : <EmptyState title="No recent sales" />
      ) : null}
    </section>
  );
}
