import { Download, Eye, Pencil, Trash2 } from 'lucide-react';
import { AppButton, DataTable, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';

interface ExpenseRow {
  id: string | number;
  date?: string;
  category?: string;
  amount?: number;
  tax_amount?: number;
  vendor_name?: string;
  invoice_reference?: string;
  payment_method?: string;
  affects_cogs_override?: boolean | null;
  description?: string;
  file?: string;
  receipt_file?: string;
}

interface ExpensesTableProps {
  expenses: ExpenseRow[];
  loading: boolean;
  error?: string;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (expense: ExpenseRow) => void;
  onDelete: (expense: ExpenseRow) => void;
}

const getUploadUrl = (fileName: string) => {
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${base}/uploads/expense_uploads/${fileName}`;
};

const viewExpenseDetails = (expense: ExpenseRow) => {
  const cogsLabel =
    expense.affects_cogs_override === true
      ? 'Force include in COGS'
      : expense.affects_cogs_override === false
        ? 'Force exclude from COGS'
        : 'Use category default';

  const details = [
    `Expense ID: ${String(expense.id || '').slice(0, 8)}`,
    `Date: ${expense.date ? new Date(expense.date).toLocaleString() : '-'}`,
    `Category: ${expense.category || '-'}`,
    `Amount: ₹${formatNumber(Number(expense.amount || 0))}`,
    `GST/Tax: ₹${formatNumber(Number(expense.tax_amount || 0))}`,
    `Vendor/Payee: ${expense.vendor_name || '-'}`,
    `Invoice Ref: ${expense.invoice_reference || '-'}`,
    `Payment Method: ${expense.payment_method || '-'}`,
    `COGS Impact: ${cogsLabel}`,
    `Description: ${expense.description || '-'}`,
    `Receipt: ${expense.receipt_file || expense.file || 'Not uploaded'}`,
  ].join('\n');

  window.alert(details);
};

const escapeHtml = (value: unknown) =>
  String(value ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const isImageFile = (fileName: string) => /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName);

const downloadExpenseDetails = (expense: ExpenseRow) => {
  const receiptFile = String(expense.receipt_file || expense.file || '');
  const receiptUrl = receiptFile ? getUploadUrl(receiptFile) : '';
  const cogsLabel =
    expense.affects_cogs_override === true
      ? 'Force include in COGS'
      : expense.affects_cogs_override === false
        ? 'Force exclude from COGS'
        : 'Use category default';

  const details = [
    ['Expense ID', String(expense.id || '-')],
    ['Date', expense.date ? new Date(expense.date).toLocaleString() : '-'],
    ['Category', expense.category || '-'],
    ['Amount', `₹${formatNumber(Number(expense.amount || 0))}`],
    ['GST/Tax', `₹${formatNumber(Number(expense.tax_amount || 0))}`],
    ['Vendor/Payee', expense.vendor_name || '-'],
    ['Invoice Ref', expense.invoice_reference || '-'],
    ['Payment Method', expense.payment_method || '-'],
    ['COGS Impact', cogsLabel],
    ['Description', expense.description || '-'],
    ['Receipt File', receiptFile || 'Not uploaded'],
  ];

  const rows = details
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  const receiptSection = !receiptFile
    ? '<p class="muted">No receipt uploaded for this expense.</p>'
    : isImageFile(receiptFile)
      ? `<img src="${escapeHtml(receiptUrl)}" alt="Expense receipt" />`
      : `<p class="muted">Receipt file: <a href="${escapeHtml(receiptUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(receiptFile)}</a></p>`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Expense ${escapeHtml(String(expense.id || ''))}</title>
  <style>
    body { font-family: "Segoe UI", Tahoma, sans-serif; margin: 24px; color: #0f172a; }
    h1 { margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin-top: 14px; }
    th, td { border: 1px solid #cbd5e1; text-align: left; padding: 10px; vertical-align: top; }
    th { width: 210px; background: #f8fafc; }
    .section { margin-top: 24px; }
    img { max-width: 100%; max-height: 520px; border: 1px solid #cbd5e1; border-radius: 8px; }
    .muted { color: #475569; margin: 0; }
  </style>
</head>
<body>
  <h1>Expense Detail Report</h1>
  <p class="muted">Generated on ${escapeHtml(new Date().toLocaleString())}</p>
  <table>
    <tbody>${rows}</tbody>
  </table>
  <div class="section">
    <h2>Uploaded Receipt</h2>
    ${receiptSection}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const normalizedDate = expense.date ? new Date(expense.date).toISOString().split('T')[0] : 'expense';
  link.href = url;
  link.download = `expense_${String(expense.id || '').slice(0, 8)}_${normalizedDate}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function ExpensesTable({
  expenses,
  loading,
  error,
  page,
  limit,
  total,
  onPageChange,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  if (loading) return <LoadingState type="skeleton" variant="table" />;
  if (error) return <ErrorState title="Failed to load expenses" message={error} />;
  if (!expenses.length) return <EmptyState title="No expenses found" description="Add your first expense to get started." />;

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number) => `₹${formatNumber(Number(value || 0))}`,
    },
    {
      key: 'vendor_name',
      label: 'Vendor/Payee',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'payment_method',
      label: 'Payment',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: ExpenseRow) => (
        <div className="flex flex-wrap items-center gap-1">
          <AppButton variant="ghost" size="sm" className="rounded-lg" onClick={() => viewExpenseDetails(row)}>
            <Eye size={14} />
          </AppButton>
          <AppButton variant="outline" size="sm" className="rounded-lg" onClick={() => onEdit(row)}>
            <Pencil size={14} />
          </AppButton>
          <AppButton variant="danger" size="sm" className="rounded-lg" onClick={() => onDelete(row)}>
            <Trash2 size={14} />
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            className="rounded-lg"
            onClick={() => downloadExpenseDetails(row)}
          >
            <Download size={14} />
          </AppButton>
        </div>
      ),
    },
  ] as const;

  return (
    <DataTable
      columns={columns as any}
      data={expenses as any}
      pagination={{
        page,
        limit,
        total,
        onPageChange,
      }}
    />
  );
}
