import { Modal } from '@/components/ui';
import StockForm from './StockForm';
import type { InventoryProduct, StockAdjustmentPayload } from './types';

interface StockModalProps {
  isOpen: boolean;
  products: InventoryProduct[];
  initialProductId?: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: StockAdjustmentPayload) => Promise<void>;
}

export default function StockModal({
  isOpen,
  products,
  initialProductId,
  loading,
  error,
  onClose,
  onSave,
}: StockModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock" size="lg">
      <StockForm
        products={products}
        initialProductId={initialProductId}
        loading={loading}
        submitError={error}
        onCancel={onClose}
        onSubmit={onSave}
      />
    </Modal>
  );
}
