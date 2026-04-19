import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { useForm, useFormErrors } from '@/hooks';
import ExpenseUpload from './ExpenseUpload';

interface ExpenseFormValues {
  category: string;
  date: string;
  amount: number;
  vendor_name: string;
  invoice_reference: string;
  tax_amount: number;
  payment_method: string;
  affects_cogs_override: 'default' | 'true' | 'false';
  description: string;
}

interface ExpenseSubmitPayload {
  category: string;
  date: string;
  amount: number;
  vendor_name: string;
  invoice_reference: string;
  tax_amount: number;
  payment_method: string;
  affects_cogs_override?: boolean | null;
  description: string;
  file?: File | null;
}

interface ExpenseFormProps {
  mode: 'add' | 'edit';
  initialExpense?: any;
  categories: Array<{ label: string; value: string }>;
  paymentMethods: Array<{ label: string; value: string }>;
  loading?: boolean;
  onSubmit: (payload: ExpenseSubmitPayload) => Promise<void>;
  onCancel: () => void;
}

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Expense date is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  vendor_name: z.string().trim().min(1, 'Vendor/Payee is required').max(160, 'Vendor/Payee must be 160 characters or less'),
  invoice_reference: z.string().trim().min(1, 'Invoice/Bill reference is required').max(120, 'Invoice/Bill reference must be 120 characters or less'),
  tax_amount: z.number().min(0, 'Tax amount cannot be negative'),
  payment_method: z.string().min(1, 'Payment method is required'),
  affects_cogs_override: z.enum(['default', 'true', 'false']),
  description: z.string().trim().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
});

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

export default function ExpenseForm({
  mode,
  initialExpense,
  categories,
  paymentMethods,
  loading,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const { methods, handleSubmit } = useForm<ExpenseFormValues>({
    schema: schema as any,
    onSubmit: async (values) => {
      const cogsOverride =
        values.affects_cogs_override === 'default'
          ? null
          : values.affects_cogs_override === 'true';

      await onSubmit({
        category: values.category,
        date: values.date,
        amount: Number(values.amount),
        vendor_name: values.vendor_name.trim(),
        invoice_reference: values.invoice_reference.trim(),
        tax_amount: Number(values.tax_amount || 0),
        payment_method: values.payment_method,
        affects_cogs_override: cogsOverride,
        description: values.description.trim(),
        file: selectedFile,
      });
    },
    initialValues: {
      category: String(initialExpense?.category || ''),
      date: toDateInputValue(initialExpense?.date || new Date()),
      amount: Number(initialExpense?.amount || 0),
      vendor_name: String(initialExpense?.vendor_name || ''),
      invoice_reference: String(initialExpense?.invoice_reference || ''),
      tax_amount: Number(initialExpense?.tax_amount || 0),
      payment_method: String(initialExpense?.payment_method || ''),
      affects_cogs_override:
        typeof initialExpense?.affects_cogs_override === 'boolean'
          ? String(initialExpense.affects_cogs_override) as 'true' | 'false'
          : 'default',
      description: String(initialExpense?.description || ''),
    },
  });

  const selectedFile = methods.watch('file' as any) as File | null | undefined;
  const { getError } = useFormErrors(methods.formState.errors);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Controller
        control={methods.control}
        name="category"
        render={({ field }) => (
          <AppSelect
            label="Category"
            required
            value={field.value}
            onChange={(value) => field.onChange(String(value))}
            options={categories}
            error={getError('category')}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="date"
        render={({ field }) => (
          <AppInput
            label="Expense Date"
            required
            type="date"
            value={field.value || ''}
            onChange={(value) => field.onChange(String(value))}
            error={getError('date')}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="amount"
        render={({ field }) => (
          <AppInput
            label="Amount"
            required
            type="number"
            value={field.value ?? ''}
            onChange={(value) => field.onChange(Number(value))}
            error={getError('amount')}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="vendor_name"
        render={({ field }) => (
          <AppInput
            label="Vendor/Payee"
            required
            value={field.value || ''}
            onChange={(value) => field.onChange(String(value))}
            error={getError('vendor_name')}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="invoice_reference"
        render={({ field }) => (
          <AppInput
            label="Invoice/Bill Reference"
            required
            value={field.value || ''}
            onChange={(value) => field.onChange(String(value))}
            error={getError('invoice_reference')}
          />
        )}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Controller
          control={methods.control}
          name="tax_amount"
          render={({ field }) => (
            <AppInput
              label="GST/Tax Amount"
              required
              type="number"
              value={field.value ?? ''}
              onChange={(value) => field.onChange(Number(value || 0))}
              error={getError('tax_amount')}
            />
          )}
        />

        <Controller
          control={methods.control}
          name="payment_method"
          render={({ field }) => (
            <AppSelect
              label="Payment Method"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              options={paymentMethods}
              error={getError('payment_method')}
            />
          )}
        />
      </div>

      <Controller
        control={methods.control}
        name="affects_cogs_override"
        render={({ field }) => (
          <AppSelect
            label="COGS Impact"
            value={field.value}
            onChange={(value) => field.onChange(String(value) as 'default' | 'true' | 'false')}
            options={[
              { label: 'Use category default', value: 'default' },
              { label: 'Force include in COGS', value: 'true' },
              { label: 'Force exclude from COGS', value: 'false' },
            ]}
            error={getError('affects_cogs_override')}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="description"
        render={({ field }) => (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Description<span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={field.value || ''}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder="Enter expense description"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {getError('description') ? <p className="text-xs text-red-500">{getError('description')}</p> : null}
          </div>
        )}
      />

      <ExpenseUpload
        file={selectedFile || null}
        onFileChange={(file) => methods.setValue('file' as any, file as any)}
        disabled={loading}
      />

      <div className="flex items-center gap-2">
        <AppButton variant="outline" onClick={onCancel} disabled={loading}>Cancel</AppButton>
        <AppButton type="submit" variant="primary" loading={loading}>
          {mode === 'add' ? 'Add Expense' : 'Save Changes'}
        </AppButton>
      </div>
    </form>
  );
}
