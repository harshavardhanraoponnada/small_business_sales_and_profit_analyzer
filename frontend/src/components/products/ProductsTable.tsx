import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, EmptyState, ErrorState, LoadingState, AppButton } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';

export interface ProductListItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category_id: string;
  category_name: string;
  stock: number;
  purchase_price: number;
  selling_price: number;
}

interface ProductsTableProps {
  products: ProductListItem[];
  loading: boolean;
  error?: string;
  page: number;
  limit: number;
  total: number;
  canDelete: boolean;
  onPageChange: (page: number) => void;
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
  onSelectionChange: (rows: ProductListItem[]) => void;
}

export default function ProductsTable({
  products,
  loading,
  error,
  page,
  limit,
  total,
  canDelete,
  onPageChange,
  onEdit,
  onDelete,
  onSelectionChange,
}: ProductsTableProps) {
  if (loading) return <LoadingState type="skeleton" variant="table" />;
  if (error) return <ErrorState title="Failed to load products" message={error} />;
  if (!products.length) {
    return <EmptyState title="No products found" description="Add a product or adjust filters to see results." />;
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'sku',
      label: 'SKU',
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
      render: (value: number) => formatNumber(value || 0),
    },
    {
      key: 'purchase_price',
      label: 'Purchase Price',
      sortable: true,
      render: (value: number) => `₹${formatNumber(value || 0)}`,
    },
    {
      key: 'selling_price',
      label: 'Selling Price',
      sortable: true,
      render: (value: number) => `₹${formatNumber(value || 0)}`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: ProductListItem) => (
        <div className="flex flex-wrap items-center gap-1">
          <AppButton variant="outline" size="sm" onClick={() => onEdit(row)}>
            <Pencil size={14} />
          </AppButton>
          {canDelete ? (
            <AppButton variant="danger" size="sm" onClick={() => onDelete(row)}>
              <Trash2 size={14} />
            </AppButton>
          ) : null}
        </div>
      ),
    },
  ] as const;

  return (
    <DataTable
      columns={columns as any}
      data={products as any}
      selectable
      onSelectionChange={(rows) => onSelectionChange(rows as ProductListItem[])}
      pagination={{
        page,
        limit,
        total,
        onPageChange,
      }}
    />
  );
}
