import { useEffect, useMemo, useState } from 'react';
import { Activity, ShieldCheck, Users } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import TopNotification from '@/components/common/TopNotification';
import { PageContainer } from '@/components/ui';
import { useAuditLogs } from '@/hooks';
import { AuditDetail, AuditHeader, AuditTable, type AuditLogListItem } from '@/components/audit';
import type { AuditLog } from '@/types';
import { formatNumber } from '@/utils/numberFormat';
import styles from './Audit.module.css';

const ITEMS_PER_PAGE = 20;

type NotificationState = {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
} | null;

const normalizeText = (value: unknown) => String(value ?? '').trim();

const inferEntity = (action: string) => {
  const normalized = normalizeText(action).toUpperCase();
  if (!normalized) return 'System';

  const token = normalized.includes('_') ? normalized.split('_')[0] : normalized;
  const lower = token.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const isWithinDateRange = (timestamp: string, dateFrom: string, dateTo: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;

  if (dateFrom) {
    const fromDate = new Date(`${dateFrom}T00:00:00`);
    if (date < fromDate) return false;
  }

  if (dateTo) {
    const toDate = new Date(`${dateTo}T23:59:59`);
    if (date > toDate) return false;
  }

  return true;
};

export default function Audit() {
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogListItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);

  const auditLogsQuery = useAuditLogs();

  const normalizedLogs = useMemo<AuditLogListItem[]>(() => {
    const rawLogs = (auditLogsQuery.data?.items || []) as AuditLog[];

    return rawLogs.map((log, index) => {
      const action = normalizeText(log.action) || '-';
      const details =
        typeof log.details === 'string' && log.details.trim()
          ? log.details
          : log.changes
            ? JSON.stringify(log.changes)
            : '-';
      const timestamp = normalizeText(log.timestamp) || new Date(0).toISOString();

      return {
        id: normalizeText(log.id) || `${timestamp}-${action}-${index}`,
        timestamp,
        username: normalizeText(log.username || log.user?.username || log.user?.name) || 'Unknown',
        role: normalizeText(log.role || log.user?.role) || '-',
        action,
        entity: normalizeText(log.entityType) || inferEntity(action),
        details,
        ipAddress: normalizeText(log.ipAddress) || '-',
      };
    });
  }, [auditLogsQuery.data]);

  const filteredLogs = useMemo(() => {
    const userQuery = userFilter.trim().toLowerCase();

    return normalizedLogs.filter((log) => {
      const matchesUser =
        !userQuery ||
        log.username.toLowerCase().includes(userQuery) ||
        log.role.toLowerCase().includes(userQuery);

      const matchesAction = !actionFilter || log.action === actionFilter;
      const matchesDateRange = isWithinDateRange(log.timestamp, dateFrom, dateTo);

      return matchesUser && matchesAction && matchesDateRange;
    });
  }, [normalizedLogs, userFilter, actionFilter, dateFrom, dateTo]);

  const pagedLogs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, page]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));

  const actionOptions = useMemo(() => {
    const actions = Array.from(new Set(normalizedLogs.map((log) => log.action))).filter(Boolean);
    return actions.sort((a, b) => a.localeCompare(b)).map((action) => ({ label: action, value: action }));
  }, [normalizedLogs]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(filteredLogs.map((log) => log.username)).size;
    const uniqueActions = new Set(filteredLogs.map((log) => log.action)).size;

    return {
      totalEntries: normalizedLogs.length,
      visibleEntries: filteredLogs.length,
      users: uniqueUsers,
      actions: uniqueActions,
    };
  }, [normalizedLogs, filteredLogs]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [userFilter, actionFilter, dateFrom, dateTo]);

  const handleExportCsv = () => {
    if (!filteredLogs.length) {
      setNotification({
        id: Date.now(),
        title: 'No Rows to Export',
        message: 'There are no audit log entries for the current filters.',
        type: 'info',
      });
      return;
    }

    setIsExporting(true);

    try {
      const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Change', 'IP'];
      const rows = filteredLogs.map((log) => [
        log.timestamp,
        log.username,
        log.role,
        log.action,
        log.entity,
        log.details,
        log.ipAddress,
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setNotification({
        id: Date.now(),
        title: 'Export Complete',
        message: `${formatNumber(filteredLogs.length)} audit entries exported.`,
        type: 'success',
      });
    } finally {
      setIsExporting(false);
    }
  };

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

      <div className={styles.auditContainer}>
        <div className={styles.statsGrid}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Entries" value={formatNumber(stats.totalEntries)} icon={<ShieldCheck />} />
            <StatCard title="Visible Entries" value={formatNumber(stats.visibleEntries)} icon={<Activity />} />
            <StatCard title="Users" value={formatNumber(stats.users)} icon={<Users />} />
            <StatCard title="Action Types" value={formatNumber(stats.actions)} icon={<Activity />} />
          </div>
        </div>

        <AuditHeader
          userFilter={userFilter}
          actionFilter={actionFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          actionOptions={actionOptions}
          disableExport={!filteredLogs.length || auditLogsQuery.isLoading}
          exporting={isExporting}
          onUserFilterChange={setUserFilter}
          onActionFilterChange={setActionFilter}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearFilters={() => {
            setUserFilter('');
            setActionFilter('');
            setDateFrom('');
            setDateTo('');
          }}
          onRefresh={() => auditLogsQuery.refetch()}
          onExport={handleExportCsv}
        />

        <section className={styles.panel}>
          <AuditTable
            logs={pagedLogs}
            loading={auditLogsQuery.isLoading}
            error={(auditLogsQuery.error as { message?: string } | null)?.message || ''}
            page={page}
            limit={ITEMS_PER_PAGE}
            total={filteredLogs.length}
            onPageChange={setPage}
            onViewDetails={(log) => setSelectedLog(log)}
          />
        </section>
      </div>

      <AuditDetail
        isOpen={Boolean(selectedLog)}
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </PageContainer>
  );
}
