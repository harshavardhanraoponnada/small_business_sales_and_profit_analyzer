import { Download, Eye, Pencil, Trash2 } from 'lucide-react';
import { DataTable, AppButton, ErrorState, EmptyState, LoadingState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';
import api from '@/services/api';

interface SalesTableProps {
  sales: any[];
  loading: boolean;
  error?: string;
  onEdit: (sale: any) => void;
  onDelete: (sale: any) => void;
  role?: string;
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const downloadInvoice = async (saleId: string) => {
  try {
    const response = await api.get(`/invoices/${saleId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${saleId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    alert('Failed to download invoice or not available');
  }
};

const viewDetails = (sale: any) => {
  const details = [
    `Sale ID: ${String(sale.id || '').slice(0, 8)}`,
    `Date: ${sale.date ? new Date(sale.date).toLocaleString() : '-'}`,
    `Customer: ${sale.customer_name || 'N/A'}`,
    `Product: ${sale.variant?.variant_name || sale.product?.name || 'Unknown'}`,
    `Quantity: ${Number(sale.quantity || 0)}`,
    `Unit Price: ₹${formatNumber(Number(sale.unit_price || 0))}`,
    `Total: ₹${formatNumber(Number(sale.total || 0))}`,
    `Notes: ${sale.notes || '-'}`,
  ].join('\n');

  window.alert(details);
};

export default function SalesTable({
  sales,
  loading,
  error,
  onEdit,
  onDelete,
  role,
  page,
  total,
  limit,
  onPageChange,
}: SalesTableProps) {
  if (loading) return <LoadingState type="skeleton" variant="table" />;
  if (error) return <ErrorState title="Sales load failed" message={error} />;
  if (!sales.length) {
    return <EmptyState title="No sales yet" description="Create your first sale from Add Sale." />;
  }

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
      key: 'customer_name',
      label: 'Customer',
      sortable: true,
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (_: unknown, row: any) => row.variant?.variant_name || row.product?.name || 'Unknown',
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
      render: (value: number) => `₹${formatNumber(value)}`,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value: number) => `₹${formatNumber(value)}`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: any) => (
        <div className="flex flex-wrap items-center gap-1">
          <AppButton variant="outline" size="sm" onClick={() => onEdit(row)}>
            <Pencil size={14} />
          </AppButton>
          <AppButton variant="danger" size="sm" onClick={() => onDelete(row)}>
            <Trash2 size={14} />
          </AppButton>
          {role !== 'STAFF' ? (
            <AppButton variant="secondary" size="sm" onClick={() => downloadInvoice(String(row.id))}>
              <Download size={14} />
            </AppButton>
          ) : null}
            <AppButton variant="ghost" size="sm" onClick={() => viewDetails(row)}>
              <Eye size={14} />
            </AppButton>
        </div>
      ),
    },
  ] as const;

  return (
    <DataTable
      columns={columns as any}
      data={sales}
      pagination={{
        page,
        limit,
        total,
        onPageChange,
      }}
    />
  );
}
