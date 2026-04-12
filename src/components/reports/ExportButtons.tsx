import { useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AppButton } from '@/components/ui';
import { apiGet } from '@/services/api';

interface ExportButtonsProps {
  reportType: string;
  disabled?: boolean;
  range?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'max' | 'custom';
  startDate?: string;
  endDate?: string;
}

type ExportFormat = 'pdf' | 'csv';

type ExportRow = Record<string, string | number | boolean | null | undefined>;

const unwrapPayload = <T,>(payload: any): T => {
  if (payload && typeof payload === 'object' && payload.data !== undefined) {
    return payload.data as T;
  }

  return payload as T;
};

const sanitizeCell = (value: unknown) => {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const quoteCsv = (value: unknown) => `"${sanitizeCell(value).replace(/"/g, '""')}"`;

const buildRangeQuery = (range: ExportButtonsProps['range'], startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  const selectedRange = range || 'monthly';
  params.set('range', selectedRange);

  if (selectedRange === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }

  return params.toString();
};

const normalizeRows = (reportType: string, source: any): { title: string; rows: ExportRow[] } => {
  if (reportType === 'summary') {
    const summary = source && typeof source === 'object' ? source : {};
    const rows = Object.entries(summary)
      .filter(([, value]) => typeof value !== 'object')
      .map(([metric, value]) => ({ metric, value }));

    return { title: 'Summary Report', rows };
  }

  if (reportType === 'sales-trend') {
    const rows = Array.isArray(source)
      ? source.map((item) => ({ date: item.date, sales: item.sales }))
      : [];
    return { title: 'Sales Trend Report', rows };
  }

  if (reportType === 'profit-trend') {
    const rows = Array.isArray(source)
      ? source.map((item) => ({ date: item.date, profit: item.profit }))
      : [];
    return { title: 'Profit Trend Report', rows };
  }

  if (reportType === 'expense-distribution') {
    const rows = Array.isArray(source)
      ? source.map((item) => ({ category: item.category, amount: item.amount }))
      : [];
    return { title: 'Expense Distribution Report', rows };
  }

  if (reportType === 'expenses') {
    const trendRows = Array.isArray(source?.trend)
      ? source.trend.map((item: any) => ({
          section: 'trend',
          date: item.date,
          amount: item.amount,
        }))
      : [];

    const distributionRows = Array.isArray(source?.distribution)
      ? source.distribution.map((item: any) => ({
          section: 'distribution',
          category: item.category,
          amount: item.amount,
        }))
      : [];

    return {
      title: 'Expense Analytics Report',
      rows: [...trendRows, ...distributionRows],
    };
  }

  if (Array.isArray(source)) {
    return {
      title: `${reportType} Report`,
      rows: source.map((item) => (typeof item === 'object' && item !== null ? item : { value: item })),
    };
  }

  return {
    title: `${reportType} Report`,
    rows:
      source && typeof source === 'object'
        ? Object.entries(source).map(([key, value]) => ({ key, value: sanitizeCell(value) }))
        : [],
  };
};

const reportEndpointFor = (reportType: string, query: string) => {
  switch (reportType) {
    case 'summary':
      return `/reports/summary?${query}`;
    case 'sales-trend':
      return `/reports/sales-trend?${query}`;
    case 'profit-trend':
      return `/reports/profit-trend?${query}`;
    case 'expense-distribution':
      return `/reports/expense-distribution?${query}`;
    case 'expenses':
      return `/reports/expenses?${query}`;
    default:
      return `/reports/summary?${query}`;
  }
};

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function ExportButtons({
  reportType,
  disabled = false,
  range = 'monthly',
  startDate,
  endDate,
}: ExportButtonsProps) {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filePrefix = useMemo(() => reportType.replace(/[^a-z0-9\-]+/gi, '_').toLowerCase(), [reportType]);

  const fetchRows = async () => {
    const query = buildRangeQuery(range, startDate, endDate);
    const endpoint = reportEndpointFor(reportType, query);
    const response = await apiGet<any>(endpoint);
    const payload = unwrapPayload<any>(response);
    return normalizeRows(reportType, payload);
  };

  const exportCsv = async () => {
    const { rows } = await fetchRows();

    if (!rows.length) {
      throw new Error('No report rows available for CSV export.');
    }

    const headers = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row)))
    );

    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const stamp = new Date().toISOString().split('T')[0];
    triggerDownload(blob, `${filePrefix}_${stamp}.csv`);
  };

  const exportPdf = async () => {
    const { title, rows } = await fetchRows();

    if (!rows.length) {
      throw new Error('No report rows available for PDF export.');
    }

    const headers = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row)))
    );

    const document = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = document.internal.pageSize.getWidth();
    const pageHeight = document.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensurePageSpace = (linesNeeded = 1) => {
      if (y + linesNeeded * lineHeight <= pageHeight - margin) {
        return;
      }

      document.addPage();
      y = margin;
    };

    document.setFont('helvetica', 'bold');
    document.setFontSize(14);
    document.text(title, margin, y);
    y += lineHeight + 2;

    document.setFont('helvetica', 'normal');
    document.setFontSize(10);
    document.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += lineHeight + 4;

    document.setFont('helvetica', 'bold');
    const headerLine = headers.join(' | ');
    const wrappedHeader = document.splitTextToSize(headerLine, contentWidth);
    ensurePageSpace(wrappedHeader.length + 1);
    document.text(wrappedHeader, margin, y);
    y += wrappedHeader.length * lineHeight;

    document.setDrawColor(160);
    document.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    document.setFont('helvetica', 'normal');
    rows.forEach((row) => {
      const rowLine = headers
        .map((header) => `${header}: ${sanitizeCell(row[header])}`)
        .join(' | ');
      const wrapped = document.splitTextToSize(rowLine, contentWidth);
      ensurePageSpace(wrapped.length + 1);
      document.text(wrapped, margin, y);
      y += wrapped.length * lineHeight;
      y += 2;
    });

    const stamp = new Date().toISOString().split('T')[0];
    document.save(`${filePrefix}_${stamp}.pdf`);
  };

  const handleExport = async (format: ExportFormat) => {
    setLoadingFormat(format);
    setError(null);

    try {
      if (format === 'csv') {
        await exportCsv();
      } else {
        await exportPdf();
      }
    } catch (err: any) {
      setError(String(err?.message || 'Failed to export report'));
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <AppButton
        variant="danger"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={disabled || loadingFormat !== null}
        loading={loadingFormat === 'pdf'}
      >
        <FileText size={16} />
        PDF
      </AppButton>

      <AppButton
        variant="secondary"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={disabled || loadingFormat !== null}
        loading={loadingFormat === 'csv'}
      >
        <Download size={16} />
        CSV
      </AppButton>

      {error ? <p className="w-full text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
