import { Modal } from '@/components/ui';
import ProductForm from './ProductForm';

interface CategoryItem {
  id: string;
  name: string;
}

interface BrandItem {
  id: string;
  name: string;
  category_id: string;
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

interface ProductsModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialProduct?: Partial<ProductSubmitPayload>;
  categories: CategoryItem[];
  brands: BrandItem[];
  loading?: boolean;
  onClose: () => void;
  onSave: (payload: ProductSubmitPayload) => Promise<void>;
}

export default function ProductsModal({
  isOpen,
  mode,
  initialProduct,
  categories,
  brands,
  loading,
  onClose,
  onSave,
}: ProductsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Product' : 'Edit Product'} size="lg">
      <ProductForm
        mode={mode}
        initialProduct={initialProduct}
        categories={categories}
        brands={brands}
        loading={loading}
        onCancel={onClose}
        onSubmit={onSave}
      />
    </Modal>
  );
}
