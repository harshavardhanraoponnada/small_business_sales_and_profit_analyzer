import { useMemo, useState } from 'react';
import { Calendar, IndianRupee, Package } from 'lucide-react';
import { PageContainer, ErrorState, LoadingState } from '@/components/ui';
import StatCard from '@/components/common/StatCard';
import { useAuth } from '@/auth/authContext';
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from '@/hooks';
import { SalesHeader, SalesTable, SalesModal } from '@/components/sales';
import { formatNumber } from '@/utils/numberFormat';
import TopNotification from '@/components/common/TopNotification';
import styles from './Sales.module.css';

const ITEMS_PER_PAGE = 20;

type ModalState =
  | { isOpen: false; mode: 'add'; sale?: undefined }
  | { isOpen: true; mode: 'add'; sale?: undefined }
  | { isOpen: true; mode: 'edit'; sale: any };

type NotificationState = {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
} | null;

export default function Sales() {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add' });
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);

  const salesQuery = useSales();
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const deleteSale = useDeleteSale();

  const sales = (salesQuery.data || []) as any[];

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sales;

    return sales.filter((sale) => {
      const id = String(sale.id || '').toLowerCase();
      const product = String(sale.variant?.variant_name || sale.product?.name || '').toLowerCase();
      const date = new Date(sale.date).toLocaleDateString().toLowerCase();
      return id.includes(query) || product.includes(query) || date.includes(query);
    });
  }, [sales, search]);

  const pagedSales = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSales, page]);

  const stats = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const thisMonthSales = sales
      .filter((sale) => {
        const d = new Date(sale.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    const itemsSold = sales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0);

    return { totalSales, thisMonthSales, itemsSold };
  }, [sales]);

  const handleDelete = async (sale: any) => {
    if (!window.confirm(`Delete sale ${String(sale.id).slice(0, 8)}?`)) return;
    await deleteSale.mutateAsync(sale.id);
  };

  const handleSaveSale = async (payload: { customer_name?: string; variant_id?: string; quantity: number; unit_price: number; notes?: string }) => {
    const isAddMode = modalState.mode === 'add';

    if (isAddMode) {
      const createPayload: any = {
        customer_name: payload.customer_name,
        variant_id: payload.variant_id,
        quantity: payload.quantity,
        notes: payload.notes,
      };

      if (Number(payload.unit_price) > 0) {
        createPayload.unit_price = payload.unit_price;
      }

      await createSale.mutateAsync({
        ...createPayload,
      });
    } else {
      await updateSale.mutateAsync({
        id: modalState.sale.id,
        data: {
          customer_name: payload.customer_name,
          quantity: payload.quantity,
          unit_price: payload.unit_price,
          notes: payload.notes || '',
        },
      });
    }

    const totalAmount = Number(payload.quantity || 0) * Number(payload.unit_price || 0);
    setNotification({
      id: Date.now(),
      title: isAddMode ? 'Sale Added' : 'Sale Updated',
      message: `${payload.customer_name || 'Customer'} • Qty ${Number(payload.quantity || 0)} • ₹${formatNumber(totalAmount)}`,
      type: 'success',
    });

    setModalState({ isOpen: false, mode: 'add' });
  };

  const handleExportCsv = () => {
    if (!filteredSales.length) return;

    setIsExporting(true);
    try {
      const headers = ['Date', 'Sale ID', 'Product', 'Quantity', 'Unit Price', 'Total'];
      const rows = filteredSales.map((sale) => [
        new Date(sale.date).toLocaleDateString(),
        String(sale.id || ''),
        String(sale.variant?.variant_name || sale.product?.name || 'Unknown'),
        String(Number(sale.quantity || 0)),
        String(Number(sale.unit_price || 0)),
        String(Number(sale.total || 0)),
      ]);

      const toCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => toCsvCell(cell)).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const formMutationError =
    (createSale.error as any)?.message ||
    (updateSale.error as any)?.message ||
    '';

  const tableMutationError =
    (deleteSale.error as any)?.message ||
    '';

  return (
    <PageContainer>
      {notification ? (
        <TopNotification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      ) : null}

      <div className={styles.salesContainer}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Total Sales" value={`₹${formatNumber(stats.totalSales)}`} icon={<IndianRupee />} />
          <StatCard title="This Month" value={`₹${formatNumber(stats.thisMonthSales)}`} icon={<Calendar />} />
          <StatCard title="Items Sold" value={formatNumber(stats.itemsSold)} icon={<Package />} />
        </div>

        <SalesHeader
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onRefresh={() => salesQuery.refetch()}
          onAddClick={() => setModalState({ isOpen: true, mode: 'add' })}
          onExport={handleExportCsv}
          exporting={isExporting}
        />

        {salesQuery.isLoading ? <LoadingState type="skeleton" variant="table" /> : null}
        {salesQuery.error ? (
          <ErrorState
            title="Failed to load sales"
            message={(salesQuery.error as any)?.message || 'Unknown error'}
            onRetry={() => salesQuery.refetch()}
          />
        ) : null}

        {!salesQuery.isLoading && !salesQuery.error ? (
          <div className={styles.table}>
            <SalesTable
              sales={pagedSales}
              loading={false}
              error={tableMutationError || undefined}
              onEdit={(sale) => setModalState({ isOpen: true, mode: 'edit', sale })}
              onDelete={handleDelete}
              role={user?.role}
              page={page}
              total={filteredSales.length}
              limit={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>

      <SalesModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialSale={modalState.mode === 'edit' ? modalState.sale : undefined}
        loading={createSale.isPending || updateSale.isPending}
        error={formMutationError || undefined}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        onSave={handleSaveSale}
      />
    </PageContainer>
  );
}
