import { Role } from '@/types';
import { Modal } from '@/components/ui';
import UserForm from './UserForm';
import type { UserFormPayload, UserStatus } from './types';

interface RoleOption {
  label: string;
  value: Role;
}

interface StatusOption {
  label: string;
  value: UserStatus;
}

interface UsersModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialUser?: Partial<UserFormPayload>;
  roleOptions: RoleOption[];
  statusOptions: StatusOption[];
  loading?: boolean;
  onClose: () => void;
  onSave: (payload: UserFormPayload) => Promise<void>;
}

export default function UsersModal({
  isOpen,
  mode,
  initialUser,
  roleOptions,
  statusOptions,
  loading,
  onClose,
  onSave,
}: UsersModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add User' : 'Edit User'}
      size="lg"
    >
      <UserForm
        mode={mode}
        roleOptions={roleOptions}
        statusOptions={statusOptions}
        initialUser={initialUser}
        loading={loading}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </Modal>
  );
}
