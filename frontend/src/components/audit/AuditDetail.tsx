import { AppButton, Modal } from '@/components/ui';
import type { AuditLogListItem } from './types';

interface AuditDetailProps {
  isOpen: boolean;
  log: AuditLogListItem | null;
  onClose: () => void;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const parseDetails = (value: string) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '-';

  try {
    const parsed = JSON.parse(normalized);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return normalized;
  }
};

export default function AuditDetail({ isOpen, log, onClose }: AuditDetailProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Entry Details" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Timestamp</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{formatDateTime(log?.timestamp || '')}</p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">User</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{log?.username || '-'}</p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{log?.role || '-'}</p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Action</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{log?.action || '-'}</p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Entity</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{log?.entity || '-'}</p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">IP Address</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{log?.ipAddress || '-'}</p>
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Change Details</p>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-white p-3 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
            {parseDetails(log?.details || '')}
          </pre>
        </div>

        <div className="flex items-center justify-end gap-2">
          <AppButton variant="outline" onClick={onClose}>Close</AppButton>
        </div>
      </div>
    </Modal>
  );
}
