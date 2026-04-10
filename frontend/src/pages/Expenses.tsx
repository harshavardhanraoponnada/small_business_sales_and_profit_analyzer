import { useMemo, useState } from 'react';
import { BarChart3, Calendar, FolderOpen, Inbox, ReceiptIndianRupee } from 'lucide-react';
import { ErrorState, LoadingState, PageContainer } from '@/components/ui';
import StatCard from '@/components/common/StatCard';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useExpenseMetadata,
  useExpenses,
  useTheme,
  useUpdateExpense,
} from '@/hooks';
import {
  CategoryBreakdown,
  CategoryCalendarToggle,
  ExpensesHeader,
  ExpensesModal,
  ExpensesTable,
  MonthlyExpenseChart,
} from '@/components/expenses';
import { formatNumber } from '@/utils/numberFormat';
import { buildExpenseCategoryMetaMap } from '@/utils/expenseCategoryMeta';
import TopNotification from '@/components/common/TopNotification';
import type {
  CategoryAmount,
  ExpenseThemePalette,
  MonthlyCategoryPoint,
} from '@/components/expenses/types';
import styles from './Expenses.module.css';

const ITEMS_PER_PAGE = 20;

type ExpenseRecord = {
  id: string | number;
  date?: string;
  category?: string;
  amount?: number;
  description?: string;
  vendor_name?: string;
  invoice_reference?: string;
  tax_amount?: number;
  payment_method?: string;
  affects_cogs_override?: boolean | null;
  file?: string;
  receipt_file?: string;
};

type ModalState =
  | { isOpen: false; mode: 'add'; expense?: undefined }
  | { isOpen: true; mode: 'add'; expense?: undefined }
  | { isOpen: true; mode: 'edit'; expense: ExpenseRecord };

type NotificationState = {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
} | null;

