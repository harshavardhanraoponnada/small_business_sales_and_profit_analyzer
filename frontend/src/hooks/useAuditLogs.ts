import { useQuery } from '@tanstack/react-query';
import { apiGet, endpoints } from '@/services/api';
import { AuditLog, PaginationParams } from '@/types';

const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters: Partial<PaginationParams>) => [...auditLogKeys.lists(), { filters }] as const,
  details: () => [...auditLogKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...auditLogKeys.details(), id] as const,
};

const normalizeText = (value: unknown) => String(value ?? '').trim();

const normalizeAuditPayload = (payload: unknown): AuditLog[] => {
  let rows: Array<Record<string, unknown>> = [];

  if (Array.isArray(payload)) {
    rows = payload as Array<Record<string, unknown>>;
  } else if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.data)) {
      rows = record.data as Array<Record<string, unknown>>;
    } else if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.data)) {
        rows = nested.data as Array<Record<string, unknown>>;
      }
    }
  }

  return rows.map((row, index) => {
    const timestamp = normalizeText(row.timestamp || row.created_at || row.createdAt);
    const action = normalizeText(row.action) || '-';
    const username =
      normalizeText(row.username) ||
      normalizeText((row.user as Record<string, unknown> | undefined)?.username) ||
      normalizeText((row.user as Record<string, unknown> | undefined)?.name) ||
      'Unknown';
    const role =
      normalizeText(row.role) ||
      normalizeText(row.user_role) ||
      normalizeText((row.user as Record<string, unknown> | undefined)?.role) ||
      '-';
    const ipAddress = normalizeText(row.ipAddress || row.ip_address || row.ip) || '-';

    let details = '-';
    if (typeof row.details === 'string') {
      details = row.details;
    } else if (row.details && typeof row.details === 'object') {
      details = JSON.stringify(row.details);
    }

    const id =
      normalizeText(row.id) ||
      normalizeText(row.audit_id) ||
      `${timestamp || 'audit'}-${action || 'event'}-${index}`;

    return {
      id,
      action,
      timestamp,
      username,
      role,
      details,
      ipAddress,
    };
  });
};

export const useAuditLogs = (filters: Partial<PaginationParams> = {}) => {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<unknown>(endpoints.auditLogs.list, {
        params: filters,
      });
      const items = normalizeAuditPayload(response);
      const page = Number(filters.page || 1);
      const requestedLimit = Number(filters.limit || 20);

      return {
        items,
        total: items.length,
        page,
        limit: requestedLimit,
      };
    },
  });
};

export const useAuditLog = (id: string | number) => {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<unknown>(endpoints.auditLogs.get(id));
      const normalized = normalizeAuditPayload(response);
      return normalized[0] || null;
    },
    enabled: !!id,
  });
};
