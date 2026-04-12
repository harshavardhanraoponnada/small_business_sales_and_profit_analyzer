import { Eye } from 'lucide-react';
import { AppButton, DataTable, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import type { AuditLogListItem } from './types';

interface AuditTableProps {
  logs: AuditLogListItem[];
  loading: boolean;
  error?: string;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewDetails: (log: AuditLogListItem) => void;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const truncateText = (value: string, maxLength = 84) => {
  if (!value) return '-';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

export default function AuditTable({
  logs,
  loading,
  error,
  page,
  limit,
  total,
  onPageChange,
  onViewDetails,
}: AuditTableProps) {
  if (loading) return <LoadingState type="skeleton" variant="table" />;
  if (error) return <ErrorState title="Failed to load audit logs" message={error} />;
  if (!logs.length) {
    return <EmptyState title="No audit logs found" description="Try changing filters or date range." />;
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'username',
      label: 'User',
      sortable: true,
      render: (_: unknown, row: AuditLogListItem) =>
        row.role && row.role !== '-' ? `${row.username} (${row.role})` : row.username,
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
    },
    {
      key: 'entity',
      label: 'Entity',
      sortable: true,
    },
    {
      key: 'details',
      label: 'Change',
      sortable: true,
      render: (value: string) => truncateText(value),
    },
    {
      key: 'ipAddress',
      label: 'IP',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'actions',
      label: 'Details',
      render: (_: unknown, row: AuditLogListItem) => (
        <AppButton variant="ghost" size="sm" onClick={() => onViewDetails(row)}>
          <Eye size={14} />
          View
        </AppButton>
      ),
    },
  ] as const;

  return (
    <DataTable
      columns={columns as any}
      data={logs as any}
      pagination={{
        page,
        limit,
        total,
        onPageChange,
      }}
    />
  );
}
