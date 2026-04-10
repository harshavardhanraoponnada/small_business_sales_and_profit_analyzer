import { useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { useForm, useFormErrors } from '@/hooks';
import { formatNumber } from '@/utils/numberFormat';
import type { InventoryProduct, StockAdjustmentPayload, StockAdjustmentType } from './types';

interface StockFormProps {
  products: InventoryProduct[];
  initialProductId?: string;
  loading?: boolean;
  submitError?: string;
  onCancel: () => void;
  onSubmit: (payload: StockAdjustmentPayload) => Promise<void>;
}

const stockSchema = z
  .object({
    productId: z.string().min(1, 'Product is required'),
    adjustmentType: z.enum(['add', 'reduce', 'set']),
    quantity: z.number().int().nonnegative('Quantity cannot be negative'),
    note: z.string().max(250, 'Note must be 250 characters or fewer').optional(),
  })
  .refine(
    (values) => {
      if (values.adjustmentType === 'set') {
        return values.quantity >= 0;
      }

      return values.quantity > 0;
    },
    {
      message: 'Quantity must be at least 1 for add or reduce actions',
      path: ['quantity'],
    }
  );

type StockFormValues = z.infer<typeof stockSchema>;

const calculateNextStock = (currentStock: number, adjustmentType: StockAdjustmentType, quantity: number) => {
  if (adjustmentType === 'add') {
    return currentStock + quantity;
  }

  if (adjustmentType === 'reduce') {
    return currentStock - quantity;
  }

  return quantity;
};

export default function StockForm({
  products,
  initialProductId,
  loading,
  submitError,
  onCancel,
  onSubmit,
}: StockFormProps) {
  const [customError, setCustomError] = useState('');

  const { methods, handleSubmit } = useForm<StockFormValues>({
    schema: stockSchema,
    onSubmit: async (values) => {
      setCustomError('');

      const selectedProduct = products.find((product) => String(product.id) === String(values.productId));
      if (!selectedProduct) {
        setCustomError('Selected product could not be found. Please refresh and try again.');
        return;
      }

      const currentStock = Number(selectedProduct.stock || 0);
      const quantity = Number(values.quantity || 0);

      if (values.adjustmentType === 'reduce' && quantity > currentStock) {
        setCustomError('Reduce quantity cannot exceed current stock.');
        return;
      }

      const nextStock = calculateNextStock(currentStock, values.adjustmentType, quantity);
      if (nextStock < 0) {
        setCustomError('Stock cannot become negative.');
        return;
      }

      try {
        await onSubmit({
          productId: String(values.productId),
          adjustmentType: values.adjustmentType,
          quantity,
          previousStock: currentStock,
          nextStock,
          note: values.note?.trim() || undefined,
        });
      } catch (error: any) {
        setCustomError(String(error?.message || 'Failed to adjust stock.'));
      }
    },
    initialValues: {
      productId: initialProductId || String(products[0]?.id || ''),
      adjustmentType: 'add',
      quantity: 1,
      note: '',
    },
  });

  const { getError } = useFormErrors(methods.formState.errors);

  const productId = methods.watch('productId');
  const adjustmentType = methods.watch('adjustmentType');
  const quantity = Number(methods.watch('quantity') || 0);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === String(productId)),
    [products, productId]
  );

  useEffect(() => {
    if (initialProductId) {
      methods.setValue('productId', String(initialProductId), {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [initialProductId, methods]);

  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    const currentValue = methods.getValues('productId');
    if (!currentValue) {
      methods.setValue('productId', String(products[0].id), {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [products, methods]);

  const currentStock = Number(selectedProduct?.stock || 0);
  const nextStock = calculateNextStock(currentStock, adjustmentType || 'add', quantity);
  const delta = nextStock - currentStock;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {submitError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {submitError}
        </div>
      ) : null}

      {customError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {customError}
        </div>
      ) : null}

      <Controller
        control={methods.control}
        name="productId"
        render={({ field }) => (
          <AppSelect
            label="Product"
            required
            value={field.value}
            onChange={(value) => {
              setCustomError('');
              field.onChange(String(value));
            }}
            options={products.map((product) => ({
              value: product.id,
              label: `${product.name} (${product.sku}) • Stock ${formatNumber(product.stock)}`,
            }))}
            error={getError('productId')}
            disabled={loading}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="adjustmentType"
        render={({ field }) => (
          <AppSelect
            label="Adjustment Type"
            required
            value={field.value}
            onChange={(value) => {
              setCustomError('');
              field.onChange(String(value) as StockAdjustmentType);
            }}
            options={[
              { value: 'add', label: 'Add stock' },
              { value: 'reduce', label: 'Reduce stock' },
              { value: 'set', label: 'Set exact stock' },
            ]}
            error={getError('adjustmentType')}
            disabled={loading}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="quantity"
        render={({ field }) => (
          <AppInput
            label={adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
            type="number"
            required
            value={field.value ?? 0}
            onChange={(value) => {
              setCustomError('');
              const parsed = Number(value);
              field.onChange(Number.isFinite(parsed) ? parsed : 0);
            }}
            error={getError('quantity')}
            disabled={loading}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="note"
        render={({ field }) => (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Note (optional)</label>
            <textarea
              rows={3}
              value={field.value || ''}
              onChange={(event) => {
                setCustomError('');
                field.onChange(event.target.value);
              }}
              placeholder="Reason for this adjustment"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              disabled={loading}
            />
            {getError('note') ? <p className="text-xs text-red-500">{getError('note')}</p> : null}
          </div>
        )}
      />

      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="font-medium text-slate-700 dark:text-slate-200">Current stock: {formatNumber(currentStock)}</p>
        <p className="text-slate-600 dark:text-slate-300">New stock: {formatNumber(nextStock)}</p>
        <p className={delta >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>
          Change: {delta >= 0 ? '+' : ''}
          {formatNumber(delta)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <AppButton variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </AppButton>
        <AppButton variant="primary" type="submit" loading={loading}>
          Apply Adjustment
        </AppButton>
      </div>
    </form>
  );
}
