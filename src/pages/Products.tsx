import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Package, Warehouse } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, PageContainer, Pagination } from '@/components/ui';
import StatCard from '@/components/common/StatCard';
import TopNotification from '@/components/common/TopNotification';
import { useAuth } from '@/auth/authContext';
import {
  useBrands,
  useCategories,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '@/hooks';
import {
  ProductCard,
  ProductsHeader,
  ProductsModal,
  ProductsTable,
  type ProductListItem,
} from '@/components/products';
import { formatNumber } from '@/utils/numberFormat';
import styles from './Products.module.css';

const ITEMS_PER_PAGE = 20;

type CategoryRecord = {
  id: string;
  name: string;
  is_deleted?: boolean | string;
};

type BrandRecord = {
  id: string;
  name: string;
  category_id: string;
  is_deleted?: boolean | string;
};

type ModalState =
  | { isOpen: false; mode: 'add'; product?: undefined }
  | { isOpen: true; mode: 'add'; product?: undefined }
  | { isOpen: true; mode: 'edit'; product: ProductListItem };

type NotificationState = {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
} | null;

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeName = (value: unknown) => String(value || '').trim();

export default function Products() {
  const { user } = useAuth();
  const canDeleteProducts = user?.role === 'OWNER';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add' });
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);

  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const categories = useMemo<CategoryRecord[]>(() => {
    const raw = (categoriesQuery.data || []) as any[];

    return raw
      .filter((category) => String(category?.is_deleted) !== 'true')
      .map((category) => ({
        id: String(category?.id || ''),
        name: normalizeName(category?.name) || 'Uncategorized',
        is_deleted: category?.is_deleted,
      }))
      .filter((category) => category.id && category.name);
  }, [categoriesQuery.data]);

  const brands = useMemo<BrandRecord[]>(() => {
    const raw = (brandsQuery.data || []) as any[];

    return raw
      .filter((brand) => String(brand?.is_deleted) !== 'true')
      .map((brand) => ({
        id: String(brand?.id || ''),
        name: normalizeName(brand?.name),
        category_id: String(brand?.category_id || ''),
        is_deleted: brand?.is_deleted,
      }))
      .filter((brand) => brand.id && brand.name);
  }, [brandsQuery.data]);

  const categoryNameMap = useMemo(() => {
    return new Map(categories.map((category) => [String(category.id), category.name]));
  }, [categories]);

  const products = useMemo<ProductListItem[]>(() => {
    const raw = (productsQuery.data || []) as any[];

    return raw.map((product) => {
      const categoryId = String(product?.category_id ?? product?.categoryId ?? '');
      const categoryName =
        normalizeName(product?.category?.name) ||
        normalizeName(product?.category_name) ||
        categoryNameMap.get(categoryId) ||
        'Uncategorized';

      return {
        id: String(product?.id || ''),
        sku: normalizeName(product?.sku) || String(product?.id || '').slice(0, 8).toUpperCase(),
        name: normalizeName(product?.name) || 'Unnamed Product',
        brand: normalizeName(product?.brand) || 'Unknown Brand',
        category_id: categoryId,
        category_name: categoryName,
        stock: toFiniteNumber(product?.stock),
        purchase_price: toFiniteNumber(product?.purchase_price),
        selling_price: toFiniteNumber(product?.selling_price),
      };
    });
  }, [productsQuery.data, categoryNameMap]);

  const categoryOptions = useMemo(() => {
    return categories
      .map((category) => ({ label: category.name, value: category.id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const brandOptions = useMemo(() => {
    const scopedBrands = categoryFilter
      ? brands.filter((brand) => String(brand.category_id) === String(categoryFilter))
      : brands;

    const unique = new Set(scopedBrands.map((brand) => brand.name).filter(Boolean));
    return [...unique]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name }));
  }, [brands, categoryFilter]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !query ||
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category_name.toLowerCase().includes(query);

      const matchesCategory = !categoryFilter || String(product.category_id) === String(categoryFilter);
      const matchesBrand = !brandFilter || product.brand.toLowerCase() === brandFilter.toLowerCase();

      return matchesQuery && matchesCategory && matchesBrand;
    });
  }, [products, search, categoryFilter, brandFilter]);

  const pagedProducts = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setSelectedProductIds((previous) => previous.filter((id) => filteredProducts.some((product) => product.id === id)));
  }, [filteredProducts]);

  const totalStock = useMemo(() => {
    return filteredProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  }, [filteredProducts]);

  const inventoryValue = useMemo(() => {
    return filteredProducts.reduce(
      (sum, product) => sum + Number(product.stock || 0) * Number(product.selling_price || 0),
      0
    );
  }, [filteredProducts]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setSelectedProductIds([]);
  };

  const handleRefresh = () => {
    productsQuery.refetch();
    categoriesQuery.refetch();
    brandsQuery.refetch();
  };

  const handleSaveProduct = async (payload: {
    name: string;
    sku: string;
    category_id: string;
    brand: string;
    stock: number;
    purchase_price?: number;
    selling_price?: number;
  }) => {
    const isAddMode = modalState.mode === 'add';

    try {
      if (isAddMode) {
        await createProduct.mutateAsync(payload);
      } else {
        await updateProduct.mutateAsync({
          id: modalState.product.id,
          data: payload,
        });
      }

      setNotification({
        id: Date.now(),
        title: isAddMode ? 'Product Added' : 'Product Updated',
        message: `${payload.name} • ${payload.brand} • Stock ${formatNumber(payload.stock)}`,
        type: 'success',
      });

      setModalState({ isOpen: false, mode: 'add' });
    } catch (error: any) {
      setNotification({
        id: Date.now(),
        title: isAddMode ? 'Add Failed' : 'Update Failed',
        message: String(error?.message || 'Could not save product. Please try again.'),
        type: 'error',
      });
    }
  };

  const handleDeleteProduct = async (product: ProductListItem) => {
    if (!canDeleteProducts) {
      return;
    }

    if (!window.confirm(`Delete product "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct.mutateAsync(product.id);
      setNotification({
        id: Date.now(),
        title: 'Product Deleted',
        message: `${product.name} was removed successfully.`,
        type: 'info',
      });
      setSelectedProductIds((previous) => previous.filter((id) => id !== product.id));
    } catch (error: any) {
      setNotification({
        id: Date.now(),
        title: 'Delete Failed',
        message: String(error?.message || 'Could not delete product.'),
        type: 'error',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!canDeleteProducts || selectedProductIds.length === 0) {
      return;
    }

    if (!window.confirm(`Delete ${selectedProductIds.length} selected product(s)?`)) {
      return;
    }

    setIsDeletingSelected(true);

    try {
      for (const id of selectedProductIds) {
        await deleteProduct.mutateAsync(id);
      }

      setNotification({
        id: Date.now(),
        title: 'Bulk Delete Complete',
        message: `${selectedProductIds.length} product(s) deleted.`,
        type: 'success',
      });
      setSelectedProductIds([]);
    } catch (error: any) {
      setNotification({
        id: Date.now(),
        title: 'Bulk Delete Failed',
        message: String(error?.message || 'Some products could not be deleted.'),
        type: 'error',
      });
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleExportCsv = () => {
    const selectedSet = new Set(selectedProductIds);
    const sourceRows = selectedSet.size
      ? filteredProducts.filter((product) => selectedSet.has(product.id))
      : filteredProducts;

    if (!sourceRows.length) {
      setNotification({
        id: Date.now(),
        title: 'Nothing to Export',
        message: 'No products are available for export with the current filters.',
        type: 'info',
      });
      return;
    }

    setIsExporting(true);

    try {
      const headers = ['Name', 'SKU', 'Brand', 'Category', 'Stock', 'Purchase Price', 'Selling Price'];
      const rows = sourceRows.map((product) => [
        product.name,
        product.sku,
        product.brand,
        product.category_name,
        String(product.stock),
        String(product.purchase_price),
        String(product.selling_price),
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      setNotification({
        id: Date.now(),
        title: 'Export Ready',
        message: `${sourceRows.length} product(s) exported to CSV.`,
        type: 'success',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const loading = productsQuery.isLoading || categoriesQuery.isLoading || brandsQuery.isLoading;

  const errorMessage =
    productsQuery.error?.message ||
    categoriesQuery.error?.message ||
    brandsQuery.error?.message ||
    '';

  return (
    <PageContainer>
      {notification ? (
        <TopNotification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      ) : null}

      <div className={styles.productsContainer}>
        <section className={styles.hero}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
            Inventory Intelligence
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Product Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage product catalog, pricing, and stock with clean workflows and fast filters.
          </p>
        </section>

        <div className={styles.statsGrid}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard title="Total Products" value={formatNumber(filteredProducts.length)} icon={<Package />} />
            <StatCard title="Stock Units" value={formatNumber(totalStock)} icon={<Warehouse />} />
            <StatCard title="Inventory Value" value={`₹${formatNumber(inventoryValue)}`} icon={<IndianRupee />} />
          </div>
        </div>

        <ProductsHeader
          search={search}
          categoryFilter={categoryFilter}
          brandFilter={brandFilter}
          categories={categoryOptions}
          brands={brandOptions}
          viewMode={viewMode}
          selectedCount={selectedProductIds.length}
          canDelete={canDeleteProducts}
          exporting={isExporting}
          deletingSelected={isDeletingSelected}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onCategoryFilterChange={(value) => {
            setCategoryFilter(value);
            setBrandFilter('');
            setPage(1);
          }}
          onBrandFilterChange={(value) => {
            setBrandFilter(value);
            setPage(1);
          }}
          onClearFilters={() => {
            setSearch('');
            setCategoryFilter('');
            setBrandFilter('');
            setPage(1);
          }}
          onRefresh={handleRefresh}
          onAddClick={() => setModalState({ isOpen: true, mode: 'add' })}
          onViewModeChange={setViewMode}
          onExport={handleExportCsv}
          onBulkDelete={handleBulkDelete}
        />

        {loading ? <LoadingState type="skeleton" variant="table" /> : null}

        {errorMessage ? (
          <ErrorState title="Failed to load products" message={errorMessage} onRetry={handleRefresh} />
        ) : null}

        {!loading && !errorMessage ? (
          viewMode === 'table' ? (
            <div className={styles.panel}>
              <ProductsTable
                key={`products-table-${page}`}
                products={pagedProducts}
                loading={false}
                error={undefined}
                page={page}
                limit={ITEMS_PER_PAGE}
                total={filteredProducts.length}
                canDelete={canDeleteProducts}
                onPageChange={handlePageChange}
                onEdit={(product) => setModalState({ isOpen: true, mode: 'edit', product })}
                onDelete={handleDeleteProduct}
                onSelectionChange={(rows) => setSelectedProductIds(rows.map((row) => String(row.id)))}
              />
            </div>
          ) : (
            <>
              {pagedProducts.length ? (
                <div className={styles.gridView}>
                  {pagedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      canDelete={canDeleteProducts}
                      onEdit={(item) => setModalState({ isOpen: true, mode: 'edit', product: item })}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No products found" description="Add your first product or adjust filters." />
              )}

              {pagedProducts.length ? (
                <div className={styles.paginationWrap}>
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              ) : null}
            </>
          )
        ) : null}
      </div>

      <ProductsModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialProduct={modalState.mode === 'edit' ? modalState.product : undefined}
        categories={categories}
        brands={brands}
        loading={createProduct.isPending || updateProduct.isPending}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        onSave={handleSaveProduct}
      />
    </PageContainer>
  );
}
