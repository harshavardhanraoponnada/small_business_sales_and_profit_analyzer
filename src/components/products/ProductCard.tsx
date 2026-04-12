import { Pencil, Trash2 } from 'lucide-react';
import { AppButton } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';
import type { ProductListItem } from './ProductsTable';

interface ProductCardProps {
  product: ProductListItem;
  canDelete: boolean;
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
}

export default function ProductCard({ product, canDelete, onEdit, onDelete }: ProductCardProps) {
  const inventoryValue = Number(product.stock || 0) * Number(product.selling_price || 0);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{product.name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{product.brand}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {product.sku}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {product.category_name || 'Uncategorized'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Stock</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(product.stock || 0)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Sell Price</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">₹{formatNumber(product.selling_price || 0)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Buy Price</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">₹{formatNumber(product.purchase_price || 0)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Inventory Value</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">₹{formatNumber(inventoryValue)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <AppButton variant="outline" size="sm" onClick={() => onEdit(product)}>
          <Pencil size={14} />
          Edit
        </AppButton>
        {canDelete ? (
          <AppButton variant="danger" size="sm" onClick={() => onDelete(product)}>
            <Trash2 size={14} />
            Delete
          </AppButton>
        ) : null}
      </div>
    </article>
  );
}
