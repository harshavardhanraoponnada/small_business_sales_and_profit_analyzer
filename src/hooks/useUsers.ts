import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost, apiPut, endpoints } from '@/services/api';
import { Role, type User } from '@/types';

type UserRecord = Record<string, unknown>;
type UserMutationPayload = Partial<User> & { password?: string };
type ReportFrequency = 'none' | 'daily' | 'weekly' | 'monthly';
type ReportFormat = 'pdf' | 'xlsx';
type ReportScheduleWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
type ReportPreferencesPayload = {
  reportFrequency: ReportFrequency;
  reportFormat: ReportFormat;
  reportScheduleTime: string;
  reportScheduleWeekday: ReportScheduleWeekday;
  receiveScheduledReports: boolean;
};

const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: unknown) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...userKeys.details(), id] as const,
};

const normalizeText = (value: unknown) => String(value ?? '').trim();

const normalizeRole = (value: unknown): Role => {
  const role = normalizeText(value).toUpperCase();
  if (role === Role.OWNER || role === Role.ACCOUNTANT || role === Role.STAFF) {
    return role as Role;
  }
  return Role.STAFF;
};

const normalizeReportFrequency = (value: unknown): ReportFrequency => {
  const frequency = normalizeText(value).toLowerCase();
  if (frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly' || frequency === 'none') {
    return frequency as ReportFrequency;
  }
  return 'none';
};

const normalizeReportFormat = (value: unknown): ReportFormat => {
  const format = normalizeText(value).toLowerCase();
  if (format === 'xlsx' || format === 'pdf') {
    return format as ReportFormat;
  }
  return 'pdf';
};

const normalizeScheduleTime = (value: unknown): string => {
  const time = normalizeText(value);
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    return time;
  }
  return '09:00';
};

const normalizeScheduleWeekday = (value: unknown): ReportScheduleWeekday => {
  const weekday = normalizeText(value).toLowerCase();
  if (
    weekday === 'monday' ||
    weekday === 'tuesday' ||
    weekday === 'wednesday' ||
    weekday === 'thursday' ||
    weekday === 'friday' ||
    weekday === 'saturday' ||
    weekday === 'sunday'
  ) {
    return weekday as ReportScheduleWeekday;
  }
  return 'monday';
};

const normalizeStatus = (row: UserRecord): 'ACTIVE' | 'INACTIVE' => {
  const status = normalizeText(row.status).toUpperCase();
  if (status === 'ACTIVE' || status === 'INACTIVE') {
    return status as 'ACTIVE' | 'INACTIVE';
  }

  const isActive = row.isActive ?? row.is_active;
  if (typeof isActive === 'boolean') {
    return isActive ? 'ACTIVE' : 'INACTIVE';
  }
  if (typeof isActive === 'string') {
    const normalized = isActive.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'active') {
      return 'ACTIVE';
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'inactive') {
      return 'INACTIVE';
    }
  }

  const isDeleted = row.is_deleted;
  if (isDeleted === true || String(isDeleted).toLowerCase() === 'true') {
    return 'INACTIVE';
  }

  return 'ACTIVE';
};

const normalizeUserRecord = (row: UserRecord, index: number): User => {
  const id = normalizeText(row.id) || `user-${index}`;
  const username = normalizeText(row.username || row.name) || 'Unknown User';
  const email = normalizeText(row.email) || '-';
  const createdAt = normalizeText(row.createdAt || row.created_at) || undefined;
  const updatedAt = normalizeText(row.updatedAt || row.updated_at) || undefined;
  const lastLogin =
    normalizeText(row.lastLogin || row.last_login || row.last_seen_at || row.updatedAt || row.updated_at) || undefined;
  const status = normalizeStatus(row);
  const reportFrequency = normalizeReportFrequency(row.reportFrequency || row.report_frequency);
  const reportFormat = normalizeReportFormat(row.reportFormat || row.report_format);
  const reportScheduleTime = normalizeScheduleTime(row.reportScheduleTime || row.report_schedule_time);
  const reportScheduleWeekday = normalizeScheduleWeekday(
    row.reportScheduleWeekday || row.report_schedule_weekday
  );
  const receiveScheduledReports = Boolean(row.receiveScheduledReports ?? row.receive_scheduled_reports);

  return {
    id,
    email,
    username,
    name: username,
    role: normalizeRole(row.role),
    status,
    isActive: status === 'ACTIVE',
    createdAt,
    updatedAt,
    lastLogin,
    reportFrequency,
    reportFormat,
    reportScheduleTime,
    reportScheduleWeekday,
    receiveScheduledReports,
  };
};

