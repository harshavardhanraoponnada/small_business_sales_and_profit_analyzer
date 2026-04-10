import { History, Pencil } from 'lucide-react';
import { AppButton, DataTable, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';
import type { InventoryProduct } from './types';

interface InventoryTableProps {
  products: InventoryProduct[];
  loading: boolean;
  error?: string;
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onAdjustStock: (product: InventoryProduct) => void;
  onViewHistory: (product: InventoryProduct) => void;
}

const LOW_STOCK_THRESHOLD = 10;

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const getReorderQuantity = (product: InventoryProduct) => {
  const target = Math.max(LOW_STOCK_THRESHOLD, Number(product.reorder_level || 0));
  return Math.max(target - Number(product.stock || 0), 0);
};

const getStatus = (stock: number) => {
  if (stock <= 0) {
    return { label: 'Out of stock', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
  }

  if (stock < LOW_STOCK_THRESHOLD) {
    return { label: 'Low stock', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  }

  return { label: 'Healthy', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
};

export default function InventoryTable({
  products,
  loading,
  error,
  page,
  total,
  limit,
  onPageChange,
  onAdjustStock,
  onViewHistory,
}: InventoryTableProps) {
  if (loading) return <LoadingState type="skeleton" variant="table" />;
  if (error) return <ErrorState title="Failed to load inventory" message={error} />;
  if (!products.length) {
    return <EmptyState title="No products found" description="Adjust filters or add products to see stock levels." />;
  }

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Product',
      sortable: true,
    },
    {
      key: 'brand',
      label: 'Brand',
      sortable: true,
    },
    {
      key: 'category_name',
      label: 'Category',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (value: number) => {
        const stock = Number(value || 0);
        const isLow = stock < LOW_STOCK_THRESHOLD;

        return (
          <span className={isLow ? 'font-semibold text-rose-600 dark:text-rose-300' : ''}>
            {formatNumber(stock)}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: InventoryProduct) => {
        const status = getStatus(Number(row.stock || 0));
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'reorder',
      label: 'Reorder Qty',
      sortable: true,
      render: (_: unknown, row: InventoryProduct) => formatNumber(getReorderQuantity(row)),
    },
    {
      key: 'updated_at',
      label: 'Last Change',
      sortable: true,
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: InventoryProduct) => (
        <div className="flex flex-wrap items-center gap-1">
          <AppButton variant="outline" size="sm" onClick={() => onAdjustStock(row)}>
            <Pencil size={14} />
          </AppButton>
          <AppButton variant="ghost" size="sm" onClick={() => onViewHistory(row)}>
            <History size={14} />
          </AppButton>
        </div>
      ),
    },
  ] as const;

  return (
    <DataTable
      columns={columns as any}
      data={products as any}
      pagination={{
        page,
        limit,
        total,
        onPageChange,
      }}
    />
  );
}
