import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { useForm, useFormErrors } from '@/hooks';

interface CategoryItem {
  id: string;
  name: string;
}

interface BrandItem {
  id: string;
  name: string;
  category_id: string;
}

interface ProductFormValues {
  name: string;
  sku: string;
  category_id: string;
  brand: string;
  stock: number;
  purchase_price?: number;
  selling_price?: number;
}

interface ProductSubmitPayload {
  name: string;
  sku: string;
  category_id: string;
  brand: string;
  stock: number;
  purchase_price?: number;
  selling_price?: number;
}

interface ProductFormProps {
  mode: 'add' | 'edit';
  initialProduct?: Partial<ProductSubmitPayload>;
  categories: CategoryItem[];
  brands: BrandItem[];
  loading?: boolean;
  onSubmit: (payload: ProductSubmitPayload) => Promise<void>;
  onCancel: () => void;
}

const schema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(100, 'Product name must be 100 characters or less'),
  sku: z.string().trim().min(1, 'SKU is required').max(64, 'SKU must be 64 characters or less'),
  category_id: z.string().trim().min(1, 'Category is required'),
  brand: z.string().trim().min(1, 'Brand is required').max(100, 'Brand must be 100 characters or less'),
  stock: z.number().int().min(0, 'Stock must be 0 or greater'),
  purchase_price: z.number().positive('Purchase price must be greater than 0').optional(),
  selling_price: z.number().positive('Selling price must be greater than 0').optional(),
});

export default function ProductForm({
  mode,
  initialProduct,
  categories,
  brands,
  loading,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const { methods, handleSubmit } = useForm<ProductFormValues>({
    schema: schema as any,
    onSubmit: async (values) => {
      const payload: ProductSubmitPayload = {
        name: values.name.trim(),
        sku: values.sku.trim(),
        category_id: values.category_id,
        brand: values.brand.trim(),
        stock: Number(values.stock || 0),
      };

      if (values.purchase_price !== undefined) {
        payload.purchase_price = Number(values.purchase_price);
      }

      if (values.selling_price !== undefined) {
        payload.selling_price = Number(values.selling_price);
      }

      await onSubmit(payload);
    },
    initialValues: {
      name: String(initialProduct?.name || ''),
      sku: String(initialProduct?.sku || ''),
      category_id: String(initialProduct?.category_id || ''),
      brand: String(initialProduct?.brand || ''),
      stock: Number(initialProduct?.stock ?? 0),
      purchase_price:
        initialProduct?.purchase_price === undefined || initialProduct?.purchase_price === null
          ? undefined
          : Number(initialProduct.purchase_price),
      selling_price:
        initialProduct?.selling_price === undefined || initialProduct?.selling_price === null
          ? undefined
          : Number(initialProduct.selling_price),
    },
  });

  const { getError } = useFormErrors(methods.formState.errors);

  const selectedCategoryId = methods.watch('category_id');
  const purchasePrice = Number(methods.watch('purchase_price') || 0);
  const sellingPrice = Number(methods.watch('selling_price') || 0);

  const filteredBrands = useMemo(() => {
    if (!selectedCategoryId) {
      return brands;
    }

    return brands.filter((brand) => String(brand.category_id) === String(selectedCategoryId));
  }, [brands, selectedCategoryId]);

  const brandOptions = useMemo(() => {
    const unique = new Map<string, string>();

    for (const brand of filteredBrands) {
      if (!unique.has(brand.name)) {
        unique.set(brand.name, brand.name);
      }
    }

    return [...unique.entries()].map(([label, value]) => ({ label, value }));
  }, [filteredBrands]);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: category.name, value: category.id })),
    [categories]
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Controller
          control={methods.control}
          name="name"
          render={({ field }) => (
            <AppInput
              label="Product Name"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              error={getError('name')}
            />
          )}
        />

        <Controller
          control={methods.control}
          name="sku"
          render={({ field }) => (
            <AppInput
              label="SKU"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              error={getError('sku')}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Controller
          control={methods.control}
          name="category_id"
          render={({ field }) => (
            <AppSelect
              label="Category"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              options={categoryOptions}
              error={getError('category_id')}
            />
          )}
        />

        <Controller
          control={methods.control}
          name="brand"
          render={({ field }) => (
            <AppSelect
              label="Brand"
              required
              value={field.value}
              onChange={(value) => field.onChange(String(value))}
              options={brandOptions}
              placeholder={selectedCategoryId ? 'Select brand' : 'Select category first'}
              error={getError('brand')}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Controller
          control={methods.control}
          name="stock"
          render={({ field }) => (
            <AppInput
              label="Stock"
              required
              type="number"
              value={field.value ?? 0}
              onChange={(value) => field.onChange(value === '' ? 0 : Number(value))}
              error={getError('stock')}
            />
          )}
        />

        <Controller
          control={methods.control}
          name="purchase_price"
          render={({ field }) => (
            <AppInput
              label="Purchase Price"
              type="number"
              value={field.value ?? ''}
              onChange={(value) => field.onChange(value === '' ? undefined : Number(value))}
              error={getError('purchase_price')}
            />
          )}
        />

        <Controller
          control={methods.control}
          name="selling_price"
          render={({ field }) => (
            <AppInput
              label="Selling Price"
              type="number"
              value={field.value ?? ''}
              onChange={(value) => field.onChange(value === '' ? undefined : Number(value))}
              error={getError('selling_price')}
            />
          )}
        />
      </div>

      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-700 dark:text-slate-200">
          Margin per unit:{' '}
          <span className={sellingPrice - purchasePrice >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
            ₹{(sellingPrice - purchasePrice).toFixed(2)}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <AppButton variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" loading={loading}>
          {mode === 'add' ? 'Add Product' : 'Save Changes'}
        </AppButton>
      </div>
    </form>
  );
}
