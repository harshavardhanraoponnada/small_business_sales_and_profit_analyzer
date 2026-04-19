import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { useForm, useFormErrors } from '@/hooks';
import { Role } from '@/types';
import type {
  ReportFormat,
  ReportFrequency,
  ReportScheduleWeekday,
  UserFormPayload,
  UserStatus,
} from './types';

interface RoleOption {
  label: string;
  value: Role;
}

interface StatusOption {
  label: string;
  value: UserStatus;
}

interface UserFormValues {
  username: string;
  email: string;
  password?: string;
  role: Role;
  status: UserStatus;
  reportFrequency: ReportFrequency;
  reportFormat: ReportFormat;
  reportScheduleTime: string;
  reportScheduleWeekday: ReportScheduleWeekday;
  receiveScheduledReports: boolean;
}

interface UserFormProps {
  mode: 'add' | 'edit';
  roleOptions: RoleOption[];
  statusOptions: StatusOption[];
  initialUser?: Partial<UserFormPayload>;
  loading?: boolean;
  onSubmit: (payload: UserFormPayload) => Promise<void>;
  onCancel: () => void;
}

export default function UserForm({
  mode,
  roleOptions,
  statusOptions,
  initialUser,
  loading,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const reportFrequencyOptions: Array<{ label: string; value: ReportFrequency }> = [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  const reportFormatOptions: Array<{ label: string; value: ReportFormat }> = [
    { label: 'PDF', value: 'pdf' },
    { label: 'Excel (XLSX)', value: 'xlsx' },
  ];

  const weekdayOptions: Array<{ label: string; value: ReportScheduleWeekday }> = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' },
  ];

  const schema = z
    .object({
      username: z.string().trim().min(3, 'Username must be at least 3 characters').max(64, 'Username must be 64 characters or less'),
      email: z.string().trim().email('Please enter a valid email address').max(254, 'Email must be 254 characters or less'),
      password: z.string().optional(),
      role: z.nativeEnum(Role),
      status: z.enum(['ACTIVE', 'INACTIVE']),
      reportFrequency: z.enum(['none', 'daily', 'weekly', 'monthly']),
      reportFormat: z.enum(['pdf', 'xlsx']),
      reportScheduleTime: z
        .string()
        .trim()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use 24-hour time format HH:MM (e.g., 09:00)'),
      reportScheduleWeekday: z.enum([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]),
      receiveScheduledReports: z.boolean(),
    })
    .superRefine((values, context) => {
      if (mode === 'add' && (!values.password || values.password.trim().length < 8)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at least 8 characters',
          path: ['password'],
        });
      }

      if (values.receiveScheduledReports && values.reportFrequency === 'none') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a schedule frequency when automated reports are enabled',
          path: ['reportFrequency'],
        });
      }
    });

  const { methods, handleSubmit } = useForm<UserFormValues>({
    schema: schema as any,
    onSubmit: async (values) => {
      const payload: UserFormPayload = {
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
        status: values.status,
        receiveScheduledReports: values.receiveScheduledReports,
        reportFrequency: values.receiveScheduledReports ? values.reportFrequency : 'none',
        reportFormat: values.reportFormat,
        reportScheduleTime: values.reportScheduleTime,
        reportScheduleWeekday: values.reportScheduleWeekday,
      };

      if (mode === 'add') {
        payload.password = String(values.password || '').trim();
      }

      await onSubmit(payload);
    },
    initialValues: {
      username: String(initialUser?.username || ''),
      email: String(initialUser?.email || ''),
      password: '',
      role: (initialUser?.role as Role) || Role.STAFF,
      status: initialUser?.status || 'ACTIVE',
      reportFrequency: (initialUser?.reportFrequency as ReportFrequency) || 'none',
      reportFormat: (initialUser?.reportFormat as ReportFormat) || 'pdf',
      reportScheduleTime: String(initialUser?.reportScheduleTime || '09:00'),
      reportScheduleWeekday: (initialUser?.reportScheduleWeekday as ReportScheduleWeekday) || 'monday',
      receiveScheduledReports: Boolean(initialUser?.receiveScheduledReports),
    },
  });

  const autoSendEnabled = Boolean(methods.watch('receiveScheduledReports'));
  const selectedFrequency = methods.watch('reportFrequency');
  const { getError } = useFormErrors(methods.formState.errors);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Controller
          control={methods.control}
          name="username"
          render={({ field }) => (
            <AppInput
              label="Username"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              error={getError('username')}
            />
          )}
        />

        <Controller
          control={methods.control}
          name="email"
          render={({ field }) => (
            <AppInput
              label="Email"
              required
              type="email"
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              error={getError('email')}
            />
          )}
        />
      </div>

      {mode === 'add' ? (
        <Controller
          control={methods.control}
          name="password"
          render={({ field }) => (
            <AppInput
              label="Password"
              required
              type="password"
              value={field.value || ''}
              onChange={(value) => field.onChange(String(value))}
              error={getError('password')}
              hint="Minimum 8 characters"
            />
          )}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Controller
          control={methods.control}
          name="role"
          render={({ field }) => (
            <AppSelect
              label="Role"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value) as Role)}
              options={roleOptions}
              error={getError('role')}
            />
          )}
        />

        <Controller
          control={methods.control}
          name="status"
          render={({ field }) => (
            <AppSelect
              label="Status"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value) as UserStatus)}
              options={statusOptions}
              error={getError('status')}
            />
          )}
        />
      </div>

      <div className="rounded border border-sky-200 bg-sky-50 p-3 dark:border-sky-900/60 dark:bg-sky-950/20">
        <Controller
          control={methods.control}
          name="receiveScheduledReports"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                className="h-4 w-4"
              />
              Enable automated report emails for this user
            </label>
          )}
        />

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Controller
            control={methods.control}
            name="reportFrequency"
            render={({ field }) => (
              <AppSelect
                label="Auto-send Frequency"
                value={field.value}
                onChange={(value) => field.onChange(String(value) as ReportFrequency)}
                options={reportFrequencyOptions}
                error={getError('reportFrequency')}
                disabled={!autoSendEnabled}
              />
            )}
          />

          <Controller
            control={methods.control}
            name="reportFormat"
            render={({ field }) => (
              <AppSelect
                label="Report Format"
                value={field.value}
                onChange={(value) => field.onChange(String(value) as ReportFormat)}
                options={reportFormatOptions}
                error={getError('reportFormat')}
                disabled={!autoSendEnabled}
              />
            )}
          />

          <Controller
            control={methods.control}
            name="reportScheduleTime"
            render={({ field }) => (
              <AppInput
                label="Send Time"
                type="time"
                value={field.value}
                onChange={(value) => field.onChange(String(value))}
                error={getError('reportScheduleTime')}
                disabled={!autoSendEnabled}
              />
            )}
          />

          <Controller
            control={methods.control}
            name="reportScheduleWeekday"
            render={({ field }) => (
              <AppSelect
                label="Weekday (for weekly schedules)"
                value={field.value}
                onChange={(value) => field.onChange(String(value) as ReportScheduleWeekday)}
                options={weekdayOptions}
                error={getError('reportScheduleWeekday')}
                disabled={!autoSendEnabled || selectedFrequency !== 'weekly'}
              />
            )}
          />
        </div>

        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Configure exactly when scheduled report emails are sent for this user.
        </p>
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        In the current backend API, setting status to Inactive deactivates access by removing the account.
      </div>

      <div className="flex items-center gap-2">
        <AppButton variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" loading={loading}>
          {mode === 'add' ? 'Add User' : 'Save Changes'}
        </AppButton>
      </div>
    </form>
  );
}
