import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { AppInput, AppSelect, AppButton } from '@/components/ui';
import { useForm, useFormErrors } from '@/hooks';
import { apiGet } from '@/services/api';
import { formatNumber } from '@/utils/numberFormat';

interface SalesFormValues {
  customerName: string;
  categoryId: string;
  brandId: string;
  modelId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface SalesFormProps {
  mode: 'add' | 'edit';
  initialSale?: any;
  onSubmit: (payload: { customer_name?: string; variant_id?: string; quantity: number; unit_price: number; notes?: string }) => Promise<void>;
  loading?: boolean;
  submitError?: string;
  onCancel: () => void;
}

const createSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().min(1, 'Brand is required'),
  modelId: z.string().min(1, 'Model is required'),
  variantId: z.string().min(1, 'Variant is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be positive'),
  notes: z.string().max(500).optional(),
});

const editSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required'),
  categoryId: z.string().optional().default(''),
  brandId: z.string().optional().default(''),
  modelId: z.string().optional().default(''),
  variantId: z.string().optional().default(''),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be positive'),
  notes: z.string().max(500).optional(),
});

const normalizeList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getVariantSellingPrice = (variant: any): number => {
  if (!variant) return 0;

  const directPrice = Number(variant.selling_price);
  if (Number.isFinite(directPrice) && directPrice > 0) {
    return directPrice;
  }

  if (typeof variant.prices === 'string') {
    try {
      const parsed = JSON.parse(variant.prices);
      const parsedPrice = Number(parsed?.selling_price || 0);
      if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
        return parsedPrice;
      }
    } catch {
      return 0;
    }
  }

  return 0;
};

