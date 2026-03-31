import { useQuery } from '@tanstack/react-query';
import { apiGet, endpoints } from '@/services/api';
import { AuditLog, ApiListResponse, PaginationParams } from '@/types';

const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters: Partial<PaginationParams>) => [...auditLogKeys.lists(), { filters }] as const,
  details: () => [...auditLogKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...auditLogKeys.details(), id] as const,
};

export const useAuditLogs = (filters: Partial<PaginationParams> = {}) => {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<AuditLog>>(endpoints.auditLogs.list, {
        params: filters,
      });
      const payload = response.data;

      return {
        items: payload?.data || [],
        total: payload?.total || 0,
        page: payload?.page || filters.page || 1,
        limit: payload?.limit || filters.limit || 20,
      };
    },
  });
};

export const useAuditLog = (id: string | number) => {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<AuditLog>(endpoints.auditLogs.get(id));
      return response.data;
    },
    enabled: !!id,
  });
};