const extractUserRows = (payload: unknown): UserRecord[] => {
  if (Array.isArray(payload)) {
    return payload as UserRecord[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as UserRecord;

  if (Array.isArray(record.data)) {
    return record.data as UserRecord[];
  }

  if (Array.isArray(record.users)) {
    return record.users as UserRecord[];
  }

  if (record.data && typeof record.data === 'object') {
    const nestedData = record.data as UserRecord;
    if (Array.isArray(nestedData.data)) {
      return nestedData.data as UserRecord[];
    }

    if (normalizeText(nestedData.id)) {
      return [nestedData];
    }
  }

  if (record.user && typeof record.user === 'object') {
    return [record.user as UserRecord];
  }

  if (normalizeText(record.id)) {
    return [record];
  }

  return [];
};

const normalizeUserPayload = (payload: unknown): User[] => {
  const rows = extractUserRows(payload);
  return rows.map((row, index) => normalizeUserRecord(row, index));
};

const normalizeSingleUser = (payload: unknown): User | null => {
  const users = normalizeUserPayload(payload);
  return users[0] || null;
};

const buildUserBody = (data: UserMutationPayload, includePassword: boolean) => {
  const payload: Record<string, unknown> = {
    username: normalizeText(data.username || data.name),
    email: normalizeText(data.email).toLowerCase(),
    role: normalizeRole(data.role),
  };

  if (includePassword) {
    payload.password = normalizeText(data.password);
  }

  return payload;
};

export const useUsers = (filters?: unknown) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const response = await apiGet<unknown>(endpoints.users.list);
      return normalizeUserPayload(response);
    },
  });
};

export const useUser = (id: string | number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await apiGet<unknown>(endpoints.users.list);
      const users = normalizeUserPayload(response);
      return users.find((user) => String(user.id) === String(id)) || null;
    },
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UserMutationPayload) => {
      const body = buildUserBody(data, true);
      const response = await apiPost<unknown, Record<string, unknown>>(endpoints.users.create, body);
      return normalizeSingleUser(response);
    },
    onSuccess: (user) => {
      if (user?.id) {
        queryClient.setQueryData(userKeys.detail(user.id), user);
      }
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: UserMutationPayload }) => {
      const body = buildUserBody(data, false);
      const response = await apiPut<unknown, Record<string, unknown>>(endpoints.users.update(id), body);
      return (
        normalizeSingleUser(response) || {
          id,
          email: normalizeText(data.email),
          username: normalizeText(data.username || data.name),
          name: normalizeText(data.username || data.name),
          role: normalizeRole(data.role),
          status: data.status || 'ACTIVE',
          isActive: data.status !== 'INACTIVE',
        }
      );
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(userKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      }
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiDelete<unknown>(endpoints.users.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(userKeys.detail(id), null);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUserReportPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string | number;
      data: ReportPreferencesPayload;
    }) => {
      const response = await apiPut<unknown, ReportPreferencesPayload>(
        endpoints.userPreferences.update(id),
        {
          reportFrequency: normalizeReportFrequency(data.reportFrequency),
          reportFormat: normalizeReportFormat(data.reportFormat),
          reportScheduleTime: normalizeScheduleTime(data.reportScheduleTime),
          reportScheduleWeekday: normalizeScheduleWeekday(data.reportScheduleWeekday),
          receiveScheduledReports: Boolean(data.receiveScheduledReports),
        }
      );

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