export default function SalesForm({ mode, initialSale, onSubmit, loading, submitError, onCancel }: SalesFormProps) {
  const schema = mode === 'add' ? createSchema : editSchema;

  const { methods, handleSubmit } = useForm<SalesFormValues>({
    schema: schema as any,
    onSubmit: async (values) => {
      const selectedVariantPrice = getVariantSellingPrice(selectedVariant);
      const unitPrice = mode === 'add'
        ? Number(values.unitPrice || selectedVariantPrice || 0)
        : Number(values.unitPrice || initialSale?.unit_price || 0);

      await onSubmit({
        customer_name: values.customerName,
        variant_id: mode === 'add' ? values.variantId : undefined,
        quantity: Number(values.quantity),
        unit_price: unitPrice,
        notes: values.notes || '',
      });
    },
    initialValues: {
      customerName: String(initialSale?.customer_name || ''),
      categoryId: '',
      brandId: '',
      modelId: '',
      variantId: mode === 'edit' ? String(initialSale?.variant_id || '') : '',
      quantity: Number(initialSale?.quantity || 1),
      unitPrice: Number(initialSale?.unit_price || 0),
      notes: String(initialSale?.notes || ''),
    },
  });

  const { getError } = useFormErrors(methods.formState.errors);

  const categoryId = methods.watch('categoryId');
  const brandId = methods.watch('brandId');
  const modelId = methods.watch('modelId');
  const variantId = methods.watch('variantId');
  const quantity = methods.watch('quantity');

  const categoriesQuery = useQuery({
    queryKey: ['sales-form', 'categories'],
    enabled: mode === 'add',
    queryFn: async () => normalizeList(await apiGet('/categories')),
  });

  const brandsQuery = useQuery({
    queryKey: ['sales-form', 'brands', categoryId],
    enabled: mode === 'add' && Boolean(categoryId),
    queryFn: async () => normalizeList(await apiGet(`/brands?categoryId=${categoryId}`)),
  });

  const modelsQuery = useQuery({
    queryKey: ['sales-form', 'models', brandId],
    enabled: mode === 'add' && Boolean(brandId),
    queryFn: async () => normalizeList(await apiGet(`/models?brandId=${brandId}`)),
  });

  const variantsQuery = useQuery({
    queryKey: ['sales-form', 'variants', modelId],
    enabled: mode === 'add' && Boolean(modelId),
    queryFn: async () => normalizeList(await apiGet(`/variants?modelId=${modelId}`)),
  });

  const selectedVariant = useMemo(
    () => variantsQuery.data?.find((item: any) => String(item.id) === String(variantId)),
    [variantsQuery.data, variantId]
  );

  useEffect(() => {
    if (mode !== 'add') return;
    if (!selectedVariant) return;

    const variantPrice = getVariantSellingPrice(selectedVariant);
    methods.setValue('unitPrice', variantPrice, { shouldDirty: true, shouldValidate: true });
  }, [methods, mode, selectedVariant]);

  const totalPreview = useMemo(() => {
    const unitPrice = mode === 'add'
      ? Number(methods.watch('unitPrice') || getVariantSellingPrice(selectedVariant) || 0)
      : Number(methods.watch('unitPrice') || 0);
    return unitPrice * Number(quantity || 0);
  }, [mode, methods, quantity, selectedVariant]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {submitError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {submitError}
        </div>
      ) : null}

      <Controller
        control={methods.control}
        name="customerName"
        render={({ field }) => (
          <AppInput
            label="Customer Name"
            required
            value={field.value}
            onChange={(value) => field.onChange(String(value))}
            error={getError('customerName')}
          />
        )}
      />

      {mode === 'add' ? (
        <>
          <Controller
            control={methods.control}
            name="categoryId"
            render={({ field }) => (
              <AppSelect
                label="Category"
                required
                value={field.value}
                onChange={(value) => {
                  methods.setValue('brandId', '');
                  methods.setValue('modelId', '');
                  methods.setValue('variantId', '');
                  field.onChange(String(value));
                }}
                options={(categoriesQuery.data || []).map((item: any) => ({ label: item.name, value: String(item.id) }))}
                error={getError('categoryId')}
              />
            )}
          />

          <Controller
            control={methods.control}
            name="brandId"
            render={({ field }) => (
              <AppSelect
                label="Brand"
                required
                disabled={!categoryId}
                value={field.value}
                onChange={(value) => {
                  methods.setValue('modelId', '');
                  methods.setValue('variantId', '');
                  field.onChange(String(value));
                }}
                options={(brandsQuery.data || []).map((item: any) => ({ label: item.name, value: String(item.id) }))}
                error={getError('brandId')}
              />
            )}
          />

          <Controller
            control={methods.control}
            name="modelId"
            render={({ field }) => (
              <AppSelect
                label="Model"
                required
                disabled={!brandId}
                value={field.value}
                onChange={(value) => {
                  methods.setValue('variantId', '');
                  field.onChange(String(value));
                }}
                options={(modelsQuery.data || []).map((item: any) => ({ label: item.name, value: String(item.id) }))}
                error={getError('modelId')}
              />
            )}
          />

          <Controller
            control={methods.control}
            name="variantId"
            render={({ field }) => (
              <AppSelect
                label="Variant"
                required
                disabled={!modelId}
                value={field.value}
                onChange={(value) => field.onChange(String(value))}
                options={(variantsQuery.data || []).map((item: any) => ({
                  label: `${item.variant_name} (Stock: ${item.stock})`,
                  value: String(item.id),
                }))}
                error={getError('variantId')}
              />
            )}
          />
        </>
      ) : null}

      <Controller
        control={methods.control}
        name="unitPrice"
        render={({ field }) => (
          <AppInput
            label="Unit Price"
            type="number"
            required
            value={field.value ?? 0}
            onChange={(value) => field.onChange(Number(value))}
            error={getError('unitPrice' as any)}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="quantity"
        render={({ field }) => (
          <AppInput
            label="Quantity"
            type="number"
            required
            value={field.value}
            onChange={(value) => field.onChange(Number(value))}
            error={getError('quantity')}
          />
        )}
      />

      <Controller
        control={methods.control}
        name="notes"
        render={({ field }) => (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes</label>
            <textarea
              rows={3}
              value={field.value || ''}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder="Optional notes"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {getError('notes' as any) ? <p className="text-xs text-red-500">{getError('notes' as any)}</p> : null}
          </div>
        )}
      />

      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="font-medium text-slate-700 dark:text-slate-200">
          {mode === 'add'
            ? `Unit Price: ₹${formatNumber(methods.watch('unitPrice') || getVariantSellingPrice(selectedVariant) || 0)}`
            : `Unit Price: ₹${formatNumber(methods.watch('unitPrice') || 0)}`}
        </p>
        <p className="text-slate-600 dark:text-slate-300">Total: ₹{formatNumber(totalPreview)}</p>
      </div>

      <div className="flex items-center gap-2">
        <AppButton variant="outline" onClick={onCancel} disabled={loading}>Cancel</AppButton>
        <AppButton variant="primary" type="submit" loading={loading}>
          {mode === 'add' ? 'Record Sale' : 'Save Changes'}
        </AppButton>
      </div>
    </form>
  );
}