export default function Expenses() {
  const { isDarkMode } = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateFilterStartCategory, setDateFilterStartCategory] = useState('');
  const [dateFilterEndCategory, setDateFilterEndCategory] = useState('');
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add' });
  const [notification, setNotification] = useState<NotificationState>(null);

  const expensesQuery = useExpenses();
  const expenseCategoriesQuery = useExpenseCategories();
  const expenseMetadataQuery = useExpenseMetadata();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const expenses = (expensesQuery.data || []) as ExpenseRecord[];
  const categories = (expenseCategoriesQuery.data || []) as Array<{ name?: string; key?: string }>;

  const themeColors: ExpenseThemePalette = {
    background: isDarkMode ? '#020617' : '#f8fafc',
    surface: isDarkMode ? 'rgba(15,23,42,0.84)' : 'rgba(255,255,255,0.92)',
    text: isDarkMode ? '#e2e8f0' : '#0f172a',
    textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(71,85,105,0.72)' : 'rgba(148,163,184,0.34)',
    accent: '#0284c7',
    error: '#ef4444',
    success: '#10b981',
    accentSoft: isDarkMode ? 'rgba(14,165,233,0.22)' : 'rgba(14,165,233,0.16)',
    isDarkMode,
  };

  const categoryOptions = useMemo(() => {
    const names = categories
      .map((item) => String(item?.name || '').trim())
      .filter(Boolean);

    const uniqueNames = Array.from(new Set(names));
    return uniqueNames.map((name) => ({ label: name, value: name }));
  }, [categories]);

  const categoryMetaMap = useMemo(() => {
    return buildExpenseCategoryMetaMap(categories as any[]);
  }, [categories]);

  const paymentMethodOptions = useMemo(() => {
    const paymentMethods = expenseMetadataQuery.data?.paymentMethods?.length
      ? expenseMetadataQuery.data.paymentMethods
      : ['Cash', 'UPI', 'Card', 'Bank transfer', 'Cheque', 'Credit', 'Other'];
    return paymentMethods.map((method) => ({ label: method, value: method }));
  }, [expenseMetadataQuery.data]);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const expenseCategory = String(expense.category || '').toLowerCase();
      const expenseDescription = String(expense.description || '').toLowerCase();
      const expenseDate = expense.date ? new Date(expense.date) : null;

      const matchesSearch = !query || expenseCategory.includes(query) || expenseDescription.includes(query);
      const matchesCategory = !category || expenseCategory === category.toLowerCase();

      let matchesFrom = true;
      if (dateFrom && expenseDate) {
        const from = new Date(`${dateFrom}T00:00:00`);
        matchesFrom = expenseDate >= from;
      }

      let matchesTo = true;
      if (dateTo && expenseDate) {
        const to = new Date(`${dateTo}T23:59:59`);
        matchesTo = expenseDate <= to;
      }

      return matchesSearch && matchesCategory && matchesFrom && matchesTo;
    });
  }, [expenses, search, category, dateFrom, dateTo]);

  const pagedExpenses = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, page]);

  const categoryData = useMemo<CategoryAmount[]>(() => {
    const grouped = expenses.reduce<Record<string, number>>((acc, expense) => {
      const categoryName = String(expense.category || 'Misc');
      acc[categoryName] = (acc[categoryName] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([categoryName, amount]) => ({
      category: categoryName,
      amount,
    }));
  }, [expenses]);

  const monthlyData = useMemo<MonthlyCategoryPoint[]>(() => {
    const grouped = expenses.reduce<Record<string, { total: number; categories: Record<string, number> }>>((acc, expense) => {
      if (!expense.date) return acc;

      const date = new Date(expense.date);
      if (Number.isNaN(date.getTime())) return acc;

      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const categoryName = String(expense.category || 'Misc');
      const amount = Number(expense.amount || 0);

      if (!acc[month]) {
        acc[month] = { total: 0, categories: {} };
      }

      acc[month].total += amount;
      acc[month].categories[categoryName] = (acc[month].categories[categoryName] || 0) + amount;

      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([month, value]) => ({
        month,
        total: value.total,
        categories: value.categories,
      }));
  }, [expenses]);

  const filteredExpensesCategory = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = expense.date ? new Date(expense.date) : null;
      if (!expenseDate || Number.isNaN(expenseDate.getTime())) return false;

      if (dateFilterStartCategory) {
        const fromDate = new Date(`${dateFilterStartCategory}T00:00:00`);
        if (expenseDate < fromDate) return false;
      }

      if (dateFilterEndCategory) {
        const toDate = new Date(`${dateFilterEndCategory}T23:59:59`);
        if (expenseDate > toDate) return false;
      }

      return true;
    });
  }, [expenses, dateFilterStartCategory, dateFilterEndCategory]);

  const filteredCategoryData = useMemo<CategoryAmount[]>(() => {
    const grouped = filteredExpensesCategory.reduce<Record<string, number>>((acc, expense) => {
      const categoryName = String(expense.category || 'Misc');
      acc[categoryName] = (acc[categoryName] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([categoryName, amount]) => ({
      category: categoryName,
      amount,
    }));
  }, [filteredExpensesCategory]);

  const stats = useMemo(() => {
    const now = new Date();

    const total = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const thisMonth = filteredExpenses
      .filter((expense) => {
        if (!expense.date) return false;
        const d = new Date(expense.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      total,
      thisMonth,
      count: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  const resetPage = () => setPage(1);

  const handleSaveExpense = async (payload: {
    category: string;
    date: string;
    amount: number;
    vendor_name: string;
    invoice_reference: string;
    tax_amount: number;
    payment_method: string;
    affects_cogs_override?: boolean | null;
    description: string;
    file?: File | null;
  }) => {
    const basePayload = {
      category: payload.category,
      date: payload.date,
      amount: payload.amount,
      vendor_name: payload.vendor_name,
      invoice_reference: payload.invoice_reference,
      tax_amount: payload.tax_amount,
      payment_method: payload.payment_method,
      description: payload.description,
    };

    const createPayloadWithoutFile = {
      ...basePayload,
      ...(typeof payload.affects_cogs_override === 'boolean'
        ? { affects_cogs_override: payload.affects_cogs_override }
        : {}),
    };

    const updatePayloadWithoutFile = {
      ...basePayload,
      ...(payload.affects_cogs_override !== undefined
        ? { affects_cogs_override: payload.affects_cogs_override }
        : {}),
    };

    const toFormData = (data: Record<string, any>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value === null ? '' : String(value));
      });
      if (payload.file) {
        formData.append('file', payload.file);
      }
      return formData;
    };

    const isAddMode = modalState.mode === 'add';

    try {
      if (isAddMode) {
        if (payload.file) {
          await createExpense.mutateAsync(toFormData(createPayloadWithoutFile));
        } else {
          await createExpense.mutateAsync(createPayloadWithoutFile);
        }
      } else {
        if (payload.file) {
          await updateExpense.mutateAsync({
            id: modalState.expense.id,
            data: toFormData(updatePayloadWithoutFile),
          });
        } else {
          await updateExpense.mutateAsync({
            id: modalState.expense.id,
            data: updatePayloadWithoutFile,
          });
        }
      }

      const amountLabel = `₹${formatNumber(Number(payload.amount || 0))}`;
      setNotification({
        id: Date.now(),
        title: isAddMode ? 'Expense Added' : 'Expense Updated',
        message: `${payload.category} • ${amountLabel} • ${payload.date || 'Date not provided'}`,
        type: 'success',
      });

      setModalState({ isOpen: false, mode: 'add' });
    } catch (error: any) {
      const backendValidationDetails =
        error?.details?.details ||
        error?.details?.error ||
        error?.details?.message ||
        '';

      const errorMessage = backendValidationDetails
        ? `${String(error?.message || 'Request failed')}: ${String(backendValidationDetails)}`
        : String(error?.message || 'Please check the form values and try again.');

      setNotification({
        id: Date.now(),
        title: isAddMode ? 'Expense Add Failed' : 'Expense Update Failed',
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const handleDelete = async (expense: ExpenseRecord) => {
    if (!window.confirm(`Delete expense ${String(expense.id)}?`)) return;
    await deleteExpense.mutateAsync(expense.id);
  };

  const handleMutationError =
    (createExpense.error as any)?.message ||
    (updateExpense.error as any)?.message ||
    (deleteExpense.error as any)?.message ||
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

      <div className={styles.expensesContainer}>
        <section className={styles.hero}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Finance Intelligence</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Expense Command Center</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Track spending, audit trends, and manage receipts in one premium workspace.</p>
        </section>

        <div className={styles.statsGrid}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Total Expenses" value={`₹${formatNumber(stats.total)}`} icon={<ReceiptIndianRupee />} />
          <StatCard title="This Month" value={`₹${formatNumber(stats.thisMonth)}`} icon={<Calendar />} />
          <StatCard title="Records" value={formatNumber(stats.count)} icon={<FolderOpen />} />
          </div>
        </div>

        <ExpensesHeader
          search={search}
          category={category}
          dateFrom={dateFrom}
          dateTo={dateTo}
          categories={categoryOptions}
          onSearchChange={(value) => {
            setSearch(value);
            resetPage();
          }}
          onCategoryChange={(value) => {
            setCategory(value);
            resetPage();
          }}
          onDateFromChange={(value) => {
            setDateFrom(value);
            resetPage();
          }}
          onDateToChange={(value) => {
            setDateTo(value);
            resetPage();
          }}
          onClearFilters={() => {
            setSearch('');
            setCategory('');
            setDateFrom('');
            setDateTo('');
            resetPage();
          }}
          onRefresh={() => {
            expensesQuery.refetch();
            expenseCategoriesQuery.refetch();
            expenseMetadataQuery.refetch();
          }}
          onAddClick={() => setModalState({ isOpen: true, mode: 'add' })}
        />

        {expensesQuery.isLoading ? <LoadingState type="skeleton" variant="table" /> : null}

        {expensesQuery.error ? (
          <ErrorState
            title="Failed to load expenses"
            message={(expensesQuery.error as any)?.message || 'Unknown error'}
            onRetry={() => expensesQuery.refetch()}
          />
        ) : null}

        {!expensesQuery.isLoading && !expensesQuery.error ? (
          <div className={`${styles.panel} ${styles.table}`}>
            <h2 className={styles.panelTitle}>Expense Ledger</h2>
            <ExpensesTable
              expenses={pagedExpenses}
              loading={false}
              error={handleMutationError || undefined}
              page={page}
              limit={ITEMS_PER_PAGE}
              total={filteredExpenses.length}
              onPageChange={setPage}
              onEdit={(expense) => setModalState({ isOpen: true, mode: 'edit', expense })}
              onDelete={handleDelete}
            />
          </div>
        ) : null}

        {!expensesQuery.isLoading && !expensesQuery.error ? (
          <>
            <div className={styles.analyticsStack}>
              <CategoryBreakdown
                categoryData={filteredCategoryData}
                theme={themeColors}
                categoryMetaMap={categoryMetaMap}
                dateFilterStart={dateFilterStartCategory}
                dateFilterEnd={dateFilterEndCategory}
                onDateFilterStartChange={setDateFilterStartCategory}
                onDateFilterEndChange={setDateFilterEndCategory}
                onClearDateFilter={() => {
                  setDateFilterStartCategory('');
                  setDateFilterEndCategory('');
                }}
              />
              <MonthlyExpenseChart
                monthlyData={monthlyData}
                theme={themeColors}
                categoryMetaMap={categoryMetaMap}
              />
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>
                <BarChart3 size={24} /> Expense History
              </h2>

              {expenses.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center py-10 text-center text-slate-600 dark:text-slate-400">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300/40 bg-slate-100/70 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    <Inbox size={30} />
                  </div>
                  <div className="text-lg font-semibold">No expenses yet</div>
                  <div className="mt-1 text-sm">Add your first expense above!</div>
                </div>
              ) : (
                <CategoryCalendarToggle
                  expenses={expenses}
                  theme={themeColors}
                  categoryData={categoryData}
                  categoryMetaMap={categoryMetaMap}
                />
              )}
            </div>
          </>
        ) : null}
      </div>

      <ExpensesModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialExpense={modalState.mode === 'edit' ? modalState.expense : undefined}
        categories={categoryOptions}
        paymentMethods={paymentMethodOptions}
        loading={createExpense.isPending || updateExpense.isPending}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        onSave={handleSaveExpense}
      />
    </PageContainer>
  );
}
