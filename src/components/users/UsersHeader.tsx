import { Filter, RefreshCw, UserPlus } from 'lucide-react';
import { AppButton, AppSelect, SearchInput } from '@/components/ui';
import type { UserStatus } from './types';

interface RoleOption {
  label: string;
  value: string;
}

interface StatusOption {
  label: string;
  value: UserStatus;
}

interface UsersHeaderProps {
  search: string;
  roleFilter: string;
  statusFilter: string;
  roleOptions: RoleOption[];
  statusOptions: StatusOption[];
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onAddClick: () => void;
}

export default function UsersHeader({
  search,
  roleFilter,
  statusFilter,
  roleOptions,
  statusOptions,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onClearFilters,
  onRefresh,
  onAddClick,
}: UsersHeaderProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-[0_12px_34px_rgba(2,6,23,0.45)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">
        <Filter size={14} />
        User Filters
      </div>

      <div className="grid gap-3 md:grid-cols-[1.8fr_1fr_1fr]">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search by username or email"
        />

        <AppSelect
          label="Role"
          value={roleFilter}
          onChange={(value) => onRoleFilterChange(String(value))}
          options={[{ label: 'All Roles', value: '' }, ...roleOptions]}
        />

        <AppSelect
          label="Status"
          value={statusFilter}
          onChange={(value) => onStatusFilterChange(String(value))}
          options={[{ label: 'All Status', value: '' }, ...statusOptions]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AppButton variant="secondary" onClick={onClearFilters}>Clear Filters</AppButton>

        <AppButton variant="outline" onClick={onRefresh}>
          <RefreshCw size={14} />
          Refresh
        </AppButton>

        <div className="ml-auto">
          <AppButton variant="primary" onClick={onAddClick}>
            <UserPlus size={14} />
            Add User
          </AppButton>
        </div>
      </div>
    </div>
  );
}
