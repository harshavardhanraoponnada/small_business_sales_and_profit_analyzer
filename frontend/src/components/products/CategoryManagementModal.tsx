import { useMemo, useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '@/auth/authContext';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks';
import { AppButton, AppInput, EmptyState, LoadingState, Modal } from '@/components/ui';

interface CategoryItem {
  id: string;
  name: string;
  _count?: { products?: number };
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (category: CategoryItem) => void;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  String((error as { message?: string } | null)?.message || fallback);

export default function CategoryManagementModal({
  isOpen,
  onClose,
  onCreated,
}: CategoryManagementModalProps) {
  const { user } = useAuth();
  const canEdit = user?.role === 'OWNER';
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = useMemo(() => {
    return ((categoriesQuery.data || []) as CategoryItem[])
      .filter((category) => category?.id && String(category.name || '').trim())
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [categoriesQuery.data]);

  const resetEditor = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleCreate = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setMessage({ type: 'error', text: 'Category name is required.' });
      return;
    }

    try {
      const category = (await createCategory.mutateAsync({ name: normalizedName })) as CategoryItem;
      setName('');
      setMessage({ type: 'success', text: `${category.name} was created successfully.` });
      onCreated?.(category);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Could not create category.') });
    }
  };

  const handleUpdate = async (id: string) => {
    const normalizedName = editingName.trim();
    if (!normalizedName) {
      setMessage({ type: 'error', text: 'Category name is required.' });
      return;
    }

    try {
      await updateCategory.mutateAsync({ id, data: { name: normalizedName } });
      resetEditor();
      setMessage({ type: 'success', text: 'Category updated successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Could not update category.') });
    }
  };

  const handleDelete = async (category: CategoryItem) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      setMessage({ type: 'success', text: `${category.name} was deleted successfully.` });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Could not delete category.') });
    }
  };

  const isMutating = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Category Management" size="lg">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <AppInput
                label="Category Name"
                required
                value={name}
                onChange={(value) => setName(String(value))}
                placeholder="e.g. Smartphones"
                disabled={createCategory.isPending}
              />
            </div>
            <AppButton onClick={handleCreate} loading={createCategory.isPending}>
              <Plus size={15} />
              Add Category
            </AppButton>
          </div>
        </div>

        {message ? (
          <div
            className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
              message.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
            }`}
          >
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message">
              <X size={15} />
            </button>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Existing Categories</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{categories.length} total</span>
          </div>

          {categoriesQuery.isLoading ? <LoadingState type="skeleton" variant="card" /> : null}
          {categoriesQuery.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {getErrorMessage(categoriesQuery.error, 'Could not load categories.')}
            </p>
          ) : null}
          {!categoriesQuery.isLoading && !categoriesQuery.error && !categories.length ? (
            <EmptyState title="No categories yet" description="Create a category to use it on products." />
          ) : null}
          {!categoriesQuery.isLoading && !categoriesQuery.error && categories.length ? (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {categories.map((category) => (
                <div key={category.id} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  {editingId === category.id ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <AppInput value={editingName} onChange={(value) => setEditingName(String(value))} disabled={updateCategory.isPending} />
                      <div className="flex gap-2">
                        <AppButton size="sm" onClick={() => handleUpdate(category.id)} loading={updateCategory.isPending}>
                          <Save size={14} />
                          Save
                        </AppButton>
                        <AppButton size="sm" variant="ghost" onClick={resetEditor}>
                          Cancel
                        </AppButton>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{category.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {category._count?.products || 0} product{category._count?.products === 1 ? '' : 's'}
                      </p>
                    </div>
                  )}

                  {editingId !== category.id && canEdit ? (
                    <div className="flex shrink-0 gap-2">
                      <AppButton
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(category.id);
                          setEditingName(category.name);
                          setMessage(null);
                        }}
                        disabled={isMutating}
                      >
                        <Pencil size={14} />
                        Edit
                      </AppButton>
                      <AppButton size="sm" variant="danger" onClick={() => handleDelete(category)} loading={deleteCategory.isPending}>
                        <Trash2 size={14} />
                        Delete
                      </AppButton>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <AppButton variant="outline" onClick={onClose}>
            Close
          </AppButton>
        </div>
      </div>
    </Modal>
  );
}
