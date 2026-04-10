import { Pencil, UserX } from 'lucide-react';
import { AppButton, DataTable, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import type { UserListItem } from './types';

interface UsersTableProps {
  users: UserListItem[];
  loading: boolean;
  error?: string;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
}

const formatDateTime = (value?: string) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString();
};

const roleClassMap: Record<string, string> = {
  OWNER: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  ACCOUNTANT: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200',
  STAFF: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

const statusClassMap: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  INACTIVE: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200',
};

const formatAutoReports = (row: UserListItem) => {
  if (!row.receiveScheduledReports) {
    return 'Disabled';
  }

  const frequencyLabel = row.reportFrequency.toUpperCase();
  const formatLabel = row.reportFormat.toUpperCase();

  if (row.reportFrequency === 'weekly') {
    return `${frequencyLabel} (${row.reportScheduleWeekday.toUpperCase()}) @ ${row.reportScheduleTime} · ${formatLabel}`;
  }

  return `${frequencyLabel} @ ${row.reportScheduleTime} · ${formatLabel}`;
};

export default function UsersTable({
  users,
  loading,
  error,
  page,
  limit,
  total,
  onPageChange,
  onEdit,
  onDeactivate,
}: UsersTableProps) {
  if (loading) return <LoadingState type="skeleton" variant="table" />;
  if (error) return <ErrorState title="Failed to load users" message={error} />;
  if (!users.length) {
    return <EmptyState title="No users found" description="Try changing your filters or add a new user." />;
  }

  const columns = [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            roleClassMap[value] || roleClassMap.STAFF
          }`}
        >
          {value || 'STAFF'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            statusClassMap[value] || statusClassMap.ACTIVE
          }`}
        >
          {value || 'ACTIVE'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'autoReports',
      label: 'Auto Reports',
      sortable: false,
      render: (_: unknown, row: UserListItem) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">{formatAutoReports(row)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: UserListItem) => (
        <div className="flex flex-wrap items-center gap-1">
          <AppButton variant="outline" size="sm" onClick={() => onEdit(row)}>
            <Pencil size={14} />
            Edit
          </AppButton>
          <AppButton variant="danger" size="sm" onClick={() => onDeactivate(row)}>
            <UserX size={14} />
            {row.status === 'INACTIVE' ? 'Delete' : 'Deactivate'}
          </AppButton>
        </div>
      ),
    },
  ] as const;

  return (
    <DataTable
      columns={columns as any}
      data={users as any}
      pagination={{
        page,
        limit,
        total,
        onPageChange,
      }}
    />
  );
}
