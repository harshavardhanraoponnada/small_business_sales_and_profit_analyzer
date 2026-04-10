import { useEffect, useState } from 'react';
import { Bell, Clock } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppButton, AppInput, AppSelect, Modal } from '@/components/ui';
import { useTheme } from '@/hooks';
import { apiPost, endpoints } from '@/services/api';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
}

const REPORT_TYPES = ['summary', 'sales-trend', 'profit-trend', 'expense-distribution', 'expenses'] as const;
const SCHEDULE_FORMATS = ['pdf', 'csv'] as const;
const SCHEDULE_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeRecipients = (rawValue: string) => {
  return rawValue
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

const scheduleSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  format: z.enum(SCHEDULE_FORMATS),
  frequency: z.enum(SCHEDULE_FREQUENCIES),
  recipients: z
    .string()
    .trim()
    .refine(
      (value) => {
        const recipients = normalizeRecipients(value);
        return recipients.length === 0 || recipients.every((email) => emailPattern.test(email));
      },
      { message: 'Use comma-separated valid email addresses.' }
    ),
  enabled: z.boolean(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const sanitizeReportType = (reportType: string): ScheduleFormValues['reportType'] => {
  if ((REPORT_TYPES as readonly string[]).includes(reportType)) {
    return reportType as ScheduleFormValues['reportType'];
  }

  return 'summary';
};

const createDefaultValues = (reportType: string): ScheduleFormValues => ({
  reportType: sanitizeReportType(reportType),
  format: 'pdf',
  frequency: 'daily',
  recipients: '',
  enabled: true,
});

export default function ScheduleReportModal({ isOpen, onClose, reportType }: ScheduleReportModalProps) {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: createDefaultValues(reportType),
  });

  useEffect(() => {
    if (isOpen) {
      reset(createDefaultValues(reportType));
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, reportType, reset]);

  const onSubmit = async (values: ScheduleFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const recipients = normalizeRecipients(values.recipients);

      const response = await apiPost<any>(endpoints.reports.schedule, {
        reportType: values.reportType,
        format: values.format,
        frequency: values.frequency,
        recipients,
        enabled: values.enabled,
      });

      const successMessage =
        String((response as any)?.message || '').trim() || 'Report schedule saved successfully.';

      setSuccess(successMessage);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError(String(err?.message || 'Failed to create schedule'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Report"
      size="md"
    >
      <form id="schedule-report-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Clock size={16} />
          <span className="text-sm font-medium">Configure recurring report delivery</span>
        </div>

        <Controller
          control={control}
          name="reportType"
          render={({ field }) => (
            <AppSelect
              label="Report Type"
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              options={[
                { label: 'Summary', value: 'summary' },
                { label: 'Sales Trend', value: 'sales-trend' },
                { label: 'Profit Trend', value: 'profit-trend' },
                { label: 'Expense Distribution', value: 'expense-distribution' },
                { label: 'Expenses', value: 'expenses' },
              ]}
              error={errors.reportType?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name="format"
            render={({ field }) => (
              <AppSelect
                label="Format"
                value={field.value}
                onChange={(value) => field.onChange(String(value))}
                options={[
                  { label: 'PDF', value: 'pdf' },
                  { label: 'CSV', value: 'csv' },
                ]}
                error={errors.format?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <AppSelect
                label="Frequency"
                value={field.value}
                onChange={(value) => field.onChange(String(value))}
                options={[
                  { label: 'Daily', value: 'daily' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                ]}
                error={errors.frequency?.message}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="recipients"
          render={({ field }) => (
            <AppInput
              label="Recipients (comma-separated emails)"
              value={field.value}
              onChange={(value) => field.onChange(value)}
              onBlur={field.onBlur}
              placeholder="email1@example.com, email2@example.com"
              error={errors.recipients?.message}
            />
          )}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            {...register('enabled')}
            className="h-4 w-4"
          />
          <Bell size={14} />
          Enable this schedule
        </label>

        {error ? <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {success ? (
          <div className={`rounded border p-2 text-sm ${isDarkMode ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {success}
          </div>
        ) : null}

        <div className="flex w-full items-center gap-2 pt-1">
          <AppButton variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </AppButton>
          <AppButton variant="primary" type="submit" loading={isLoading}>
            Save schedule
          </AppButton>
        </div>
      </form>
    </Modal>
  );
}
