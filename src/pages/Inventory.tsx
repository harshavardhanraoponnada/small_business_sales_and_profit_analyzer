import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, IndianRupee, PackagePlus } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import TopNotification from '@/components/common/TopNotification';
import {
  AppButton,
  AppInput,
  AppSelect,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageContainer,
} from '@/components/ui';
import { useAuth } from '@/auth/authContext';
import { useBrands, useCategories, useProducts, useUpdateProduct } from '@/hooks';
import {
  InventoryHeader,
  InventoryTable,
  StockModal,
  type InventoryProduct,
  type StockAdjustmentPayload,
  type StockAdjustmentType,
} from '@/components/inventory';
import { apiGet, apiPut } from '@/services/api';
import { formatNumber } from '@/utils/numberFormat';
import styles from './Inventory.module.css';

const ITEMS_PER_PAGE = 20;
const LOW_STOCK_THRESHOLD = 10;
const INVENTORY_TRAVERSAL_STORAGE_KEY = 'inventory.traversal.v1';

type NotificationState = {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
} | null;

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

type ModelRecord = {
  id: string;
  name: string;
  brand_id: string;
  is_deleted?: boolean | string;
};

type VariantRecord = {
  id: string;
  model_id: string;
  variant_name: string;
  stock: number;
  purchase_price: number;
  selling_price: number;
  reorder_level: number;
  is_deleted?: boolean | string;
};

type VariantSortOption = 'stock-desc' | 'stock-asc' | 'name-asc' | 'name-desc' | 'risk-first';

type VariantAdjustState = {
  isOpen: boolean;
  variant?: VariantRecord;
};

type PersistedTraversalState = {
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  variantSort?: VariantSortOption;
};

type StockHistoryEntry = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  nextStock: number;
  delta: number;
  adjustmentType: StockAdjustmentType;
  note?: string;
  timestamp: string;
  actor: string;
};

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const isVariantSortOption = (value: unknown): value is VariantSortOption => {
  return (
    value === 'stock-desc' ||
    value === 'stock-asc' ||
    value === 'name-asc' ||
    value === 'name-desc' ||
    value === 'risk-first'
  );
};

const normalizeListPayload = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as T[];
    }
  }

  return [];
};

const parseCategoryName = (rawProduct: Record<string, unknown>) => {
  const category = rawProduct.category;
  if (category && typeof category === 'object') {
    const name = normalizeText((category as Record<string, unknown>).name);
    if (name) {
      return name;
    }
  }

  const categoryName = normalizeText(rawProduct.category_name);
  return categoryName || 'Uncategorized';
};

const parseReorderLevel = (rawProduct: Record<string, unknown>) => {
  const directValue = toFiniteNumber(rawProduct.reorder_level ?? rawProduct.reorderLevel);
  if (directValue > 0) {
    return directValue;
  }

  const prices = rawProduct.prices;
  if (typeof prices === 'string') {
    try {
      const parsed = JSON.parse(prices) as Record<string, unknown>;
      const value = toFiniteNumber(parsed.reorder_level);
      if (value > 0) {
        return value;
      }
    } catch {
      return LOW_STOCK_THRESHOLD;
    }
  }

  if (prices && typeof prices === 'object') {
    const value = toFiniteNumber((prices as Record<string, unknown>).reorder_level);
    if (value > 0) {
      return value;
    }
  }

  return LOW_STOCK_THRESHOLD;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
};

const getReorderQuantity = (product: InventoryProduct) => {
  const target = Math.max(LOW_STOCK_THRESHOLD, Number(product.reorder_level || 0));
  return Math.max(target - Number(product.stock || 0), 0);
};

