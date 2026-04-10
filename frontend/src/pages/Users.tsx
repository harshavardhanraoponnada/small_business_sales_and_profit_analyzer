import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, UserCheck, UserCog, Users as UsersIcon } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import TopNotification from '@/components/common/TopNotification';
import { PageContainer } from '@/components/ui';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserReportPreferences,
  useUsers,
} from '@/hooks';
import {
  UsersHeader,
  UsersModal,
  UsersTable,
  type ReportFormat,
  type ReportFrequency,
  type ReportScheduleWeekday,
  type UserFormPayload,
  type UserListItem,
  type UserStatus,
} from '@/components/users';
import { Role, type User } from '@/types';
import { formatNumber } from '@/utils/numberFormat';
import styles from './Users.module.css';

const ITEMS_PER_PAGE = 15;

type ModalState =
  | { isOpen: false; mode: 'add'; user?: undefined }
  | { isOpen: true; mode: 'add'; user?: undefined }
  | { isOpen: true; mode: 'edit'; user: UserListItem };

type NotificationState = {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
} | null;

const STATUS_OPTIONS: Array<{ label: string; value: UserStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const normalizeText = (value: unknown) => String(value ?? '').trim();

const formatRoleLabel = (role: Role) => {
  const lowered = role.toLowerCase();
  return lowered.charAt(0).toUpperCase() + lowered.slice(1);
};

const normalizeRole = (value: unknown): Role => {
  const role = normalizeText(value).toUpperCase();
  if (role === Role.OWNER || role === Role.ACCOUNTANT || role === Role.STAFF) {
    return role as Role;
  }
  return Role.STAFF;
};

const getErrorMessage = (error: any, fallback: string) => {
  return String(error?.details?.error || error?.details?.message || error?.message || fallback);
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

export default function Users() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add' });
  const [notification, setNotification] = useState<NotificationState>(null);

  const usersQuery = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updateUserPreferences = useUpdateUserReportPreferences();

  const roleOptions = useMemo(() => {
    return Object.values(Role).map((role) => ({
      label: formatRoleLabel(role as Role),
      value: role,
    }));
  }, []);

  const users = useMemo<UserListItem[]>(() => {
    const rawUsers = (usersQuery.data || []) as User[];

    return rawUsers
      .map((user, index) => {
        const id = normalizeText(user.id) || `user-${index}`;
        const username = normalizeText(user.username || user.name) || 'Unknown User';
        const status: UserStatus =
          user.status === 'INACTIVE' || user.isActive === false ? 'INACTIVE' : 'ACTIVE';
        const receiveScheduledReports = Boolean(user.receiveScheduledReports);
        const reportFrequency = receiveScheduledReports
          ? normalizeReportFrequency(user.reportFrequency)
          : 'none';
        const reportFormat = normalizeReportFormat(user.reportFormat);
        const reportScheduleTime = normalizeScheduleTime(user.reportScheduleTime);
        const reportScheduleWeekday = normalizeScheduleWeekday(user.reportScheduleWeekday);

        return {
          id,
          username,
          email: normalizeText(user.email) || '-',
          role: normalizeRole(user.role),
          status,
          reportFrequency,
          reportFormat,
          reportScheduleTime,
          reportScheduleWeekday,
          receiveScheduledReports,
          lastLogin: normalizeText(user.lastLogin || user.updatedAt || user.createdAt) || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })
      .filter((user) => Boolean(user.id));
  }, [usersQuery.data]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  const stats = useMemo(() => {
    const owners = users.filter((user) => user.role === Role.OWNER).length;
    const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;

    return {
      totalUsers: users.length,
      owners,
      activeUsers,
      visibleUsers: filteredUsers.length,
    };
  }, [users, filteredUsers]);

  const canDeactivateUser = (user: Pick<UserListItem, 'id' | 'role'>) => {
    if (user.role !== Role.OWNER) {
      return true;
    }

    return stats.owners > 1;
  };

  const notifyLastOwnerProtected = (username: string) => {
    setNotification({
      id: Date.now(),
      title: 'Owner Protected',
      message: `Cannot deactivate ${username}. At least one OWNER account must remain active.`,
      type: 'error',
    });
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'add' });
  };

  const saveReportPreferences = async (userId: string | number, payload: UserFormPayload) => {
    await updateUserPreferences.mutateAsync({
      id: userId,
      data: {
        receiveScheduledReports: payload.receiveScheduledReports,
        reportFrequency: payload.receiveScheduledReports ? payload.reportFrequency : 'none',
        reportFormat: payload.reportFormat,
        reportScheduleTime: payload.reportScheduleTime,
        reportScheduleWeekday: payload.reportScheduleWeekday,
      },
    });
  };

  const handleDeactivateUser = async (user: UserListItem) => {
    if (!canDeactivateUser(user)) {
      notifyLastOwnerProtected(user.username);
      return;
    }

    const confirmed = window.confirm(
      `Deactivate user "${user.username}"? This action removes the account in the current API.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
      setNotification({
        id: Date.now(),
        title: 'User Deactivated',
        message: `${user.username} no longer has system access.`,
        type: 'info',
      });
    } catch (error: any) {
      setNotification({
        id: Date.now(),
        title: 'Deactivate Failed',
        message: String(error?.message || 'Could not deactivate user.'),
        type: 'error',
      });
    }
  };

  const handleSaveUser = async (payload: UserFormPayload) => {
    const username = payload.username.trim();

    try {
      if (modalState.mode === 'add') {
        const createdUser = await createUser.mutateAsync(payload);
        let preferenceWarning: string | null = null;

        if (createdUser?.id) {
          try {
            await saveReportPreferences(createdUser.id, payload);
          } catch (error: any) {
            preferenceWarning = getErrorMessage(
              error,
              'User was created, but report preferences could not be saved.'
            );
          }
        }

        if (payload.status === 'INACTIVE' && createdUser?.id) {
          const confirmed = window.confirm(
            `"${username}" was created. Deactivate now by removing this account?`
          );

          if (confirmed) {
            await deleteUser.mutateAsync(createdUser.id);
            setNotification({
              id: Date.now(),
              title: 'User Created and Deactivated',
              message: `${username} was added and then immediately deactivated.`,
              type: 'info',
            });
          } else {
            setNotification({
              id: Date.now(),
              title: 'User Created',
              message: preferenceWarning
                ? `${username} was created as active. Preference save warning: ${preferenceWarning}`
                : `${username} was created as active.`,
              type: 'success',
            });
          }
        } else {
          setNotification({
            id: Date.now(),
            title: preferenceWarning ? 'User Added With Warning' : 'User Added',
            message: preferenceWarning
              ? `${username} was added, but preferences could not be saved: ${preferenceWarning}`
              : `${username} was added successfully.`,
            type: preferenceWarning ? 'info' : 'success',
          });
        }
      } else if (modalState.user) {
        if (payload.status === 'INACTIVE') {
          if (!canDeactivateUser(modalState.user)) {
            notifyLastOwnerProtected(modalState.user.username);
            return;
          }

          const confirmed = window.confirm(
            `Set "${modalState.user.username}" to inactive? This will remove the account.`
          );

          if (!confirmed) {
            return;
          }

          await deleteUser.mutateAsync(modalState.user.id);
          setNotification({
            id: Date.now(),
            title: 'User Deactivated',
            message: `${modalState.user.username} no longer has system access.`,
            type: 'info',
          });
        } else {
          await updateUser.mutateAsync({
            id: modalState.user.id,
            data: {
              username: payload.username,
              email: payload.email,
              role: payload.role,
              status: payload.status,
            },
          });

          let preferenceWarning: string | null = null;
          try {
            await saveReportPreferences(modalState.user.id, payload);
          } catch (error: any) {
            preferenceWarning = getErrorMessage(
              error,
              'Account details were saved, but report preferences could not be updated.'
            );
          }

          setNotification({
            id: Date.now(),
            title: preferenceWarning ? 'User Updated With Warning' : 'User Updated',
            message: preferenceWarning
              ? `${username}'s account details were updated, but preferences failed: ${preferenceWarning}`
              : `${username}'s account details and auto-report settings were updated.`,
            type: preferenceWarning ? 'info' : 'success',
          });
        }
      }

      closeModal();
    } catch (error: any) {
      setNotification({
        id: Date.now(),
        title: 'Save Failed',
        message: getErrorMessage(error, 'Could not save user changes.'),
        type: 'error',
      });
    }
  };

  const mutationLoading =
    createUser.isPending ||
    updateUser.isPending ||
    deleteUser.isPending ||
    updateUserPreferences.isPending;

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

      <div className={styles.usersContainer}>
        <div className={styles.statsGrid}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Users" value={formatNumber(stats.totalUsers)} icon={<UsersIcon />} />
            <StatCard title="Owners" value={formatNumber(stats.owners)} icon={<ShieldCheck />} />
            <StatCard title="Active Users" value={formatNumber(stats.activeUsers)} icon={<UserCheck />} />
            <StatCard title="Visible Rows" value={formatNumber(stats.visibleUsers)} icon={<UserCog />} />
          </div>
        </div>

        <UsersHeader
          search={search}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          roleOptions={roleOptions}
          statusOptions={STATUS_OPTIONS}
          onSearchChange={setSearch}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={() => {
            setSearch('');
            setRoleFilter('');
            setStatusFilter('');
          }}
          onRefresh={() => usersQuery.refetch()}
          onAddClick={() => setModalState({ isOpen: true, mode: 'add' })}
        />

        <section className={styles.panel}>
          <UsersTable
            users={pagedUsers}
            loading={usersQuery.isLoading}
            error={(usersQuery.error as { message?: string } | null)?.message || ''}
            page={page}
            limit={ITEMS_PER_PAGE}
            total={filteredUsers.length}
            onPageChange={setPage}
            onEdit={(user) => setModalState({ isOpen: true, mode: 'edit', user })}
            onDeactivate={handleDeactivateUser}
          />
          <p className={styles.helperText}>
            Automated report preferences are per-user with configurable frequency, time, and weekday. Only OWNER
            accounts can update these schedules.
          </p>
        </section>
      </div>

      <UsersModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialUser={
          modalState.mode === 'edit'
            ? {
                username: modalState.user.username,
                email: modalState.user.email,
                role: modalState.user.role,
                status: modalState.user.status,
                reportFrequency: modalState.user.reportFrequency,
                reportFormat: modalState.user.reportFormat,
                reportScheduleTime: modalState.user.reportScheduleTime,
                reportScheduleWeekday: modalState.user.reportScheduleWeekday,
                receiveScheduledReports: modalState.user.receiveScheduledReports,
              }
            : undefined
        }
        roleOptions={roleOptions}
        statusOptions={STATUS_OPTIONS}
        loading={mutationLoading}
        onClose={closeModal}
        onSave={handleSaveUser}
      />
    </PageContainer>
  );
}