export default function Inventory() {
  const { user } = useAuth();
  const canAdjustStock = user?.role === 'OWNER' || user?.role === 'ACCOUNTANT';

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [traversalCategoryId, setTraversalCategoryId] = useState('');
  const [traversalBrandId, setTraversalBrandId] = useState('');
  const [traversalModelId, setTraversalModelId] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [variantSort, setVariantSort] = useState<VariantSortOption>('risk-first');
  const [isTraversalHydrated, setIsTraversalHydrated] = useState(false);
  const [variantAdjustState, setVariantAdjustState] = useState<VariantAdjustState>({ isOpen: false });
  const [variantAdjustType, setVariantAdjustType] = useState<StockAdjustmentType>('add');
  const [variantAdjustQuantity, setVariantAdjustQuantity] = useState(1);
  const [variantAdjustNote, setVariantAdjustNote] = useState('');
  const [variantAdjustError, setVariantAdjustError] = useState('');
  const [isVariantAdjusting, setIsVariantAdjusting] = useState(false);
  const [page, setPage] = useState(1);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [historyEntries, setHistoryEntries] = useState<StockHistoryEntry[]>([]);
  const [historyProductId, setHistoryProductId] = useState('');
  const [modalState, setModalState] = useState<{ isOpen: boolean; initialProductId?: string }>({
    isOpen: false,
  });

  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();

  const modelsQuery = useQuery<ModelRecord[]>({
    queryKey: ['inventory', 'models', traversalBrandId],
    enabled: Boolean(traversalBrandId),
    queryFn: async () => {
      const payload = await apiGet(`/models?brandId=${traversalBrandId}`);
      return normalizeListPayload<ModelRecord>(payload);
    },
  });

  const variantsQuery = useQuery<VariantRecord[]>({
    queryKey: ['inventory', 'variants', traversalModelId],
    enabled: Boolean(traversalModelId),
    queryFn: async () => {
      const payload = await apiGet(`/variants?modelId=${traversalModelId}`);
      return normalizeListPayload<VariantRecord>(payload);
    },
  });

  const updateProduct = useUpdateProduct();

  const categories = useMemo<CategoryRecord[]>(() => {
    const payload = (categoriesQuery.data || []) as Array<Record<string, unknown>>;

    return payload
      .filter((item) => String(item.is_deleted) !== 'true')
      .map((item) => ({
        id: normalizeText(item.id),
        name: normalizeText(item.name),
        is_deleted: item.is_deleted as boolean | string | undefined,
      }))
      .filter((item) => item.id && item.name)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [categoriesQuery.data]);

  const brands = useMemo<BrandRecord[]>(() => {
    const payload = (brandsQuery.data || []) as Array<Record<string, unknown>>;

    return payload
      .filter((item) => String(item.is_deleted) !== 'true')
      .map((item) => ({
        id: normalizeText(item.id),
        name: normalizeText(item.name),
        category_id: normalizeText(item.category_id),
        is_deleted: item.is_deleted as boolean | string | undefined,
      }))
      .filter((item) => item.id && item.name && item.category_id);
  }, [brandsQuery.data]);

  const scopedBrands = useMemo(() => {
    if (!traversalCategoryId) {
      return [];
    }

    return brands
      .filter((brand) => brand.category_id === traversalCategoryId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [brands, traversalCategoryId]);

  const models = useMemo<ModelRecord[]>(() => {
    const payload = (modelsQuery.data || []) as Array<Record<string, unknown>>;

    return payload
      .filter((item) => String(item.is_deleted) !== 'true')
      .map((item) => ({
        id: normalizeText(item.id),
        name: normalizeText(item.name),
        brand_id: normalizeText(item.brand_id),
        is_deleted: item.is_deleted as boolean | string | undefined,
      }))
      .filter((item) => item.id && item.name)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [modelsQuery.data]);

  const variants = useMemo<VariantRecord[]>(() => {
    const payload = (variantsQuery.data || []) as Array<Record<string, unknown>>;

    return payload
      .filter((item) => String(item.is_deleted) !== 'true')
      .map((item) => ({
        id: normalizeText(item.id),
        model_id: normalizeText(item.model_id),
        variant_name: normalizeText(item.variant_name),
        stock: toFiniteNumber(item.stock),
        purchase_price: toFiniteNumber(item.purchase_price),
        selling_price: toFiniteNumber(item.selling_price),
        reorder_level: toFiniteNumber(item.reorder_level),
        is_deleted: item.is_deleted as boolean | string | undefined,
      }))
      .filter((item) => item.id && item.variant_name);
  }, [variantsQuery.data]);

  const traversalVariants = useMemo(() => {
    const query = variantSearch.trim().toLowerCase();
    const filtered = variants.filter((variant) => {
      if (!query) {
        return true;
      }

      return variant.variant_name.toLowerCase().includes(query);
    });

    return [...filtered].sort((left, right) => {
      if (variantSort === 'stock-asc') {
        return left.stock - right.stock;
      }

      if (variantSort === 'stock-desc') {
        return right.stock - left.stock;
      }

      if (variantSort === 'name-asc') {
        return left.variant_name.localeCompare(right.variant_name);
      }

      if (variantSort === 'name-desc') {
        return right.variant_name.localeCompare(left.variant_name);
      }

      const leftRisk = left.stock - Math.max(left.reorder_level, LOW_STOCK_THRESHOLD);
      const rightRisk = right.stock - Math.max(right.reorder_level, LOW_STOCK_THRESHOLD);
      return leftRisk - rightRisk;
    });
  }, [variants, variantSearch, variantSort]);

  const selectedTraversalModelName =
    models.find((item) => item.id === traversalModelId)?.name || 'Selected model';

  const products = useMemo<InventoryProduct[]>(() => {
    const rawProducts = (productsQuery.data || []) as Array<Record<string, unknown>>;

    return rawProducts
      .map((rawProduct) => {
        const id = normalizeText(rawProduct.id);
        const sku = normalizeText(rawProduct.sku) || id.slice(0, 8).toUpperCase();
        const name = normalizeText(rawProduct.name) || 'Unnamed Product';
        const brand = normalizeText(rawProduct.brand) || 'Unknown Brand';

        return {
          id,
          sku,
          name,
          brand,
          category_name: parseCategoryName(rawProduct),
          stock: toFiniteNumber(rawProduct.stock),
          reorder_level: parseReorderLevel(rawProduct),
          purchase_price: toFiniteNumber(rawProduct.purchase_price),
          selling_price: toFiniteNumber(rawProduct.selling_price),
          updated_at: normalizeText(rawProduct.updated_at || rawProduct.updatedAt) || undefined,
        };
      })
      .filter((product) => product.id && product.name);
  }, [productsQuery.data]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (lowStockOnly && Number(product.stock || 0) >= LOW_STOCK_THRESHOLD) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category_name.toLowerCase().includes(query)
      );
    });
  }, [products, search, lowStockOnly]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => Number(product.stock || 0) < LOW_STOCK_THRESHOLD);
  }, [products]);

  const reorderAlerts = useMemo(() => {
    return lowStockProducts
      .map((product) => ({
        ...product,
        reorderQuantity: getReorderQuantity(product),
      }))
      .sort((left, right) => right.reorderQuantity - left.reorderQuantity)
      .slice(0, 8);
  }, [lowStockProducts]);

  const historyRows = useMemo(() => {
    if (!historyProductId) {
      return historyEntries;
    }

    return historyEntries.filter((entry) => entry.productId === historyProductId);
  }, [historyEntries, historyProductId]);

  const selectedHistoryItemName = useMemo(() => {
    if (!historyProductId) {
      return '';
    }

    const matchedProduct = products.find((item) => item.id === historyProductId);
    if (matchedProduct) {
      return matchedProduct.name;
    }

    const matchedVariant = variants.find((item) => item.id === historyProductId);
    return matchedVariant ? `Variant: ${matchedVariant.variant_name}` : 'selected item';
  }, [historyProductId, products, variants]);

  const totalUnits = useMemo(() => {
    return products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((product) => Number(product.stock || 0) <= 0).length;
  }, [products]);

  const inventoryValue = useMemo(() => {
    return products.reduce(
      (sum, product) => sum + Number(product.stock || 0) * Number(product.selling_price || 0),
      0
    );
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsTraversalHydrated(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(INVENTORY_TRAVERSAL_STORAGE_KEY);
      if (!raw) {
        setIsTraversalHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as PersistedTraversalState;
      const nextCategoryId = normalizeText(parsed?.categoryId);
      const nextBrandId = nextCategoryId ? normalizeText(parsed?.brandId) : '';
      const nextModelId = nextCategoryId && nextBrandId ? normalizeText(parsed?.modelId) : '';
      const nextSort = isVariantSortOption(parsed?.variantSort) ? parsed.variantSort : 'risk-first';

      setTraversalCategoryId(nextCategoryId);
      setTraversalBrandId(nextBrandId);
      setTraversalModelId(nextModelId);
      setVariantSort(nextSort);
    } catch {
      window.localStorage.removeItem(INVENTORY_TRAVERSAL_STORAGE_KEY);
    } finally {
      setIsTraversalHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isTraversalHydrated || typeof window === 'undefined') {
      return;
    }

    const payload: PersistedTraversalState = {
      categoryId: traversalCategoryId,
      brandId: traversalCategoryId ? traversalBrandId : '',
      modelId: traversalCategoryId && traversalBrandId ? traversalModelId : '',
      variantSort,
    };

    window.localStorage.setItem(INVENTORY_TRAVERSAL_STORAGE_KEY, JSON.stringify(payload));
  }, [
    isTraversalHydrated,
    traversalCategoryId,
    traversalBrandId,
    traversalModelId,
    variantSort,
  ]);

  useEffect(() => {
    if (!isTraversalHydrated || categoriesQuery.isLoading || !traversalCategoryId) {
      return;
    }

    const isKnownCategory = categories.some((category) => category.id === traversalCategoryId);
    if (!isKnownCategory) {
      setTraversalCategoryId('');
      setTraversalBrandId('');
      setTraversalModelId('');
    }
  }, [isTraversalHydrated, categoriesQuery.isLoading, categories, traversalCategoryId]);

  useEffect(() => {
    if (!isTraversalHydrated || brandsQuery.isLoading || !traversalBrandId) {
      return;
    }

    const isKnownBrand = scopedBrands.some((brand) => brand.id === traversalBrandId);
    if (!isKnownBrand) {
      setTraversalBrandId('');
      setTraversalModelId('');
    }
  }, [isTraversalHydrated, brandsQuery.isLoading, scopedBrands, traversalBrandId]);

  useEffect(() => {
    if (!isTraversalHydrated || modelsQuery.isLoading || !traversalModelId) {
      return;
    }

    const isKnownModel = models.some((model) => model.id === traversalModelId);
    if (!isKnownModel) {
      setTraversalModelId('');
    }
  }, [isTraversalHydrated, modelsQuery.isLoading, models, traversalModelId]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, lowStockOnly]);

  useEffect(() => {
    setVariantSearch('');
  }, [traversalModelId]);

  const openStockModal = (productId?: string) => {
    setModalState({
      isOpen: true,
      initialProductId: productId,
    });
    updateProduct.reset();
  };

  const closeStockModal = () => {
    setModalState({ isOpen: false });
    updateProduct.reset();
  };

  const openVariantAdjustModal = (variant: VariantRecord) => {
    setVariantAdjustState({ isOpen: true, variant });
    setVariantAdjustType('add');
    setVariantAdjustQuantity(1);
    setVariantAdjustNote('');
    setVariantAdjustError('');
  };

  const closeVariantAdjustModal = () => {
    setVariantAdjustState({ isOpen: false });
    setVariantAdjustType('add');
    setVariantAdjustQuantity(1);
    setVariantAdjustNote('');
    setVariantAdjustError('');
  };

  const handleSaveAdjustment = async (payload: StockAdjustmentPayload) => {
    const product = products.find((item) => item.id === payload.productId);

    if (!product) {
      throw new Error('Selected product is no longer available. Refresh and try again.');
    }

    try {
      await updateProduct.mutateAsync({
        id: payload.productId,
        data: {
          stock: payload.nextStock,
        },
      });
    } catch (error: any) {
      setNotification({
        id: Date.now(),
        title: 'Stock Update Failed',
        message: String(error?.message || 'Could not update stock at this time.'),
        type: 'error',
      });
      throw error;
    }

    const delta = payload.nextStock - payload.previousStock;

    setHistoryEntries((previous) => {
      const next = [
        {
          id: `${Date.now()}-${payload.productId}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          previousStock: payload.previousStock,
          nextStock: payload.nextStock,
          delta,
          adjustmentType: payload.adjustmentType,
          note: payload.note,
          timestamp: new Date().toISOString(),
          actor: String(user?.role || 'SYSTEM'),
        },
        ...previous,
      ];

      return next.slice(0, 120);
    });

    setHistoryProductId(product.id);
    setNotification({
      id: Date.now(),
      title: 'Stock Updated',
      message: `${product.name} • ${delta >= 0 ? '+' : ''}${formatNumber(delta)} units`,
      type: 'success',
    });
    closeStockModal();
  };

  const handleSaveVariantAdjustment = async () => {
    const selectedVariant = variantAdjustState.variant;
    if (!selectedVariant) {
      return;
    }

    const normalizedQuantity = Math.floor(toFiniteNumber(variantAdjustQuantity));
    const currentStock = Number(selectedVariant.stock || 0);

    if (variantAdjustType !== 'set' && normalizedQuantity <= 0) {
      setVariantAdjustError('Quantity must be at least 1 for add or reduce actions.');
      return;
    }

    if (variantAdjustType === 'set' && normalizedQuantity < 0) {
      setVariantAdjustError('New stock level cannot be negative.');
      return;
    }

    const nextStock =
      variantAdjustType === 'add'
        ? currentStock + normalizedQuantity
        : variantAdjustType === 'reduce'
          ? currentStock - normalizedQuantity
          : normalizedQuantity;

    if (nextStock < 0) {
      setVariantAdjustError('Stock cannot become negative.');
      return;
    }

    setIsVariantAdjusting(true);
    setVariantAdjustError('');

    try {
      const updatePayload: Record<string, string | number> = {
        variant_name: selectedVariant.variant_name,
        stock: nextStock,
      };

      const purchasePrice = Number(selectedVariant.purchase_price);
      const sellingPrice = Number(selectedVariant.selling_price);
      const reorderLevel = Number(selectedVariant.reorder_level);

      if (Number.isFinite(purchasePrice) && purchasePrice > 0) {
        updatePayload.purchase_price = purchasePrice;
      }

      if (Number.isFinite(sellingPrice) && sellingPrice > 0) {
        updatePayload.selling_price = sellingPrice;
      }

      if (Number.isFinite(reorderLevel) && reorderLevel >= 0) {
        updatePayload.reorder_level = reorderLevel;
      }

      await apiPut(`/variants/${selectedVariant.id}`, updatePayload);

      await Promise.all([variantsQuery.refetch(), productsQuery.refetch()]);

      const delta = nextStock - currentStock;
      setHistoryEntries((previous) => {
        const next = [
          {
            id: `${Date.now()}-${selectedVariant.id}`,
            productId: selectedVariant.id,
            productName: `Variant: ${selectedVariant.variant_name}`,
            sku: selectedTraversalModelName,
            previousStock: currentStock,
            nextStock,
            delta,
            adjustmentType: variantAdjustType,
            note: normalizeText(variantAdjustNote) || undefined,
            timestamp: new Date().toISOString(),
            actor: String(user?.role || 'SYSTEM'),
          },
          ...previous,
        ];

        return next.slice(0, 120);
      });

      setHistoryProductId(selectedVariant.id);
      setNotification({
        id: Date.now(),
        title: 'Variant Stock Updated',
        message: `${selectedVariant.variant_name} • ${delta >= 0 ? '+' : ''}${formatNumber(delta)} units`,
        type: 'success',
      });
      closeVariantAdjustModal();
    } catch (error: any) {
      setVariantAdjustError(String(error?.message || 'Failed to update variant stock.'));
      setNotification({
        id: Date.now(),
        title: 'Variant Update Failed',
        message: String(error?.message || 'Could not update variant stock.'),
        type: 'error',
      });
    } finally {
      setIsVariantAdjusting(false);
    }
  };

  const handleRefresh = () => {
    productsQuery.refetch();
    categoriesQuery.refetch();
    brandsQuery.refetch();

    if (traversalBrandId) {
      modelsQuery.refetch();
    }

    if (traversalModelId) {
      variantsQuery.refetch();
    }
  };

  const variantCurrentStock = Number(variantAdjustState.variant?.stock || 0);
  const variantNextStockPreview =
    variantAdjustType === 'add'
      ? variantCurrentStock + Math.floor(toFiniteNumber(variantAdjustQuantity))
      : variantAdjustType === 'reduce'
        ? variantCurrentStock - Math.floor(toFiniteNumber(variantAdjustQuantity))
        : Math.floor(toFiniteNumber(variantAdjustQuantity));

  const mutationError = (updateProduct.error as { message?: string } | null)?.message || '';

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

      <div className={styles.inventoryContainer}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Tracked SKUs" value={formatNumber(products.length)} icon={<Boxes />} />
          <StatCard title="Units In Stock" value={formatNumber(totalUnits)} icon={<PackagePlus />} />
          <StatCard title="Low Stock Alerts" value={formatNumber(lowStockProducts.length)} icon={<AlertTriangle />} />
          <StatCard title="Inventory Value" value={`₹${formatNumber(inventoryValue)}`} icon={<IndianRupee />} />
        </div>

        <InventoryHeader
          search={search}
          lowStockOnly={lowStockOnly}
          lowStockCount={lowStockProducts.length}
          disableAddStock={!canAdjustStock || products.length === 0}
          onSearchChange={setSearch}
          onLowStockToggle={setLowStockOnly}
          onAddStockClick={() => openStockModal()}
          onRefresh={handleRefresh}
        />

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Traversal: Category to Model to Variant</h3>
            <span className={styles.panelCount}>{traversalVariants.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <AppSelect
              label="Category"
              value={traversalCategoryId}
              onChange={(value) => {
                const nextCategoryId = String(value);
                setTraversalCategoryId(nextCategoryId);
                setTraversalBrandId('');
                setTraversalModelId('');
              }}
              options={[
                { label: 'Select Category', value: '' },
                ...categories.map((item) => ({ label: item.name, value: item.id })),
              ]}
            />

            <AppSelect
              label="Brand"
              value={traversalBrandId}
              onChange={(value) => {
                setTraversalBrandId(String(value));
                setTraversalModelId('');
              }}
              options={[
                { label: traversalCategoryId ? 'Select Brand' : 'Select Category First', value: '' },
                ...scopedBrands.map((item) => ({ label: item.name, value: item.id })),
              ]}
              disabled={!traversalCategoryId}
            />

            <AppSelect
              label="Model"
              value={traversalModelId}
              onChange={(value) => setTraversalModelId(String(value))}
              options={[
                { label: traversalBrandId ? 'Select Model' : 'Select Brand First', value: '' },
                ...models.map((item) => ({ label: item.name, value: item.id })),
              ]}
              disabled={!traversalBrandId}
            />

            <AppInput
              label="Variant Search"
              value={variantSearch}
              onChange={(value) => setVariantSearch(String(value))}
              placeholder="Search variant type"
              disabled={!traversalModelId}
            />

            <AppSelect
              label="Variant Sort"
              value={variantSort}
              onChange={(value) => setVariantSort(String(value) as VariantSortOption)}
              options={[
                { label: 'Risk First', value: 'risk-first' },
                { label: 'Stock High to Low', value: 'stock-desc' },
                { label: 'Stock Low to High', value: 'stock-asc' },
                { label: 'Name A to Z', value: 'name-asc' },
                { label: 'Name Z to A', value: 'name-desc' },
              ]}
              disabled={!traversalModelId}
            />
          </div>

          {modelsQuery.isLoading || variantsQuery.isLoading ? (
            <div className="mt-4">
              <LoadingState type="skeleton" variant="table" />
            </div>
          ) : null}

          {modelsQuery.error || variantsQuery.error ? (
            <div className="mt-4">
              <ErrorState
                title="Traversal Load Failed"
                message={
                  (modelsQuery.error as { message?: string } | null)?.message ||
                  (variantsQuery.error as { message?: string } | null)?.message ||
                  'Failed to load model and variant traversal data.'
                }
                onRetry={() => {
                  if (traversalBrandId) {
                    modelsQuery.refetch();
                  }
                  if (traversalModelId) {
                    variantsQuery.refetch();
                  }
                }}
              />
            </div>
          ) : null}

          {!modelsQuery.isLoading && !variantsQuery.isLoading && !modelsQuery.error && !variantsQuery.error ? (
            traversalModelId ? (
              traversalVariants.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Variant Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Reorder Level</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Selling Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950/40">
                      {traversalVariants.map((variant) => {
                        const threshold = Math.max(Number(variant.reorder_level || 0), LOW_STOCK_THRESHOLD);
                        const isOutOfStock = Number(variant.stock || 0) <= 0;
                        const isLowStock = Number(variant.stock || 0) < threshold;

                        return (
                          <tr key={variant.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{variant.variant_name}</td>
                            <td className={`px-4 py-3 text-sm ${isLowStock ? 'font-semibold text-rose-600 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
                              {formatNumber(variant.stock)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{formatNumber(variant.reorder_level)}</td>
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">₹{formatNumber(variant.selling_price)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  isOutOfStock
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                    : isLowStock
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                }`}
                              >
                                {isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'Healthy'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex flex-wrap gap-2">
                                <AppButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openVariantAdjustModal(variant)}
                                  disabled={!canAdjustStock}
                                >
                                  Adjust
                                </AppButton>
                                <AppButton variant="ghost" size="sm" onClick={() => setHistoryProductId(variant.id)}>
                                  History
                                </AppButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    title="No variants found"
                    description="Try a different model or adjust variant search and sorting."
                  />
                </div>
              )
            ) : (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                Select category, brand, and model to traverse variant types.
              </p>
            )
          ) : null}
        </section>

        {productsQuery.isLoading ? <LoadingState type="skeleton" variant="table" /> : null}
        {productsQuery.error ? (
          <ErrorState
            title="Failed to load inventory"
            message={(productsQuery.error as { message?: string })?.message || 'Unknown error'}
            onRetry={handleRefresh}
          />
        ) : null}

        {!productsQuery.isLoading && !productsQuery.error ? (
          <>
            <div className={styles.tableWrap}>
              <InventoryTable
                products={pagedProducts}
                loading={false}
                error={undefined}
                page={page}
                total={filteredProducts.length}
                limit={ITEMS_PER_PAGE}
                onPageChange={setPage}
                onAdjustStock={(product) => openStockModal(product.id)}
                onViewHistory={(product) => setHistoryProductId(product.id)}
              />
            </div>

            <div className={styles.insightsGrid}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>
                    <AlertTriangle className="h-4 w-4" />
                    Reorder Alerts
                  </h3>
                  <span className={styles.panelCount}>{reorderAlerts.length}</span>
                </div>

                {reorderAlerts.length ? (
                  <div className={styles.alertList}>
                    {reorderAlerts.map((item) => (
                      <article key={item.id} className={styles.alertItem}>
                        <div>
                          <p className={styles.alertTitle}>{item.name}</p>
                          <p className={styles.alertMeta}>
                            {item.sku} • In stock {formatNumber(item.stock)} • Reorder {formatNumber(item.reorderQuantity)}
                          </p>
                        </div>
                        <AppButton
                          variant="outline"
                          size="sm"
                          onClick={() => openStockModal(item.id)}
                          disabled={!canAdjustStock}
                        >
                          Restock
                        </AppButton>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No reorder alerts"
                    description="All products are above the low-stock threshold right now."
                  />
                )}
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>
                    Stock History
                  </h3>
                  <span className={styles.panelCount}>{historyRows.length}</span>
                </div>

                {historyEntries.length ? (
                  <div className={styles.historyToolbar}>
                    <p className={styles.historyHint}>
                      {historyProductId
                        ? `Showing updates for ${selectedHistoryItemName || 'selected item'}`
                        : 'Showing all stock updates from this session'}
                    </p>
                    {historyProductId ? (
                      <AppButton variant="ghost" size="sm" onClick={() => setHistoryProductId('')}>
                        Show All
                      </AppButton>
                    ) : null}
                  </div>
                ) : null}

                {historyRows.length ? (
                  <div className={styles.historyList}>
                    {historyRows.map((entry) => (
                      <article key={entry.id} className={styles.historyItem}>
                        <p className={styles.historyTitle}>
                          {entry.productName} ({entry.sku})
                        </p>
                        <p className={styles.historyMeta}>
                          {formatNumber(entry.previousStock)} to {formatNumber(entry.nextStock)} ({entry.delta >= 0 ? '+' : ''}
                          {formatNumber(entry.delta)}) • {entry.adjustmentType}
                        </p>
                        <p className={styles.historyMeta}>
                          {formatDateTime(entry.timestamp)} • {entry.actor}
                          {entry.note ? ` • ${entry.note}` : ''}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No stock changes yet"
                    description="Stock adjustments you make here will appear in this history panel."
                  />
                )}
              </section>
            </div>

            {outOfStockCount > 0 ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">
                {formatNumber(outOfStockCount)} products are currently out of stock and need immediate restocking.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <StockModal
        isOpen={modalState.isOpen}
        products={products}
        initialProductId={modalState.initialProductId}
        loading={updateProduct.isPending}
        error={mutationError || undefined}
        onClose={closeStockModal}
        onSave={handleSaveAdjustment}
      />

      <Modal
        isOpen={variantAdjustState.isOpen}
        onClose={closeVariantAdjustModal}
        title="Adjust Variant Stock"
        size="md"
      >
        <div className="space-y-4">
          {variantAdjustError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {variantAdjustError}
            </div>
          ) : null}

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="font-medium text-slate-700 dark:text-slate-200">Variant: {variantAdjustState.variant?.variant_name || '-'}</p>
            <p className="text-slate-600 dark:text-slate-300">Current stock: {formatNumber(variantCurrentStock)}</p>
          </div>

          <AppSelect
            label="Adjustment Type"
            value={variantAdjustType}
            onChange={(value) => setVariantAdjustType(String(value) as StockAdjustmentType)}
            options={[
              { label: 'Add stock', value: 'add' },
              { label: 'Reduce stock', value: 'reduce' },
              { label: 'Set exact stock', value: 'set' },
            ]}
          />

          <AppInput
            label={variantAdjustType === 'set' ? 'New Stock Level' : 'Quantity'}
            type="number"
            value={variantAdjustQuantity}
            onChange={(value) => setVariantAdjustQuantity(Math.floor(toFiniteNumber(value)))}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Note (optional)</label>
            <textarea
              rows={3}
              value={variantAdjustNote}
              onChange={(event) => setVariantAdjustNote(event.target.value)}
              placeholder="Reason for this adjustment"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-700 dark:text-slate-200">
              New stock preview:{' '}
              <span className={variantNextStockPreview >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>
                {formatNumber(variantNextStockPreview)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AppButton variant="outline" onClick={closeVariantAdjustModal} disabled={isVariantAdjusting}>
              Cancel
            </AppButton>
            <AppButton variant="primary" onClick={handleSaveVariantAdjustment} loading={isVariantAdjusting}>
              Apply Variant Adjustment
            </AppButton>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
